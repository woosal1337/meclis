import { InstallCommand } from '@/components/InstallCommand';
import { getAdvisor, listSlugs, rawSpriteUrl } from '@/lib/collection';
import { Markdown } from '@/lib/markdown';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface Params {
  params: { slug: string };
}

export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  return listSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: Params): Metadata {
  const a = getAdvisor(params.slug);
  if (!a) return {};
  const url = `https://meclis.chele.bi/advisor/${a.slug}`;
  return {
    title: a.displayName,
    description: a.brief,
    openGraph: {
      title: `${a.displayName} · meclis`,
      description: a.brief,
      url,
      type: 'profile',
      images: [
        {
          url: rawSpriteUrl(a.slug, 'sprite.thumb.png'),
          alt: a.displayName,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${a.displayName} · meclis`,
      description: a.brief,
      images: [rawSpriteUrl(a.slug, 'sprite.thumb.png')],
    },
  };
}

export default function AdvisorPage({ params }: Params) {
  const a = getAdvisor(params.slug);
  if (!a) notFound();

  return (
    <article className="space-y-10">
      <nav className="smallcaps text-[10px] text-parchment/50">
        <Link href="/" className="hover:text-bronze-glow no-underline">
          agora
        </Link>
        <span className="mx-2">/</span>
        <span className="text-parchment/80">{a.displayName.toLowerCase()}</span>
      </nav>

      <header className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8 items-start">
        <div className="stone-disc relative aspect-[3/4] w-full overflow-hidden">
          {a.spritePath ? (
            <Image
              src={a.spritePath}
              alt={a.displayName}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 280px"
              className="object-contain object-bottom pixelated p-3"
            />
          ) : null}
        </div>

        <div className="space-y-4">
          <p className="smallcaps text-bronze text-[11px]">
            {a.discipline ?? 'advisor'}
            {a.era ? <> · {a.era}</> : null}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl text-parchment leading-tight">
            {a.displayName}
          </h1>
          <p className="font-serif text-parchment/85 text-base sm:text-lg leading-relaxed">
            {a.brief}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {a.tags.map((t) => (
              <span
                key={t}
                className="smallcaps text-[9px] text-parchment/70 border border-bronze-deep/60 px-2 py-1"
              >
                {t}
              </span>
            ))}
          </div>
          <p className="text-xs text-parchment/50">
            v{a.version}
            {a.aliases?.length ? <> · aliases {a.aliases.join(', ')}</> : null}
          </p>
        </div>
      </header>

      <section className="stone p-5 sm:p-6 space-y-4">
        <p className="smallcaps text-bronze text-[10px]">install</p>
        <InstallCommand command={a.installCommand} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <a
            href={a.rawPackUrl}
            download={`${a.slug}.md`}
            className="block text-center smallcaps text-[10px] stone hover:stone--active py-3 no-underline text-parchment"
          >
            download advisor.md
          </a>
          <a
            href={rawSpriteUrl(a.slug, 'sprite.png')}
            download={`${a.slug}.png`}
            className="block text-center smallcaps text-[10px] stone hover:stone--active py-3 no-underline text-parchment"
          >
            download sprite.png
          </a>
        </div>
        <p className="text-xs text-parchment/55 leading-relaxed pt-1">
          the cli writes the pack to{' '}
          <code className="text-bronze">~/.claude/skills/meclis/advisors/{a.slug}.md</code> and the
          sprite to{' '}
          <code className="text-bronze">
            ~/Documents/GitHub/meclis/assets/sprites/{a.slug}.png
          </code>{' '}
          (override with{' '}
          <code className="text-bronze">--sprite-dir</code>).
        </p>
      </section>

      {a.sources && a.sources.length > 0 ? (
        <section className="space-y-3">
          <h2 className="smallcaps text-bronze text-[11px]">sources distilled</h2>
          <ul className="space-y-1 text-sm text-parchment/85">
            {a.sources.map((s, i) => (
              <li key={i}>
                <span className="smallcaps text-[9px] text-bronze/80 mr-2">{s.kind}</span>
                {s.url ? (
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-parchment hover:text-bronze-glow underline decoration-dashed underline-offset-4"
                  >
                    {s.title}
                  </a>
                ) : (
                  <span>{s.title}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="parchment p-6 sm:p-8 rounded-none">
        <Markdown source={a.body} skipFirstH1 />
      </section>

      {a.references ? (
        <section className="parchment p-6 sm:p-8">
          <h2 className="smallcaps text-bronze-deep text-[11px] mb-4">references</h2>
          <Markdown source={a.references} />
        </section>
      ) : null}
    </article>
  );
}
