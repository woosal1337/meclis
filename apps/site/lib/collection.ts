import 'server-only';

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
} from 'node:fs';
import path from 'node:path';

const SITE_ROOT = path.join(process.cwd());
const COLLECTION_DIR = path.resolve(SITE_ROOT, '..', '..', 'collection');
const PUBLIC_COLLECTION = path.join(SITE_ROOT, 'public', 'c');

export type AdvisorJson = {
  slug: string;
  displayName: string;
  aliases?: string[];
  brief: string;
  tags: string[];
  era?: string;
  discipline?: string;
  contributors?: { name: string; github?: string }[];
  sources?: { title: string; url?: string; kind?: string }[];
  version: string;
};

export type AdvisorRecord = AdvisorJson & {
  body: string;
  references?: string;
  spritePath: string;
  thumbPath: string;
  installCommand: string;
  rawPackUrl: string;
};

const RAW_BASE =
  process.env.MECLIS_RAW_BASE ??
  'https://raw.githubusercontent.com/woosal1337/meclis/main/collection';

function ensurePublicAsset(slug: string, file: string): string {
  const src = path.join(COLLECTION_DIR, slug, file);
  if (!existsSync(src)) return '';
  const destDir = path.join(PUBLIC_COLLECTION, slug);
  mkdirSync(destDir, { recursive: true });
  const dest = path.join(destDir, file);
  try {
    const srcStat = statSync(src);
    const destStat = existsSync(dest) ? statSync(dest) : null;
    if (!destStat || destStat.mtimeMs < srcStat.mtimeMs) {
      copyFileSync(src, dest);
    }
  } catch {
    copyFileSync(src, dest);
  }
  return `/c/${slug}/${file}`;
}

function loadAdvisor(slug: string): AdvisorRecord | null {
  const dir = path.join(COLLECTION_DIR, slug);
  const jsonPath = path.join(dir, 'advisor.json');
  const mdPath = path.join(dir, 'advisor.md');
  if (!existsSync(jsonPath) || !existsSync(mdPath)) return null;

  const meta = JSON.parse(readFileSync(jsonPath, 'utf8')) as AdvisorJson;
  const body = readFileSync(mdPath, 'utf8');
  const refsPath = path.join(dir, 'references.md');
  const references = existsSync(refsPath) ? readFileSync(refsPath, 'utf8') : undefined;

  const spritePath = ensurePublicAsset(slug, 'sprite.png');
  const thumbPath = ensurePublicAsset(slug, 'sprite.thumb.png') || spritePath;

  return {
    ...meta,
    body,
    references,
    spritePath,
    thumbPath,
    installCommand: `bunx @meclis/cli add ${meta.slug}`,
    rawPackUrl: `${RAW_BASE}/${meta.slug}/advisor.md`,
  };
}

export function listSlugs(): string[] {
  if (!existsSync(COLLECTION_DIR)) return [];
  return readdirSync(COLLECTION_DIR)
    .filter((name) => !name.startsWith('_') && !name.startsWith('.'))
    .filter((name) => statSync(path.join(COLLECTION_DIR, name)).isDirectory())
    .filter((name) => existsSync(path.join(COLLECTION_DIR, name, 'advisor.json')));
}

export function getAllAdvisors(): AdvisorRecord[] {
  return listSlugs()
    .map(loadAdvisor)
    .filter((a): a is AdvisorRecord => a !== null)
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export function getAdvisor(slug: string): AdvisorRecord | null {
  return loadAdvisor(slug);
}

export function rawSpriteUrl(slug: string, file = 'sprite.png'): string {
  return `${RAW_BASE}/${slug}/${file}`;
}
