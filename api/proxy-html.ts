export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With, Accept',
      },
    });
  }

  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get('url');

  if (!rawUrl) {
    return new Response('Missing url query parameter', {
      status: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  }

  let targetUrl = rawUrl;
  try {
    targetUrl = decodeURIComponent(rawUrl);
  } catch {
    // Already decoded
  }

  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch {
    return new Response('Invalid target URL format', {
      status: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return new Response('Invalid protocol: must be http or https', {
      status: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  }

  const fallbackProxies = [
    (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    (url: string) => `https://thingproxy.freeboard.io/fetch/${encodeURIComponent(url)}`
  ];

  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept':
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Referer': `${parsed.protocol}//${parsed.host}/`,
  };

  const responseHeaders = new Headers();
  responseHeaders.set('Content-Type', 'text/html; charset=utf-8');
  responseHeaders.set('Access-Control-Allow-Origin', '*');
  responseHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  responseHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate');

  // 1. Try Direct Upstream
  try {
    const upstreamRes = await fetch(targetUrl, { headers });
    if (upstreamRes.ok) {
      const html = await upstreamRes.text();
      if (html && html.length > 200) {
        return new Response(html, {
          status: 200,
          headers: responseHeaders,
        });
      }
    }
  } catch {
    // Continue to fallback proxy chain
  }

  // 2. Try Fallback Chain: allorigins -> corsproxy -> thingproxy
  for (const getProxyUrl of fallbackProxies) {
    try {
      const proxyUrl = getProxyUrl(targetUrl);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);
      const pRes = await fetch(proxyUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (pRes.ok) {
        const text = await pRes.text();
        if (text && text.length > 200 && !text.startsWith('{"error":')) {
          return new Response(text, {
            status: 200,
            headers: responseHeaders,
          });
        }
      }
    } catch {
      // Continue to next proxy
    }
  }

  return new Response('Failed to retrieve target URL through direct and fallback CORS proxies', {
    status: 502,
    headers: responseHeaders,
  });
}
