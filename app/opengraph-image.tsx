import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Compare Agent — a tool-using AI agent that returns a sourced decision table';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Satori needs ttf/otf/woff, so ask Google Fonts with a UA that gets truetype back.
async function loadFont(family: string, weight: number): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=${family}:wght@${weight}`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64)' } }
    ).then((res) => res.text());
    const url = css.match(/src:\s*url\((https:\/\/[^)]+)\)/)?.[1];
    if (!url) return null;
    const font = await fetch(url);
    if (!font.ok) return null;
    return await font.arrayBuffer();
  } catch {
    return null;
  }
}

export default async function OpengraphImage() {
  const [display, body] = await Promise.all([
    loadFont('Syne', 800),
    loadFont('Figtree', 500),
  ]);

  const fonts = [
    ...(display ? [{ name: 'Syne', data: display, weight: 800 as const, style: 'normal' as const }] : []),
    ...(body ? [{ name: 'Figtree', data: body, weight: 500 as const, style: 'normal' as const }] : []),
  ];

  const displayFamily = display ? 'Syne' : 'sans-serif';
  const bodyFamily = body ? 'Figtree' : 'sans-serif';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          background: 'linear-gradient(160deg, #eef3f0 0%, #e4ebe6 55%, #dbe5df 100%)',
          fontFamily: bodyFamily,
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 296,
            right: -22,
            fontSize: 200,
            fontFamily: displayFamily,
            fontWeight: 800,
            letterSpacing: -8,
            color: '#1a5c45',
            opacity: 0.12,
          }}
        >
          vs
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 24, fontWeight: 500, letterSpacing: 6, color: '#1a5c45' }}>
            AI RESEARCH AGENT
          </div>
          <div
            style={{
              marginTop: 24,
              fontSize: 106,
              fontFamily: displayFamily,
              fontWeight: 800,
              lineHeight: 1.02,
              letterSpacing: -4,
              color: '#14201b',
            }}
          >
            Compare Agent
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 34,
              lineHeight: 1.4,
              color: '#4d5f57',
              maxWidth: 780,
            }}
          >
            It plans its own criteria, reads public sources, and returns a sourced decision table.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {['web_search', 'fetch_page', 'sourced table'].map((label) => (
            <div
              key={label}
              style={{
                display: 'flex',
                padding: '12px 24px',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.72)',
                border: '1px solid rgba(20,32,27,0.12)',
                fontSize: 26,
                color: '#4d5f57',
              }}
            >
              {label}
            </div>
          ))}
          <div style={{ display: 'flex', flexGrow: 1 }} />
          <div style={{ display: 'flex', fontSize: 26, color: '#7d8c85' }}>tianyaliu.ca</div>
        </div>
      </div>
    ),
    { ...size, fonts: fonts.length > 0 ? fonts : undefined }
  );
}
