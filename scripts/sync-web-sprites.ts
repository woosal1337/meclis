#!/usr/bin/env bun
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dir, '..');
const COLLECTION = join(ROOT, 'collection');
const WEB_SPRITES = join(ROOT, 'apps', 'web', 'public', 'assets', 'sprites');
const ASSETS_SPRITES = join(ROOT, 'assets', 'sprites');

mkdirSync(WEB_SPRITES, { recursive: true });
mkdirSync(ASSETS_SPRITES, { recursive: true });

const slugs = readdirSync(COLLECTION).filter((name) => {
  if (name.startsWith('_') || name.startsWith('.')) return false;
  return statSync(join(COLLECTION, name)).isDirectory();
});

let synced = 0;
for (const slug of slugs) {
  const src = join(COLLECTION, slug, 'sprite.png');
  if (!existsSync(src)) continue;
  copyFileSync(src, join(WEB_SPRITES, `${slug}.png`));
  copyFileSync(src, join(ASSETS_SPRITES, `${slug}.png`));
  synced += 1;
}
console.log(`✓ synced ${synced} sprite(s) → apps/web/public/assets/sprites/ + assets/sprites/`);
