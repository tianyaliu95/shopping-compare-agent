import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        ink: {
          DEFAULT: '#1c1917',
          muted: '#57534e',
          faint: '#a8a29e',
        },
        paper: '#faf7f2',
      },
      boxShadow: {
        soft: '0 12px 40px rgba(28, 25, 23, 0.06)',
      },
    },
  },
  plugins: [],
};
export default config;
