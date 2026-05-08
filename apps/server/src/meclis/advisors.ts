import { readdir, readFile, stat } from 'node:fs/promises';
import { join, basename, extname } from 'node:path';
import type { AdvisorFull, AdvisorMeta } from '@meclis/shared';
import { env } from '../env.js';

async function loadOne(path: string): Promise<AdvisorFull | null> {
  const body = await readFile(path, 'utf-8');
  if (!body.trim()) return null;

  const id = basename(path, extname(path));
  const displayName = extractDisplayName(body) ?? humanize(id);
  const brief = extractBrief(body) ?? '';

  return {
    id,
    displayName,
    brief,
    systemPrompt: body,
  };
}

function extractDisplayName(body: string): string | undefined {
  const m = body.match(/^# (.+)$/m);
  return m?.[1]?.trim();
}

function extractBrief(body: string): string | undefined {
  const lines = body.split('\n');
  let pastHeading = false;
  const buf: string[] = [];
  for (const line of lines) {
    if (!pastHeading) {
      if (/^# /.test(line)) pastHeading = true;
      continue;
    }
    if (/^>/.test(line) || /^#+ /.test(line)) {
      if (buf.length) break;
      continue;
    }
    if (line.trim() === '') {
      if (buf.length) break;
      continue;
    }
    buf.push(line.trim());
    if (buf.length > 4) break;
  }
  const para = buf.join(' ').trim();
  return para.length > 0 ? para.slice(0, 280) : undefined;
}

function humanize(id: string): string {
  return id
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export async function loadAdvisors(): Promise<AdvisorFull[]> {
  let entries: string[] = [];
  try {
    entries = await readdir(env.ADVISOR_DIR);
  } catch (err) {
    console.warn(`[meclis] could not read advisor dir at ${env.ADVISOR_DIR}: ${(err as Error).message}`);
    return [];
  }

  const mdFiles = entries.filter((e) => e.endsWith('.md') && !e.startsWith('_'));
  const results: AdvisorFull[] = [];

  for (const file of mdFiles) {
    const fullPath = join(env.ADVISOR_DIR, file);
    try {
      const s = await stat(fullPath);
      if (!s.isFile()) continue;
      const advisor = await loadOne(fullPath);
      if (advisor) results.push(advisor);
    } catch (err) {
      console.warn(`[meclis] failed to load ${file}: ${(err as Error).message}`);
    }
  }

  return results.sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export function toMeta(a: AdvisorFull): AdvisorMeta {
  return { id: a.id, displayName: a.displayName, brief: a.brief, spriteSlug: a.spriteSlug };
}

export async function getAdvisors(): Promise<AdvisorFull[]> {
  return loadAdvisors();
}

export async function getAdvisor(id: string): Promise<AdvisorFull | undefined> {
  const all = await loadAdvisors();
  return all.find((a) => a.id === id);
}
