#!/usr/bin/env bun
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dir, '..');
const COLLECTION = join(ROOT, 'collection');
const SCHEMA_PATH = join(COLLECTION, '_schema', 'advisor.schema.json');

const REQUIRED_SECTIONS = ['Identity', 'Philosophy', 'Voice rules'];
const REQUIRED_SPRITE_W = 896;
const REQUIRED_SPRITE_H = 1200;

type Advisor = {
  slug: string;
  displayName: string;
  brief: string;
  tags: string[];
  version: string;
  aliases?: string[];
};

const errors: string[] = [];
const warnings: string[] = [];

function fail(slug: string, msg: string) {
  errors.push(`✘ ${slug}: ${msg}`);
}

function warn(slug: string, msg: string) {
  warnings.push(`! ${slug}: ${msg}`);
}

const schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf8'));
const requiredKeys: string[] = schema.required ?? [];

const slugs = readdirSync(COLLECTION).filter((name) => {
  if (name.startsWith('_') || name.startsWith('.')) return false;
  return statSync(join(COLLECTION, name)).isDirectory();
});

if (slugs.length === 0) {
  console.error('no advisor folders under collection/');
  process.exit(1);
}

for (const slug of slugs) {
  const dir = join(COLLECTION, slug);

  let advisor: Advisor;
  try {
    advisor = JSON.parse(readFileSync(join(dir, 'advisor.json'), 'utf8')) as Advisor;
  } catch (err) {
    fail(slug, `advisor.json missing or invalid JSON (${(err as Error).message})`);
    continue;
  }

  for (const key of requiredKeys) {
    if (!(key in advisor)) fail(slug, `advisor.json missing required key '${key}'`);
  }

  if (advisor.slug !== slug) {
    fail(slug, `advisor.json.slug='${advisor.slug}' does not match folder name`);
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(advisor.slug)) {
    fail(slug, `slug must be kebab-case`);
  }
  if (!/^\d+\.\d+\.\d+$/.test(advisor.version ?? '')) {
    fail(slug, `version must be semver`);
  }
  if (advisor.brief && advisor.brief.length > 200) {
    fail(slug, `brief is ${advisor.brief.length} chars (max 200)`);
  }
  if (!Array.isArray(advisor.tags) || advisor.tags.length === 0) {
    fail(slug, `tags must be a non-empty array`);
  }

  let md: string;
  try {
    md = readFileSync(join(dir, 'advisor.md'), 'utf8');
  } catch {
    fail(slug, `advisor.md missing`);
    continue;
  }

  const h1Match = md.match(/^#\s+(.+?)\s*$/m);
  if (!h1Match) {
    fail(slug, `advisor.md has no H1 heading`);
  } else if (h1Match[1].trim() !== advisor.displayName) {
    fail(
      slug,
      `H1 '${h1Match[1].trim()}' does not match displayName '${advisor.displayName}'`,
    );
  }

  for (const section of REQUIRED_SECTIONS) {
    const re = new RegExp(`^##\\s+${section}\\b`, 'mi');
    if (!re.test(md)) warn(slug, `advisor.md missing recommended '## ${section}' section`);
  }

  const sprite = join(dir, 'sprite.png');
  try {
    statSync(sprite);
  } catch {
    fail(slug, `sprite.png missing`);
    continue;
  }

  const dims = await readPngDimensions(sprite);
  if (!dims) {
    warn(slug, `could not read sprite.png dimensions`);
  } else if (dims.width !== REQUIRED_SPRITE_W || dims.height !== REQUIRED_SPRITE_H) {
    fail(
      slug,
      `sprite.png is ${dims.width}×${dims.height}, expected ${REQUIRED_SPRITE_W}×${REQUIRED_SPRITE_H}`,
    );
  }

  try {
    statSync(join(dir, 'sprite.thumb.png'));
  } catch {
    warn(slug, `sprite.thumb.png missing — run \`bun run generate-thumbs\``);
  }
}

if (warnings.length) console.error(warnings.join('\n'));
if (errors.length) {
  console.error('');
  console.error(errors.join('\n'));
  console.error(`\nvalidation failed: ${errors.length} error(s)`);
  process.exit(1);
}
console.log(`✓ ${slugs.length} advisor(s) validated`);

async function readPngDimensions(path: string): Promise<{ width: number; height: number } | null> {
  const handle = Bun.file(path);
  const buf = new Uint8Array(await handle.arrayBuffer());
  if (buf.length < 24) return null;
  const sig = [137, 80, 78, 71, 13, 10, 26, 10];
  for (let i = 0; i < 8; i += 1) {
    if (buf[i] !== sig[i]) return null;
  }
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}
