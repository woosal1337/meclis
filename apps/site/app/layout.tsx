import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';

const SITE_URL = 'https://meclis.chele.bi';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'meclis · agora', template: '%s · meclis' },
  description:
    'A symposium of advisors. Curated character packs for the meclis Claude Code skill.',
  openGraph: {
    title: 'meclis · agora',
    description:
      'A symposium of advisors. Curated character packs for the meclis Claude Code skill.',
    url: SITE_URL,
    siteName: 'meclis',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'meclis · agora',
    description:
      'A symposium of advisors. Curated character packs for the meclis Claude Code skill.',
  },
  icons: { icon: '/favicon.png' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600&family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="min-h-screen flex flex-col">
          <header className="border-b border-bronze-deep/40">
            <div className="meander" />
            <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-3 no-underline">
                <span className="smallcaps text-bronze text-sm">meclis</span>
                <span className="text-parchment/40 text-xs">·</span>
                <span className="font-display text-parchment/80 text-base">agora</span>
              </Link>
              <nav className="flex items-center gap-6 smallcaps text-[11px] text-parchment/70">
                <Link href="/" className="hover:text-bronze-glow">
                  cast
                </Link>
                <Link href="/cli" className="hover:text-bronze-glow">
                  cli
                </Link>
                <Link href="/contribute" className="hover:text-bronze-glow">
                  contribute
                </Link>
                <a
                  href="https://github.com/woosal1337/meclis"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-bronze-glow"
                >
                  github
                </a>
              </nav>
            </div>
          </header>

          <main className="flex-1 max-w-5xl mx-auto px-6 py-12 w-full">{children}</main>

          <footer className="border-t border-bronze-deep/40 mt-16">
            <div className="meander" />
            <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between text-[11px] smallcaps text-parchment/50">
              <span>meclis · {new Date().getFullYear()}</span>
              <span>
                <a
                  href="https://github.com/woosal1337/meclis"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-bronze-glow"
                >
                  mit licensed
                </a>
              </span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
