import { SessionManager } from '../managers/sessionManager.ts';
import { MultiTenantStore } from '../managers/multiTenantStore.ts';
import { PaginationHandler } from '../managers/paginationHandler.ts';
import { ImageHandler } from '../managers/imageHandler.ts';
import { ErrorHandler } from '../managers/errorHandler.ts';
import { SCRAPE_CONFIG } from '../config/scrapeConfig.ts';
import { ScrapeConfig, ScrapeResult } from '../types/scraper.ts';
import { clientScraperEngine } from './clientScraperEngine.ts';

export class ApexScraperService {
  public sessionManager = new SessionManager();
  public multiTenantStore = new MultiTenantStore();
  public paginationHandler = new PaginationHandler();
  public imageHandler = new ImageHandler();
  public errorHandler = new ErrorHandler(SCRAPE_CONFIG.MAX_RETRIES, SCRAPE_CONFIG.RETRY_DELAY);

  // Starts a clean, isolated scraping session
  async startScrapingProcess(
    email: string,
    config: ScrapeConfig,
    onProgress?: (progress: number, page: number, totalPages: number, itemsCount: number) => void
  ): Promise<ScrapeResult> {
    const targetEmail = (email || '').trim();
    const targetUrl = config.url.trim();

    console.log(`[ApexScraperService] 🚀 بدء جلسة سحب جديدة (${config.executionTarget || 'auto'}): ${targetEmail} | الرابط: ${targetUrl}`);

    // 1. Absolute session creation - guarantees unique UUID and flushes any old session
    const sessionId = this.sessionManager.createSession(targetEmail, targetUrl);

    // 2. Isolated tenant container
    const tenantId = this.multiTenantStore.createTenant(targetEmail);

    // 3. Inform server of session start (graceful in serverless / static)
    try {
      await fetch('/api/session/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Session-ID': sessionId,
        },
        body: JSON.stringify({
          sessionId,
          email: targetEmail,
          url: targetUrl,
          tenantId
        })
      });
    } catch (e) {
      // Ignored for purely client-side static deployments
    }

    // 4. Request scraping: Vercel Serverless Function or Direct Browser Engine
    const nonce = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const timestamp = Date.now();

    let finalResult: ScrapeResult | null = null;

    if (config.executionTarget === 'client') {
      console.log('[ApexScraperService] 🌐 جاري السحب المباشر من المتصفح (Client-side)...');
      finalResult = await clientScraperEngine.scrape(config, onProgress);
    } else {
      try {
        const fetchOperation = async (): Promise<ScrapeResult> => {
          const response = await fetch('/api/scrape', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0',
              'X-Session-ID': sessionId,
              'X-Timestamp': timestamp.toString(),
              'X-Nonce': nonce,
              'X-Tenant-ID': tenantId
            },
            body: JSON.stringify({
              ...config,
              sessionId,
              tenantId,
              targetEmail,
              _nonce: nonce,
              _t: timestamp,
              _session: sessionId
            })
          });

          if (!response.ok) {
            const errJson = await response.json().catch(() => ({}));
            throw new Error(errJson.error || `Scraping failed with status ${response.status}`);
          }

          const result: ScrapeResult = await response.json();
          return result;
        };

        finalResult = await this.errorHandler.executeWithRetry(fetchOperation, {
          sessionId,
          email: targetEmail
        });
      } catch (serverErr) {
        console.warn('[ApexScraperService] تعذر استكمال السحب عبر Vercel Serverless API، التحول التلقائي للسحب المباشر من المتصفح:', serverErr);
        // Automatic Fallback to Browser Client-Side Scraping
        finalResult = await clientScraperEngine.scrape(config, onProgress);
      }
    }

    if (!finalResult) {
      throw new Error(`تعذر استكمال السحب بعد محاولات متعددة عبر السيرفر والمتصفح.`);
    }

    // 5. Filter & validate product images (no guesswork or trackers)
    if (finalResult.products && finalResult.products.length > 0) {
      finalResult.products = this.imageHandler.processImages(finalResult.products);
    }

    // 6. Store in isolated tenant container
    if (finalResult.emails && finalResult.emails.length > 0) {
      this.multiTenantStore.addData(tenantId, finalResult.emails, 'email');
    }
    if (finalResult.products && finalResult.products.length > 0) {
      this.multiTenantStore.addData(tenantId, finalResult.products, 'site');
    }

    // 7. Update pagination handler
    const totalItems = (finalResult.emails?.length || 0) + (finalResult.products?.length || 0);
    this.paginationHandler.initializeConfig(totalItems, SCRAPE_CONFIG.ITEMS_PER_PAGE);

    if (onProgress) {
      onProgress(100, this.paginationHandler.getConfig()?.totalPages || 1, this.paginationHandler.getConfig()?.totalPages || 1, totalItems);
    }

    // Attach session metadata
    (finalResult as any).sessionId = sessionId;
    (finalResult as any).tenantId = tenantId;

    return finalResult;
  }
}

export const globalApexScraperService = new ApexScraperService();
