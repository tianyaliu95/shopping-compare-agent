export type ProductInput = {
  raw: string;
  name?: string;
  url?: string;
};

function stripTrailingPunct(value: string) {
  return value.replace(/[),.;!?]+$/g, '');
}

function toHttpsUrl(candidate: string): string | null {
  const cleaned = stripTrailingPunct(candidate.trim());
  try {
    const withProto = /^https?:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`;
    const url = new URL(withProto);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    if (!url.hostname.includes('.')) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function isAmazonHost(hostname: string) {
  const host = hostname.replace(/^www\./, '').toLowerCase();
  return (
    host === 'amzn.to' ||
    host === 'amzn.asia' ||
    host === 'a.co' ||
    host === 'smile.amazon.com' ||
    /(^|\.)amazon\.[a-z.]+$/.test(host)
  );
}

export function amazonAsin(url: string): string | undefined {
  try {
    const path = new URL(url).pathname;
    return path.match(/\/(?:dp|gp\/product|gp\/aw\/d)\/([A-Z0-9]{10})/i)?.[1]?.toUpperCase();
  } catch {
    return undefined;
  }
}

export function canonicalizeUrl(url: string): string {
  const parsed = new URL(url);
  parsed.hash = '';

  if (isAmazonHost(parsed.hostname)) {
    const asin = amazonAsin(parsed.toString());
    if (asin) return `${parsed.protocol}//${parsed.hostname}/dp/${asin}`;
  }

  for (const key of Array.from(parsed.searchParams.keys())) {
    if (/^(utm_|pd_rd_|pf_rd_|dib)/i.test(key) || /^(ref|tag|psc|qid|sr|keywords|th)$/i.test(key)) {
      parsed.searchParams.delete(key);
    }
  }
  return parsed.toString();
}

export function parseProductInput(raw: string): ProductInput {
  const trimmed = raw.trim();
  const httpsMatch = trimmed.match(/https?:\/\/[^\s<>"']+/i);
  let matched = '';
  let url: string | null = null;

  if (httpsMatch) {
    matched = stripTrailingPunct(httpsMatch[0]);
    url = toHttpsUrl(matched);
  } else if (!/\s/.test(trimmed) && /^(?:www\.)?[a-z0-9.-]+\.[a-z]{2,}\/\S+/i.test(trimmed)) {
    matched = stripTrailingPunct(trimmed);
    url = toHttpsUrl(matched);
  }

  if (!url) return { raw: trimmed, name: trimmed };

  const name = trimmed
    .replace(matched, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[-–—|:]+|[-–—|:]+$/g, '')
    .trim();

  return {
    raw: trimmed,
    name: name || undefined,
    url: canonicalizeUrl(url),
  };
}

export function parseProductList(values: string[]): ProductInput[] {
  return values.map((value) => value.trim()).filter(Boolean).slice(0, 4).map(parseProductInput);
}
