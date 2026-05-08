#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, mkdirSync, writeFileSync, unlinkSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';

const SERVER = process.env.MECLIS_URL ?? 'http://localhost:3001';
const SECRET = process.env.MECLIS_SECRET ?? 'local-only-meclis';
const ADVISOR_DIR =
  process.env.MECLIS_ADVISOR_DIR ?? join(homedir(), '.claude/skills/meclis/advisors');
const DEBUG = !!process.env.MECLIS_DEBUG;

const log = (...args) => {
  if (DEBUG) console.error('[meclis hook]', ...args);
};

main().catch((err) => {
  log('uncaught', err);
  process.exit(0);
});

async function main() {
  const payload = await readJsonStdin();
  if (!payload) return;

  const phase = mapPhase(payload.hook_event_name);
  if (!phase) {
    log('skip: unknown hook event', payload.hook_event_name);
    return;
  }

  if (payload.tool_name !== 'Agent') {
    log('skip: not Agent tool, got', payload.tool_name);
    return;
  }

  const prompt = payload.tool_input?.prompt ?? '';
  const advisor = identifyAdvisor(prompt);
  if (!advisor) {
    log('skip: prompt does not match any advisor pack');
    return;
  }

  const body = {
    secret: SECRET,
    phase,
    advisorId: advisor.id,
    displayName: advisor.displayName,
    userMessage: extractUserQuestion(prompt),
  };

  if (phase === 'pre-tool') {
    recordStart(advisor.id);
  }

  if (phase === 'post-tool') {
    body.fullSpeech = extractText(payload.tool_response);
    const dur = consumeDuration(advisor.id);
    if (typeof dur === 'number') body.durationMs = dur;
    const err = extractError(payload.tool_response);
    if (err) body.errorMessage = err;
  }

  await postEvent(body);
}

function extractUserQuestion(prompt) {
  if (typeof prompt !== 'string') return '';
  const m = prompt.match(/The user is asking:\s*\n([\s\S]+?)(?:\n\s*\n|\n\s*Mode:)/i);
  if (m && m[1]) return m[1].trim();
  return prompt.slice(0, 200).trim();
}

const PENDING_DIR = join(tmpdir(), 'meclis-pending');

function pendingPath(advisorId) {
  const safe = advisorId.replace(/[^a-z0-9_-]/gi, '_');
  return join(PENDING_DIR, `${safe}.json`);
}

function recordStart(advisorId) {
  try {
    mkdirSync(PENDING_DIR, { recursive: true });
    writeFileSync(pendingPath(advisorId), JSON.stringify({ startMs: Date.now() }));
  } catch (e) {
    log('failed to record start', e);
  }
}

function consumeDuration(advisorId) {
  try {
    const p = pendingPath(advisorId);
    if (!existsSync(p)) return undefined;
    const { startMs } = JSON.parse(readFileSync(p, 'utf8'));
    try { unlinkSync(p); } catch {}
    if (typeof startMs !== 'number') return undefined;
    return Date.now() - startMs;
  } catch (e) {
    log('failed to consume duration', e);
    return undefined;
  }
}

function readJsonStdin() {
  return new Promise((resolve) => {
    let raw = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      raw += chunk;
    });
    process.stdin.on('end', () => {
      if (!raw.trim()) return resolve(null);
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        log('invalid stdin json', e);
        resolve(null);
      }
    });
    process.stdin.on('error', () => resolve(null));
    setTimeout(() => resolve(null), 1500).unref?.();
  });
}

function mapPhase(name) {
  if (name === 'PreToolUse') return 'pre-tool';
  if (name === 'PostToolUse') return 'post-tool';
  if (name === 'SubagentStop') return 'subagent-stop';
  return null;
}

let advisorsCache = null;
function loadAdvisors() {
  if (advisorsCache) return advisorsCache;
  if (!existsSync(ADVISOR_DIR)) return (advisorsCache = []);
  const out = [];
  for (const f of readdirSync(ADVISOR_DIR)) {
    if (!f.endsWith('.md')) continue;
    if (f.startsWith('_')) continue;
    try {
      const body = readFileSync(join(ADVISOR_DIR, f), 'utf8');
      const m = body.match(/^# (.+)$/m);
      const displayName = m ? m[1].trim() : f.replace(/\.md$/, '');
      out.push({ id: f.replace(/\.md$/, ''), displayName });
    } catch (e) {
      log('failed to read pack', f, e);
    }
  }
  advisorsCache = out;
  return out;
}

function identifyAdvisor(prompt) {
  const advisors = loadAdvisors();
  const head = prompt.slice(0, 1500);
  for (const a of advisors) {
    const name = a.displayName;
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const patterns = [
      new RegExp(`(^|\\n)#\\s*${escaped}(\\s|$)`),
      new RegExp(`\\b(answering|speak|speaking)\\s+(AS|as)\\s+${escaped}\\b`),
    ];
    if (patterns.some((re) => re.test(head))) return a;
  }
  return null;
}

function extractText(toolResponse) {
  if (toolResponse == null) return undefined;
  if (typeof toolResponse === 'string') return toolResponse;
  if (typeof toolResponse?.text === 'string') return toolResponse.text;
  if (typeof toolResponse?.content === 'string') return toolResponse.content;
  if (Array.isArray(toolResponse?.content)) {
    return toolResponse.content
      .filter((c) => c?.type === 'text' || typeof c?.text === 'string')
      .map((c) => c.text)
      .filter(Boolean)
      .join('\n');
  }
  try {
    return JSON.stringify(toolResponse).slice(0, 10_000);
  } catch {
    return undefined;
  }
}

function extractError(toolResponse) {
  if (toolResponse?.is_error) {
    return typeof toolResponse?.error === 'string'
      ? toolResponse.error
      : (extractText(toolResponse) ?? 'agent error');
  }
  return null;
}

async function postEvent(body) {
  const ctrl = new AbortController();
  const timeoutId = setTimeout(() => ctrl.abort(), 1500);
  try {
    const r = await fetch(`${SERVER}/api/meclis/hooks/event`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!r.ok) log('server rejected', r.status, await r.text().catch(() => '?'));
    else log('event posted', body.phase, body.advisorId);
  } catch (e) {
    log('post failed (server not running?)', e?.message ?? e);
  } finally {
    clearTimeout(timeoutId);
  }
}
