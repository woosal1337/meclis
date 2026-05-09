import Image from 'next/image';
import Link from 'next/link';
import { getAllAdvisors } from '@/lib/collection';

export const dynamic = 'force-static';

export default function HomePage() {
  const advisors = getAllAdvisors();

  return (
    <div className="space-y-14">
      <section className="text-center space-y-6 pt-4">
        <p className="smallcaps text-bronze text-[11px]">a symposium of advisors</p>
        <h1 className="font-display text-4xl sm:text-5xl text-parchment leading-tight">
          the meclis agora
        </h1>
        <p className="font-serif text-parchment/80 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          curated character packs for the{' '}
          <a
            href="https://github.com/woosal1337/meclis"
            target="_blank"
            rel="noopener noreferrer"
            className="text-bronze underline decoration-dashed underline-offset-4 hover:text-bronze-glow"
          >
            meclis
          </a>{' '}
          claude code skill. drop a thinker into your local council in one command.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/cli"
            className="inline-flex items-center gap-2 px-4 py-2 smallcaps text-[10px] stone hover:stone--active no-underline text-parchment"
          >
            cli quickstart
          </Link>
          <Link
            href="/contribute"
            className="inline-flex items-center gap-2 px-4 py-2 smallcaps text-[10px] stone hover:stone--active no-underline text-parchment"
          >
            add an advisor
          </Link>
        </div>
        <div className="laurel-rule pt-4">
          <span className="smallcaps text-bronze/70 text-[10px]">
            {advisors.length} advisor{advisors.length === 1 ? '' : 's'} on the stage
          </span>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {advisors.map((a) => (
          <Link
            key={a.slug}
            href={`/advisor/${a.slug}`}
            className="stone p-5 no-underline transition-colors flex flex-col gap-4 group"
          >
            <div className="stone-disc relative aspect-[3/4] w-full overflow-hidden">
              {a.thumbPath ? (
                <Image
                  src={a.thumbPath}
                  alt={a.displayName}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-contain object-bottom pixelated p-2"
                />
              ) : null}
            </div>
            <div className="space-y-2">
              <h2 className="font-display text-parchment text-lg leading-tight group-hover:text-bronze-glow transition-colors">
                {a.displayName}
              </h2>
              {a.discipline ? (
                <p className="smallcaps text-bronze/70 text-[10px]">{a.discipline}</p>
              ) : null}
              <p className="font-serif text-parchment/80 text-sm leading-relaxed line-clamp-3">
                {a.brief}
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {a.tags.slice(0, 4).map((t) => (
                  <span
                    key={t}
                    className="smallcaps text-[9px] text-parchment/60 border border-bronze-deep/50 px-1.5 py-0.5"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
