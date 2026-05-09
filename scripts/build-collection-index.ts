#!/usr/bin/env bun
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dir, '..');
const COLLECTION = join(ROOT, 'collection');
const OUT = join(COLLECTION, 'index.json');

const slugs = readdirSync(COLLECTION).filter((name) => {
  if (name.startsWith('_') || name.startsWith('.')) return false;
  return statSync(join(COLLECTION, name)).isDirectory();
});

const advisors = slugs
  .map((slug) => {
    try {
      return JSON.parse(readFileSync(join(COLLECTION, slug, 'advisor.json'), 'utf8'));
    } catch {
      return null;
    }
  })
  .filter((a): a is Record<string, unknown> => a !== null)
  .sort((a, b) => String(a.slug).localeCompare(String(b.slug)));

writeFileSync(OUT, `${JSON.stringify(advisors, null, 2)}\n`);
console.log(`✓ wrote ${advisors.length} entries to collection/index.json`);
