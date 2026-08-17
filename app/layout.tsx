import type { Metadata, Viewport } from 'next';
import { Figtree, Syne } from 'next/font/google';
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

export const metadata: Metadata = {
  title: 'Compare Agent — sourced shopping research',
  description:
    'Paste 2–4 products. The agent plans criteria, searches public sources, and returns a sourced decision table.',
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
      <body className={`${syne.variable} ${figtree.variable} min-h-dvh font-body antialiased`}>
        {children}
      </body>
    </html>
  );
}
