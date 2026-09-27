import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { runScrapingEngine } from './server/scraperEngine.ts';
import { PRESET_SITES } from './server/presets.ts';
import { generateExportData } from './server/exportEngine.ts';
import { askGeminiCustomExtraction } from './server/aiExtractor.ts';

import { serverSessionStore } from './server/sessionStore.ts';
import { pageTypeDetector } from './server/pageTypeDetector.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', engine: 'ApexScrape v2.5.0 (Vercel Serverless & Client-Side Hybrid)', timestamp: new Date().toISOString() });
  });

  // Presets
  app.get('/api/presets', (req, res) => {
    res.json(PRESET_SITES);
  });

  // Resilient Image Proxy to bypass hotlink protection, referrer blocking, and CORS
  app.get('/api/proxy-image', async (req, res) => {
    try {
      const rawUrl = req.query.url as string;
      if (!rawUrl) {
        return res.status(400).send('URL query parameter is required');
      }

      const decodedUrl = decodeURIComponent(rawUrl);
      let parsed: URL;
      try {
        parsed = new URL(decodedUrl);
      } catch {
        return res.status(400).send('Invalid URL format');
      }

      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return res.status(400).send('Invalid protocol');
      }

      const upstreamResponse = await fetch(decodedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'Referer': `${parsed.protocol}//${parsed.host}/`
        }
      });

      if (!upstreamResponse.ok) {
        return res.status(upstreamResponse.status).send('Failed to fetch image upstream');
      }

      const contentType = upstreamResponse.headers.get('content-type') || 'image/jpeg';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
      
      const buffer = await upstreamResponse.arrayBuffer();
      res.send(Buffer.from(buffer));
    } catch (err: any) {
      res.status(500).send('Proxy error: ' + err.message);
    }
  });

  // Session Management Routes (Binding Standard: Absolute Session Isolation)
  app.post('/api/session/create', (req, res) => {
    const { email, url, sessionId, tenantId } = req.body;
    const session = serverSessionStore.createSession(email, url, sessionId, tenantId);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('X-Session-ID', session.sessionId);
    res.json({
      success: true,
      sessionId: session.sessionId,
      tenantId: session.tenantId,
      message: `تم إنشاء جلسة سحب مستقلة ومعزولة: ${session.sessionId}`
    });
  });

  app.get('/api/session/:sessionId', (req, res) => {
    const session = serverSessionStore.getSession(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ error: 'جلسة غير موجودة أو منتهية' });
    }
    res.json({
      sessionId: session.sessionId,
      email: session.email,
      url: session.url,
      tenantId: session.tenantId,
      status: session.isActive ? 'نشطة' : 'مغلقة',
      progress: {
        itemsFetched: session.metadata.totalItemsFetched,
        itemsExpected: session.metadata.totalItemsExpected,
        pagesFetched: session.metadata.pagesFetched.length,
        pagesExpected: session.metadata.pagesExpected
      }
    });
  });

  app.post('/api/session/:sessionId/close', (req, res) => {
    serverSessionStore.closeSession(req.params.sessionId);
    res.json({ success: true, message: 'تم إغلاق وتصفير الجلسة بنجاح' });
  });

  // Pre-flight Content Type Detection Endpoint
  app.post('/api/detect-page-type', (req, res) => {
    try {
      const { url, mode } = req.body;
      if (!url) {
        return res.status(400).json({ error: 'URL is required' });
      }
      const report = pageTypeDetector.analyzePage({
        url,
        userSelectedMode: mode || 'products'
      });
      res.json(report);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Main Scrape Endpoint with Absolute Isolation & Anti-Cache Headers
  app.post('/api/scrape', async (req, res) => {
    try {
      const config = req.body;
      if (!config || !config.url) {
        return res.status(400).json({ error: 'URL is required in request body.' });
      }

      const sessionId = req.headers['x-session-id'] as string || config.sessionId || config._session;
      const tenantId = req.headers['x-tenant-id'] as string || config.tenantId;

      // Set strict anti-cache headers
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
        serverSessionStore.updateSession(sessionId, {
          totalItemsFetched: (result.emails?.length || 0) + (result.products?.length || 0),
          endTime: Date.now()
        });
      }

      res.json(result);
    } catch (error: any) {
      console.error('Scraping error:', error);
      res.status(500).json({ 
        error: error.message || 'Failed to scrape target URL',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  // Batch Scrape
  app.post('/api/scrape/batch', async (req, res) => {
    try {
      const { urls, baseConfig } = req.body;
      if (!Array.isArray(urls) || urls.length === 0) {
        return res.status(400).json({ error: 'Array of URLs is required.' });
      }

      const results = [];
      for (const url of urls.slice(0, 5)) {
        try {
          const config = { ...baseConfig, url };
          const result = await runScrapingEngine(config);
          results.push(result);
        } catch (err: any) {
          results.push({ url, error: err.message });
        }
      }
      res.json({ count: results.length, results });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Data Export
  app.post('/api/export', (req, res) => {
    try {
      const { result, format } = req.body;
      if (!result || !format) {
        return res.status(400).json({ error: 'Result object and format are required.' });
      }

      const exportFile = generateExportData(result, format);
      res.setHeader('Content-Type', exportFile.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${exportFile.filename}"`);
      
      if (Buffer.isBuffer(exportFile.data)) {
        res.send(exportFile.data);
      } else {
        res.send(exportFile.data);
      }
    } catch (error: any) {
      console.error('Export error:', error);
      res.status(500).json({ error: error.message || 'Export generation failed' });
    }
  });

  // AI Custom Extraction Query
  app.post('/api/ai/query', async (req, res) => {
    try {
      const { text, prompt } = req.body;
      if (!text || !prompt) {
        return res.status(400).json({ error: 'Text and prompt are required.' });
      }
      const data = await askGeminiCustomExtraction(text, prompt);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Test Webhook
  app.post('/api/webhook/test', async (req, res) => {
    const { webhookUrl, samplePayload } = req.body;
    if (!webhookUrl) {
      return res.status(400).json({ error: 'webhookUrl is required.' });
    }

    try {
      const resp = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'ApexScrape-Webhook-Dispatcher/2.0' },
        body: JSON.stringify(samplePayload || { test: true, timestamp: new Date().toISOString() })
      });
      res.json({ success: true, status: resp.status, statusText: resp.statusText });
    } catch (err: any) {
      res.status(502).json({ success: false, error: err.message });
    }
  });

  // Vite middleware for dev / static for prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ApexScrape server running on port ${PORT}`);
  });
}

startServer();
