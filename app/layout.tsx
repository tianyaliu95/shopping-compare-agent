import type { Metadata, Viewport } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { Figtree, Noto_Sans_SC, Syne } from 'next/font/google';
import './globals.css';

const syne = Syne({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-display',
  display: 'swap',
});

const figtree = Figtree({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
});

const noto = Noto_Sans_SC({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-cjk',
  display: 'swap',
});

const siteUrl = 'https://shopping-compare-agent.vercel.app';
const title = 'Compare Agent — sourced shopping research';
const description =
  'Paste 2–4 products. The agent plans criteria, searches public sources, and returns a sourced decision table.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  applicationName: 'Compare Agent',
  authors: [{ name: 'Tianya Liu', url: 'https://www.tianyaliu.ca/' }],
  keywords: [
    'AI agent',
    'function calling',
    'Gemini',
    'product comparison',
    'shopping research',
    'Next.js',
  ],
  openGraph: {
    type: 'website',
    url: siteUrl,
    siteName: 'Compare Agent',
    title,
    description,
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#e4ebe6',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${syne.variable} ${figtree.variable} ${noto.variable} min-h-dvh font-body antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
