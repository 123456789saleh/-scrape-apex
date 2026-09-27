export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get('url');

  if (!rawUrl) {
    return new Response('Missing url query parameter', { status: 400 });
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
    return new Response('Invalid target URL', { status: 400 });
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return new Response('Invalid protocol', { status: 400 });
  }

  try {
    const upstreamRes = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Referer': `${parsed.protocol}//${parsed.host}/`,
      },
    });

    if (!upstreamRes.ok) {
      return new Response(`Upstream returned ${upstreamRes.status}`, {
        status: upstreamRes.status,
      });
    }

    const contentType = upstreamRes.headers.get('content-type') || 'image/jpeg';
    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', contentType);
    responseHeaders.set('Cache-Control', 'public, max-age=604800, immutable');
    responseHeaders.set('Access-Control-Allow-Origin', '*');

    return new Response(upstreamRes.body, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (err: any) {
    return new Response(`Edge proxy error: ${err.message}`, { status: 500 });
  }
}
