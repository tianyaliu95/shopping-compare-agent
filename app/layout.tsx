import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Shop Compare — product research agent',
  description:
    'A multi-step shopping agent that plans comparison criteria, searches public sources, and returns a sourced decision table.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} min-h-screen font-sans antialiased`}>{children}</body>
    </html>
  );
}
