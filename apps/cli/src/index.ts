import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { Buffer } from 'node:buffer';
import process from 'node:process';

const VERSION = '0.1.0';
const REPO_BASE =
  process.env.MECLIS_RAW_BASE ?? 'https://raw.githubusercontent.com/woosal1337/meclis/main';
const COLLECTION_BASE = `${REPO_BASE}/collection`;
const SITE_URL = 'https://meclis.chele.bi';

const HOME = homedir();
const SKILLS_DIR = join(HOME, '.claude', 'skills', 'meclis');
const ADVISORS_DIR = join(SKILLS_DIR, 'advisors');
const VERSIONS_FILE = join(ADVISORS_DIR, '.versions.json');
const MECLIS_REPO = join(HOME, 'Documents', 'GitHub', 'meclis');
const DEFAULT_SPRITE_DIR = join(MECLIS_REPO, 'assets', 'sprites');
const VIEWER_SPRITE_DIR = join(MECLIS_REPO, 'apps', 'web', 'public', 'assets', 'sprites');

const c = {
  bronze: (s: string) => `\x1b[38;5;180m${s}\x1b[0m`,
  glow: (s: string) => `\x1b[38;5;215m${s}\x1b[0m`,
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
};

type AdvisorJson = {
  slug: string;
  displayName: string;
  aliases?: string[];
  brief: string;
  tags: string[];
  era?: string;
  discipline?: string;
  version: string;
};

type Versions = Record<string, string>;

interface Flags {
  spriteDir: string;
  noSprite: boolean;
  yes: boolean;
  args: string[];
}

function parseFlags(argv: string[]): Flags {
  const flags: Flags = {
    spriteDir: DEFAULT_SPRITE_DIR,
    noSprite: false,
    yes: false,
    args: [],
  };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--sprite-dir') {
      flags.spriteDir = resolve(argv[i + 1] ?? DEFAULT_SPRITE_DIR);
      i += 1;
    } else if (a === '--no-sprite') flags.noSprite = true;
    else if (a === '-y' || a === '--yes') flags.yes = true;
    else flags.args.push(a);
  }
  return flags;
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch ${url} → ${res.status}`);
  return res.text();
}

async function fetchBinary(url: string): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch ${url} → ${res.status}`);
  return new Uint8Array(await res.arrayBuffer());
}

async function listIndex(): Promise<AdvisorJson[]> {
  const url = `${REPO_BASE}/collection/index.json`;
  try {
    const txt = await fetchText(url);
    return JSON.parse(txt) as AdvisorJson[];
  } catch {}

  const apiUrl = 'https://api.github.com/repos/woosal1337/meclis/contents/collection';
  const res = await fetch(apiUrl);
  if (!res.ok) throw new Error(`could not list collection (${res.status})`);
  type Entry = { name: string; type: string };
  const entries = (await res.json()) as Entry[];
  const slugs = entries
    .filter((e) => e.type === 'dir' && !e.name.startsWith('_') && !e.name.startsWith('.'))
    .map((e) => e.name);
  const advisors: AdvisorJson[] = [];
  for (const slug of slugs) {
    try {
      const meta = JSON.parse(await fetchText(`${COLLECTION_BASE}/${slug}/advisor.json`));
      advisors.push(meta);
    } catch {}
  }
  return advisors;
}

function readVersions(): Versions {
  if (!existsSync(VERSIONS_FILE)) return {};
  try {
    return JSON.parse(readFileSync(VERSIONS_FILE, 'utf8')) as Versions;
  } catch {
    return {};
  }
}

function writeVersions(versions: Versions) {
  mkdirSync(dirname(VERSIONS_FILE), { recursive: true });
  writeFileSync(VERSIONS_FILE, `${JSON.stringify(versions, null, 2)}\n`);
}

function resolveSlug(input: string, advisors: AdvisorJson[]): AdvisorJson | undefined {
  const k = input.toLowerCase();
  for (const a of advisors) {
    if (a.slug === k) return a;
    if (a.aliases?.includes(k)) return a;
  }
  return undefined;
}

async function ask(prompt: string): Promise<string> {
  process.stdout.write(prompt);
  const reader = process.stdin;
  reader.resume();
  reader.setEncoding('utf8');
  return new Promise((res) => {
    reader.once('data', (chunk) => {
      reader.pause();
      res(String(chunk).trim());
    });
  });
}

async function cmdAdd(flags: Flags) {
  if (flags.args.length === 0) {
    console.error(c.red('usage: meclis add <slug> [<slug>…]'));
    process.exit(1);
  }
  const advisors = await listIndex();
  const versions = readVersions();
  const installed: string[] = [];
  const skipped: string[] = [];

  for (const input of flags.args) {
    const meta = resolveSlug(input, advisors);
    if (!meta) {
      console.error(c.red(`✘ '${input}' is not in the agora`));
      console.error(c.dim(`  browse: ${SITE_URL}`));
      continue;
    }

    const target = join(ADVISORS_DIR, `${meta.slug}.md`);
    if (existsSync(target) && !flags.yes) {
      const existing = versions[meta.slug] ?? '?';
      if (existing === meta.version) {
        console.log(c.dim(`· ${meta.slug} v${existing} already installed`));
        skipped.push(meta.slug);
        continue;
      }
      const ans = await ask(c.bronze(`overwrite ${meta.slug} v${existing} → v${meta.version}? [y/N] `));
      if (!/^y/i.test(ans)) {
        skipped.push(meta.slug);
        continue;
      }
    }

    const md = await fetchText(`${COLLECTION_BASE}/${meta.slug}/advisor.md`);
    mkdirSync(ADVISORS_DIR, { recursive: true });
    writeFileSync(target, md);

    if (!flags.noSprite) {
      try {
        const png = await fetchBinary(`${COLLECTION_BASE}/${meta.slug}/sprite.png`);
        const targets = [flags.spriteDir];
        if (existsSync(MECLIS_REPO) && flags.spriteDir === DEFAULT_SPRITE_DIR) {
          targets.push(VIEWER_SPRITE_DIR);
        }
        for (const dir of targets) {
          mkdirSync(dir, { recursive: true });
          writeFileSync(join(dir, `${meta.slug}.png`), Buffer.from(png));
        }
      } catch (err) {
        console.warn(c.dim(`  (sprite skipped: ${(err as Error).message})`));
      }
    }

    versions[meta.slug] = meta.version;
    writeVersions(versions);
    installed.push(meta.slug);
    console.log(`${c.green('✓')} ${c.bold(meta.displayName)} ${c.dim(`v${meta.version}`)}`);
  }

  if (installed.length) {
    console.log('');
    console.log(c.bronze(`installed ${installed.length} advisor${installed.length === 1 ? '' : 's'}.`));
    console.log(c.dim(`try: /meclis ${installed[0]} <your question>`));
  }
  if (skipped.length && !installed.length) process.exit(0);
}

async function cmdList() {
  const versions = readVersions();
  const installed = existsSync(ADVISORS_DIR)
    ? readdirSync(ADVISORS_DIR).filter((f) => f.endsWith('.md'))
    : [];

  if (installed.length === 0) {
    console.log(c.dim('no advisors installed.'));
    console.log(c.dim(`browse the agora: ${SITE_URL}`));
    return;
  }

  console.log(c.bronze('local council:'));
  for (const file of installed) {
    const slug = file.replace(/\.md$/, '');
    const v = versions[slug] ?? '?';
    console.log(`  ${c.bold(slug.padEnd(24))} ${c.dim(`v${v}`)}`);
  }
}

async function cmdSearch(flags: Flags) {
  const q = (flags.args[0] ?? '').toLowerCase().trim();
  const advisors = await listIndex();
  const matches = q
    ? advisors.filter((a) => {
        const hay = [a.slug, a.displayName, a.brief, ...(a.tags ?? []), a.discipline ?? ''].join(' ').toLowerCase();
        return hay.includes(q);
      })
    : advisors;
  if (matches.length === 0) {
    console.log(c.dim(`no advisors matching '${q}'.`));
    return;
  }
  for (const a of matches) {
    console.log(`${c.bronze(a.slug.padEnd(24))} ${c.bold(a.displayName)}`);
    console.log(c.dim(`  ${a.brief}`));
    if (a.tags?.length) console.log(c.dim(`  ${a.tags.map((t) => `#${t}`).join(' ')}`));
    console.log('');
  }
}

async function cmdRemove(flags: Flags) {
  if (flags.args.length === 0) {
    console.error(c.red('usage: meclis remove <slug>'));
    process.exit(1);
  }
  const advisors = await listIndex();
  const versions = readVersions();
  for (const input of flags.args) {
    const meta = resolveSlug(input, advisors) ?? {
      slug: input,
      displayName: input,
    } as AdvisorJson;
    const target = join(ADVISORS_DIR, `${meta.slug}.md`);
    if (!existsSync(target)) {
      console.log(c.dim(`· ${meta.slug} not installed`));
      continue;
    }
    rmSync(target);
    delete versions[meta.slug];
    for (const dir of [DEFAULT_SPRITE_DIR, VIEWER_SPRITE_DIR]) {
      const sprite = join(dir, `${meta.slug}.png`);
      if (existsSync(sprite)) rmSync(sprite);
    }
    console.log(`${c.green('✓')} removed ${meta.slug}`);
  }
  writeVersions(versions);
}

async function cmdUpdate(flags: Flags) {
  const versions = readVersions();
  const advisors = await listIndex();
  const installed = Object.keys(versions);
  if (installed.length === 0) {
    console.log(c.dim('nothing to update.'));
    return;
  }
  const updated: string[] = [];
  for (const slug of installed) {
    const meta = resolveSlug(slug, advisors);
    if (!meta) continue;
    if (meta.version === versions[slug]) continue;
    const md = await fetchText(`${COLLECTION_BASE}/${meta.slug}/advisor.md`);
    writeFileSync(join(ADVISORS_DIR, `${meta.slug}.md`), md);
    if (!flags.noSprite) {
      try {
        const png = await fetchBinary(`${COLLECTION_BASE}/${meta.slug}/sprite.png`);
        const targets = [flags.spriteDir];
        if (existsSync(MECLIS_REPO) && flags.spriteDir === DEFAULT_SPRITE_DIR) {
          targets.push(VIEWER_SPRITE_DIR);
        }
        for (const dir of targets) {
          mkdirSync(dir, { recursive: true });
          writeFileSync(join(dir, `${meta.slug}.png`), Buffer.from(png));
        }
      } catch {}
    }
    versions[slug] = meta.version;
    updated.push(`${slug} → v${meta.version}`);
  }
  writeVersions(versions);
  if (updated.length === 0) console.log(c.dim('all advisors at latest version.'));
  else for (const u of updated) console.log(`${c.green('✓')} ${u}`);
}

async function cmdInit() {
  mkdirSync(ADVISORS_DIR, { recursive: true });
  console.log(`${c.green('✓')} created ${ADVISORS_DIR}`);
  console.log('');
  console.log(c.bronze('next steps:'));
  console.log(`  1. clone meclis if you have not yet:`);
  console.log(c.dim('     git clone git@github.com:woosal1337/meclis.git ~/Documents/GitHub/meclis'));
  console.log(`  2. install hooks:`);
  console.log(c.dim('     cd ~/Documents/GitHub/meclis && bun install && bun run install-hooks'));
  console.log(`  3. add some advisors:`);
  console.log(c.dim('     meclis add paul-graham seth-godin robert-greene'));
}

function help() {
  console.log(`${c.bold('@meclis/cli')} ${c.dim(`v${VERSION}`)}`);
  console.log('');
  console.log(`browse the agora: ${c.bronze(SITE_URL)}`);
  console.log('');
  console.log(c.bronze('commands:'));
  console.log('  meclis add <slug>…       install advisors from the agora');
  console.log('  meclis list              show installed advisors');
  console.log('  meclis search <query>    fuzzy search the agora');
  console.log('  meclis update            refresh installed advisors');
  console.log('  meclis remove <slug>     uninstall');
  console.log('  meclis init              create skill folders');
  console.log('');
  console.log(c.bronze('flags:'));
  console.log('  --sprite-dir <path>     where sprites are written (default: meclis/assets/sprites)');
  console.log('  --no-sprite             skip sprite download');
  console.log('  -y, --yes               assume yes for prompts');
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || argv[0] === '-h' || argv[0] === '--help') {
    help();
    return;
  }
  if (argv[0] === '--version' || argv[0] === '-v') {
    console.log(VERSION);
    return;
  }

  const cmd = argv[0];
  const flags = parseFlags(argv.slice(1));

  try {
    switch (cmd) {
      case 'add':
        await cmdAdd(flags);
        break;
      case 'list':
      case 'ls':
        await cmdList();
        break;
      case 'search':
        await cmdSearch(flags);
        break;
      case 'remove':
      case 'rm':
        await cmdRemove(flags);
        break;
      case 'update':
      case 'upgrade':
        await cmdUpdate(flags);
        break;
      case 'init':
        await cmdInit();
        break;
      default:
        console.error(c.red(`unknown command '${cmd}'`));
        help();
        process.exit(1);
    }
  } catch (err) {
    console.error(c.red(`✘ ${(err as Error).message}`));
    process.exit(1);
  }
}

main();
