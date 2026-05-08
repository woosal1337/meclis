#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';

const SETTINGS_PATH = join(homedir(), '.claude/settings.json');
const HOOK_SCRIPT = resolve(new URL('./hooks/agent-event.mjs', import.meta.url).pathname);
const MARKER_TAG = '__meclis_v1';
const LEGACY_MARKERS = ['__council_stage_v1'];
const HOOK_COMMAND = `node ${HOOK_SCRIPT}`;
const TARGETS = ['PreToolUse', 'PostToolUse', 'SubagentStop'];

const args = process.argv.slice(2);
const uninstall = args.includes('--uninstall');
const yes = args.includes('--yes') || args.includes('-y');

main();

async function main() {
  if (!existsSync(SETTINGS_PATH)) {
    console.error(`no Claude Code settings.json at ${SETTINGS_PATH}`);
    process.exit(1);
  }

  const before = readFileSync(SETTINGS_PATH, 'utf8');
  let parsed;
  try {
    parsed = JSON.parse(before);
  } catch (err) {
    console.error(`failed to parse ${SETTINGS_PATH}: ${err.message}`);
    process.exit(2);
  }

  const next = uninstall ? removeOurEntries(parsed) : addOrUpdateEntries(parsed);
  const afterStr = JSON.stringify(next, null, 2) + '\n';

  if (afterStr.trim() === before.trim()) {
    console.log('settings.json already in the desired state. nothing to do.');
    return;
  }

  console.log(`would ${uninstall ? 'remove' : 'install'} meclis hooks in:`);
  console.log(`  ${SETTINGS_PATH}`);
  console.log('');
  console.log('hook script will run as:');
  console.log(`  ${HOOK_COMMAND}`);
  console.log('');
  console.log('preview of the changed sections:');
  printPreview(next.hooks ?? {});

  if (!yes) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const ans = (await rl.question('apply this change? [y/N] ')).trim().toLowerCase();
    rl.close();
    if (ans !== 'y' && ans !== 'yes') {
      console.log('aborted, no changes written.');
      return;
    }
  }

  const backup = `${SETTINGS_PATH}.meclis.bak`;
  copyFileSync(SETTINGS_PATH, backup);
  writeFileSync(SETTINGS_PATH, afterStr, 'utf8');
  console.log(`wrote ${SETTINGS_PATH}`);
  console.log(`backup at  ${backup}`);
  console.log('');
  console.log('next steps:');
  if (!uninstall) {
    console.log('  1. start the server: cd <repo> && pnpm dev:server');
    console.log('  2. open the viewer:  http://localhost:5173');
    console.log('  3. in claude code:   /meclis should I learn rust or go?');
  } else {
    console.log('  meclis hooks removed. server can stay running, the viewer just goes idle.');
  }
}

function addOrUpdateEntries(settings) {
  const next = structuredClone(settings);
  next.hooks ??= {};
  for (const target of TARGETS) {
    next.hooks[target] = ensureBlock(next.hooks[target]);
  }
  return next;
}

function ensureBlock(existing) {
  const arr = Array.isArray(existing) ? structuredClone(existing) : [];
  const filtered = arr.filter((g) => !groupHasMarker(g));
  filtered.push({
    matcher: 'Agent',
    hooks: [
      {
        type: 'command',
        command: HOOK_COMMAND,
        [MARKER_TAG]: true,
      },
    ],
  });
  return filtered;
}

function groupHasMarker(group) {
  if (!group || typeof group !== 'object') return false;
  if (!Array.isArray(group.hooks)) return false;
  return group.hooks.some((h) => {
    if (!h || typeof h !== 'object') return false;
    if (h[MARKER_TAG] === true) return true;
    return LEGACY_MARKERS.some((m) => h[m] === true);
  });
}

function removeOurEntries(settings) {
  const next = structuredClone(settings);
  if (!next.hooks) return next;
  for (const target of TARGETS) {
    const arr = next.hooks[target];
    if (!Array.isArray(arr)) continue;
    next.hooks[target] = arr.filter((g) => !groupHasMarker(g));
    if (next.hooks[target].length === 0) delete next.hooks[target];
  }
  if (Object.keys(next.hooks).length === 0) delete next.hooks;
  return next;
}

function printPreview(hooks) {
  for (const target of TARGETS) {
    if (!hooks[target]) {
      console.log(`  ${target}: (removed)`);
      continue;
    }
    const groups = hooks[target];
    const ours = groups.filter(groupHasMarker);
    console.log(`  ${target}: ${groups.length} group(s), ${ours.length} from meclis`);
  }
  console.log('');
}
