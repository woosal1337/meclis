import { InstallCommand } from '@/components/InstallCommand';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'cli',
  description: 'Install meclis advisors with one command.',
};

const COMMANDS: { cmd: string; desc: string }[] = [
  { cmd: 'bunx @meclis/cli init', desc: 'install hooks and create skill folders. first-time only.' },
  { cmd: 'bunx @meclis/cli add paul-graham', desc: 'install one advisor by slug or alias.' },
  { cmd: 'bunx @meclis/cli add pg seth rg', desc: 'install several at once. aliases work.' },
  { cmd: 'bunx @meclis/cli list', desc: 'show installed advisors and their versions.' },
  { cmd: 'bunx @meclis/cli search stoic', desc: 'fuzzy search the public agora.' },
  { cmd: 'bunx @meclis/cli update', desc: 'refresh installed advisors to the latest pack version.' },
  { cmd: 'bunx @meclis/cli remove rg', desc: 'uninstall an advisor.' },
];

export default function CliPage() {
  return (
    <article className="space-y-10">
      <header className="space-y-3">
        <p className="smallcaps text-bronze text-[11px]">cli</p>
        <h1 className="font-display text-3xl text-parchment">@meclis/cli</h1>
        <p className="font-serif text-parchment/85 text-base leading-relaxed max-w-2xl">
          a tiny installer for meclis advisors. fetches packs and sprites from the public agora and
          writes them to your local skill folder.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="smallcaps text-bronze text-[11px]">quickstart</h2>
        <InstallCommand command="bunx @meclis/cli init" />
        <InstallCommand command="bunx @meclis/cli add paul-graham seth-godin robert-greene" />
        <p className="text-xs text-parchment/60">
          prefer npm? swap <code className="text-bronze">bunx</code> for{' '}
          <code className="text-bronze">npx</code>.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="smallcaps text-bronze text-[11px]">commands</h2>
        <ul className="space-y-3">
          {COMMANDS.map((c) => (
            <li key={c.cmd} className="stone p-4 space-y-2">
              <code className="block font-mono text-sm text-bronze-glow">{c.cmd}</code>
              <p className="text-sm text-parchment/80">{c.desc}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="parchment p-6 sm:p-8 space-y-4">
        <h2 className="smallcaps text-bronze-deep text-[11px]">where things land</h2>
        <ul className="space-y-1 font-mono text-[13px] text-ink">
          <li>~/.claude/skills/meclis/advisors/&lt;slug&gt;.md</li>
          <li>~/.claude/skills/meclis/advisors/.versions.json</li>
          <li>~/Documents/GitHub/meclis/assets/sprites/&lt;slug&gt;.png</li>
        </ul>
        <p className="text-sm text-ink/85">
          override sprite path with{' '}
          <code className="text-bronze-deep">--sprite-dir &lt;path&gt;</code>. opt out of sprite
          installs entirely with <code className="text-bronze-deep">--no-sprite</code>.
        </p>
      </section>

      <p className="text-xs text-parchment/60">
        looking for an advisor? <Link href="/" className="text-bronze hover:text-bronze-glow underline decoration-dashed">browse the agora</Link>.
      </p>
    </article>
  );
}
