const UA =
  'Mozilla/5.0 (compatible; ShopCompareBot/0.1; +https://github.com/shop-compare)';

function stripTags(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeDdgHref(href: string): string {
  try {
    const url = new URL(href, 'https://html.duckduckgo.com');
    const uddg = url.searchParams.get('uddg');
    return uddg ? decodeURIComponent(uddg) : href;
  } catch {
    return href;
  }
}

export async function webSearch(query: string): Promise<string> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'text/html' },
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) throw new Error(`Search HTTP ${res.status}`);
  const html = await res.text();

  const results: { title: string; href: string; snippet: string }[] = [];
  const rowRe =
    /<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?(?:class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/(?:a|td|span)>)/gi;

  let match: RegExpExecArray | null;
  while ((match = rowRe.exec(html)) && results.length < 5) {
    const href = decodeDdgHref(match[1]);
    if (!href.startsWith('http')) continue;
    results.push({
      href,
      title: stripTags(match[2]).slice(0, 140),
      snippet: stripTags(match[3] || '').slice(0, 220),
    });
  }

  if (results.length === 0) {
    const simple = /<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    while ((match = simple.exec(html)) && results.length < 5) {
      const href = decodeDdgHref(match[1]);
      if (!href.startsWith('http')) continue;
      results.push({ href, title: stripTags(match[2]).slice(0, 140), snippet: '' });
    }
  }

  if (results.length === 0) {
    return `No search hits for: ${query}`;
  }

  return results
    .map((r, i) => `${i + 1}. ${r.title}\n   ${r.href}\n   ${r.snippet}`)
    .join('\n');
}

export async function fetchPage(url: string): Promise<string> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('Invalid URL');
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only http(s) URLs');
  }

  const jina = `https://r.jina.ai/${parsed.toString()}`;
  const res = await fetch(jina, {
    headers: { 'User-Agent': UA, Accept: 'text/plain' },
    signal: AbortSignal.timeout(15_000),
  });

  if (res.ok) {
    const text = await res.text();
    return text.slice(0, 8000);
  }

  const direct = await fetch(parsed.toString(), {
    headers: { 'User-Agent': UA, Accept: 'text/html' },
    signal: AbortSignal.timeout(12_000),
  });
  if (!direct.ok) throw new Error(`Fetch HTTP ${direct.status}`);
  return stripTags(await direct.text()).slice(0, 8000);
}

export async function runTool(name: string, args: Record<string, unknown>): Promise<string> {
  try {
    if (name === 'web_search') {
      const query = String(args.query || '').trim();
      if (!query) return 'Missing query';
      return await webSearch(query);
    }
    if (name === 'fetch_page') {
      const url = String(args.url || '').trim();
      if (!url) return 'Missing url';
      return await fetchPage(url);
    }
    return `Unknown tool: ${name}`;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Tool failed';
    return `Tool error: ${message}`;
  }
}
