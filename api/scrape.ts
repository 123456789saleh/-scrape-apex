import { runScrapingEngine } from '../server/scraperEngine.ts';
import { serverSessionStore } from '../server/sessionStore.ts';

export default async function handler(req: any, res: any) {
  // Global CORS headers for seamless Vercel deployment
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Session-ID, X-Tenant-ID, X-Timestamp, X-Nonce'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const config = req.body || {};
    if (!config || !config.url) {
      res.status(400).json({ error: 'URL is required in request body.' });
      return;
    }

    const sessionId = (req.headers && req.headers['x-session-id']) || config.sessionId || config._session;
    const tenantId = (req.headers && req.headers['x-tenant-id']) || config.tenantId;

    // Strict anti-caching headers
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    if (sessionId) {
      res.setHeader('X-Session-ID', sessionId);
    }

    const result = await runScrapingEngine({
      ...config,
      sessionId,
      tenantId
    });

    if (sessionId) {
      (result as any).sessionId = sessionId;
      (result as any).tenantId = tenantId;
      try {
        serverSessionStore.updateSession(sessionId, {
          totalItemsFetched: (result.emails?.length || 0) + (result.products?.length || 0),
          endTime: Date.now()
        });
      } catch {
        // Ephemeral in serverless
      }
    }

    res.status(200).json(result);
  } catch (error: any) {
    console.error('[Vercel Serverless Scraper] Error:', error);
    res.status(500).json({
      error: error.message || 'Failed to scrape target URL in Vercel serverless function',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
