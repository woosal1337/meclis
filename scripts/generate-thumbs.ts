#!/usr/bin/env bun
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const COLLECTION = join(import.meta.dir, '..', 'collection');
const THUMB_LONG_EDGE = 512;

const slugs = readdirSync(COLLECTION).filter((name) => {
  if (name.startsWith('_') || name.startsWith('.')) return false;
  const stat = statSync(join(COLLECTION, name));
  return stat.isDirectory();
});

let regen = 0;
for (const slug of slugs) {
  const sprite = join(COLLECTION, slug, 'sprite.png');
  const thumb = join(COLLECTION, slug, 'sprite.thumb.png');
  try {
    statSync(sprite);
  } catch {
    console.warn(`skip ${slug}: no sprite.png`);
    continue;
  }
  const r = spawnSync('sips', ['-Z', String(THUMB_LONG_EDGE), sprite, '--out', thumb], {
    stdio: 'inherit',
  });
  if (r.status === 0) regen += 1;
}
console.log(`regenerated ${regen} thumbnail(s)`);
