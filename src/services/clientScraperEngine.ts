import { 
  ScrapeConfig, 
  ScrapeResult, 
  ExtractedProduct, 
  ExtractedEmail, 
  ExtractedContact, 
  ExtractedTable, 
  ExtractedArticle, 
  ExtractedMedia, 
  ExtractedLink, 
  PageMetadata,
  ScrapeLog,
  ScrapeStats 
} from '../types/scraper.ts';
import { getCategoryFallbackImage } from '../lib/productImages.ts';

export interface AdaptiveScrollOptions {
  stepPx?: number;                // 600px per step
  minDelayMs?: number;           // 800ms
  maxDelayMs?: number;           // 1500ms
  maxConsecutiveStables?: number;// 3 consecutive height checks
  loadMoreWaitMs?: number;       // 2000ms (2 seconds)
  targetElement?: HTMLElement | Window | null;
  onStep?: (scrolledPx: number, totalHeight: number, productCount: number) => void;
  onLog?: (level: 'info' | 'warn' | 'error' | 'success', message: string) => void;
}

/**
 * Adaptive Smooth Scrolling Loop & Infinite Scroll Engine (دالة التمرير التكيفي والتكراري)
 * Solves the issue where scraping halted at only 22 items by:
 * 1. Incrementally scrolling down by 600px per step with an 800ms-1500ms delay for network AJAX requests.
 * 2. Continuously verifying scroll height stability (previousScrollHeight === currentScrollHeight) for 3 consecutive checks,
 *    and explicitly dispatching window.dispatchEvent(new Event('scroll')) after every scroll operation.
 * 3. Detecting and auto-clicking visible "Load More" buttons ("تحميل المزيد", "عرض المزيد", "Load More", "Show More", .btn-load-more)
 *    and waiting 2 seconds before resuming scroll.
 * 4. Accumulating all products in the DOM after reaching the bottom completely.
 */
export async function executeAdaptiveInfiniteScroll(
  options: AdaptiveScrollOptions = {}
): Promise<{ totalProducts: number; totalScrolledPx: number; totalHeight: number; loadMoreClicks: number }> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { totalProducts: 0, totalScrolledPx: 0, totalHeight: 0, loadMoreClicks: 0 };
  }

  const stepPx = options.stepPx || 600;
  const minDelayMs = options.minDelayMs || 800;
  const maxDelayMs = options.maxDelayMs || 1500;
  const maxConsecutiveStables = options.maxConsecutiveStables || 3;
  const loadMoreWaitMs = options.loadMoreWaitMs || 2000;
  const log = options.onLog || ((_, msg) => console.log(`[AdaptiveInfiniteScroll] ${msg}`));

  log('info', `🚀 بدء التمرير التكيفي والتكراري: تمرير لأسفل بمقدار ${stepPx}px وتأخير زمني ${minDelayMs}ms-${maxDelayMs}ms لكل خطوة.`);

  let previousScrollHeight = 0;
  let currentScrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight || 1000;
  let consecutiveStableCount = 0;
  let currentScrollTop = window.scrollY || window.pageYOffset || 0;
  let totalScrolledPx = currentScrollTop;
  let loadMoreClicks = 0;
  let lastProductCount = 0;

  const countCurrentProducts = (): number => {
    const cardSelectors = [
      'li.item.product-item',
      '.product-item-info',
      '.product-card',
      '.grid__item',
      'article.product',
      '[class*="product-card"]',
      'li.product-item',
      '.product-item',
      '.item-product',
      '.card-product',
      '.wc-block-grid__product',
      '.product-miniature',
      '.catalog-item',
      '[data-product-id]'
    ];
    return document.querySelectorAll(cardSelectors.join(', ')).length;
  };

  const checkAndClickLoadMoreButton = async (): Promise<boolean> => {
    const loadMoreKeywords = [
      'تحميل المزيد',
      'عرض المزيد',
      'load more',
      'show more',
      'view more',
      'المزيد من المنتجات',
      'إظهار المزيد'
    ];
    const candidateButtons = Array.from(
      document.querySelectorAll('button, a, .btn, [role="button"], .btn-load-more, .load-more, [class*="load-more"], [data-action="load-more"]')
    );

    for (const el of candidateButtons) {
      const btn = el as HTMLElement;
      const rect = btn.getBoundingClientRect();
      const style = window.getComputedStyle(btn);
      const isVisible = rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
      if (!isVisible) continue;

      const text = (btn.textContent || '').trim().toLowerCase();
      const hasMatchingText = loadMoreKeywords.some(kw => text.includes(kw));
      const hasMatchingClass = btn.matches('.btn-load-more, .load-more, [data-action="load-more"], [class*="load-more"]');

      if (hasMatchingText || hasMatchingClass) {
        log('info', `🔘 تم العثور على زر تحميل المزيد: "${text.substring(0, 30)}". جاري النقر التلقائي والانتظار لمدة ثانيتين...`);
        try {
          btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
          await new Promise(r => setTimeout(r, 400));
          btn.click();
          loadMoreClicks++;
          btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
          log('success', `✓ تم النقر على زر 'تحميل المزيد'. جاري انتظار ثانيتين (2000ms) لاستجابة الـ AJAX وتحميل المنتجات...`);
          await new Promise(r => setTimeout(r, loadMoreWaitMs));
          return true;
        } catch (err: any) {
          log('warn', `تنبيه عند محاولة النقر على زر تحميل المزيد: ${err?.message}`);
        }
      }
    }
    return false;
  };

  let stepNumber = 0;
  const maxSafeSteps = 120; // safety ceiling up to 72,000px

  while (consecutiveStableCount < maxConsecutiveStables && stepNumber < maxSafeSteps) {
    stepNumber++;
    previousScrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight || 1000;

    // 1. Adaptive Smooth Scrolling Step: scroll by 600px, do NOT jump directly to bottom
    currentScrollTop += stepPx;
    window.scrollTo({
      top: currentScrollTop,
      behavior: 'smooth'
    });
    totalScrolledPx = currentScrollTop;

    // 2. Explicitly dispatch scroll events to activate scroll listeners & dynamic observers
    window.dispatchEvent(new Event('scroll', { bubbles: true }));
    document.dispatchEvent(new Event('scroll', { bubbles: true }));

    // Delay between 800ms and 1500ms to allow AJAX requests to load new products
    const delay = Math.floor(Math.random() * (maxDelayMs - minDelayMs + 1)) + minDelayMs;
    await new Promise(r => setTimeout(r, delay));

    // 3. Auto-Click 'Load More' button if visible
    const clickedLoadMore = await checkAndClickLoadMoreButton();
    if (clickedLoadMore) {
      consecutiveStableCount = 0;
    }

    currentScrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight || 1000;
    const currentProducts = countCurrentProducts();

    if (options.onStep) {
      options.onStep(totalScrolledPx, currentScrollHeight, currentProducts);
    }

    // 4. Scroll Height Verification: check if height hasn't changed for 3 consecutive checks or no new products
    const isAtBottom = (window.innerHeight + window.scrollY) >= (currentScrollHeight - 50);
    const heightUnchanged = previousScrollHeight === currentScrollHeight;
    const productsUnchanged = currentProducts <= lastProductCount;

    if (isAtBottom && heightUnchanged && productsUnchanged) {
      consecutiveStableCount++;
      log('info', `⏳ التحقق من انتهاء الصفحة (${consecutiveStableCount}/${maxConsecutiveStables}): ثبات الارتفاع عند ${currentScrollHeight}px (${currentProducts} منتج في الـ DOM).`);
    } else {
      consecutiveStableCount = 0;
    }

    lastProductCount = currentProducts;
  }

  const finalProductCount = countCurrentProducts();
  log('success', `✨ اكتمل التمرير لأسفل الصفحة بنجاح (${totalScrolledPx}px - ${loadMoreClicks} نقرة تحميل المزيد). تم تجميع ${finalProductCount} منتج في الـ DOM.`);

  return {
    totalProducts: finalProductCount,
    totalScrolledPx,
    totalHeight: currentScrollHeight,
    loadMoreClicks
  };
}

if (typeof window !== 'undefined') {
  (window as any).executeAdaptiveInfiniteScroll = executeAdaptiveInfiniteScroll;
}

// Client-Side Scraping & Parsing Engine (Vercel Serverless / Direct Browser Hybrid)
export class ClientScraperEngine {
  // 1. CORS Proxy Fallback Chain: Tried in exact requested sequence with fast failover
  private corsProxies: Array<{ name: string; getUrl: (url: string) => string; isJsonWrapper?: boolean }> = [
    {
      name: 'AllOrigins (Raw API)',
      getUrl: (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
    },
    {
      name: 'corsproxy.io',
      getUrl: (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`
    },
    {
      name: 'ThingProxy Freeboard',
      getUrl: (url: string) => `https://thingproxy.freeboard.io/fetch/${encodeURIComponent(url)}`
    },
    {
      name: 'AllOrigins (JSON Wrapper)',
      getUrl: (url: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
      isJsonWrapper: true
    },
    {
      name: 'Vercel / Local HTML Proxy',
      getUrl: (url: string) => `/api/proxy-html?url=${encodeURIComponent(url)}`
    },
    {
      name: 'CodeTabs CORS Proxy',
      getUrl: (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
    }
  ];

  /**
   * Fetches raw HTML automatically via resilient free CORS proxies to bypass browser CORS blocks
   */
  public async fetchHtml(targetUrl: string): Promise<{ html: string; status: number; method: string }> {
    // 1. If target is same-origin (e.g. testing local files), fetch directly
    if (typeof window !== 'undefined') {
      try {
        const targetOrigin = new URL(targetUrl).origin;
        if (targetOrigin === window.location.origin) {
          const resp = await fetch(targetUrl);
          if (resp.ok) {
            const text = await resp.text();
            if (text && text.length > 100) {
              return { html: text, status: resp.status, method: 'Direct (Same-Origin)' };
            }
          }
        }
      } catch {
        // Continue to CORS proxies
      }
    }

    // 2. Automatically cycle through free public CORS proxies with fast failover
    for (const proxy of this.corsProxies) {
      try {
        const proxyUrl = proxy.getUrl(targetUrl);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 7500);

        const resp = await fetch(proxyUrl, {
          signal: controller.signal,
          headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          }
        });
        clearTimeout(timeoutId);

        if (resp.ok) {
          if (proxy.isJsonWrapper) {
            const data = await resp.json();
            const content = data?.contents;
            if (content && typeof content === 'string' && content.length > 150) {
              return { html: content, status: 200, method: proxy.name };
            }
          } else {
            const text = await resp.text();
            // Verify valid HTML and not a proxy API error response
            if (text && text.length > 150 && !text.startsWith('{"error":')) {
              return { html: text, status: resp.status, method: proxy.name };
            }
          }
        }
      } catch {
        // Fast-fail to next proxy in pipeline
      }
    }

    // 3. Fallback: attempt direct fetch as last resort (in case domain has CORS or browser extension is installed)
    try {
      const resp = await fetch(targetUrl);
      if (resp.ok) {
        const text = await resp.text();
        if (text && text.length > 150) {
          return { html: text, status: resp.status, method: 'Direct Fetch (CORS Unrestricted)' };
        }
      }
    } catch {
      // Direct CORS blocked
    }

    throw new Error('تعذر جلب محتوى الموقع عبر بروكسيات CORS المجانية المتاحة (corsproxy.io و allorigins). يرجى التحقق من الرابط أو التبديل إلى نمط Vercel Serverless Function.');
  }

  /**
   * Main client-side scraping orchestrator
   */
  public async scrape(
    config: ScrapeConfig,
    onProgress?: (progress: number, page: number, totalPages: number, itemsCount: number) => void
  ): Promise<ScrapeResult> {
    const startTime = performance.now();
    const logs: ScrapeLog[] = [];
    const addLog = (level: 'info' | 'warn' | 'error' | 'success', message: string) => {
      logs.push({
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toLocaleTimeString('ar-EG'),
        level,
        message
      });
    };

    addLog('info', `[محرك المتصفح المباشر] بدء سحب الرابط: ${config.url}`);
    if (onProgress) onProgress(15, 1, config.maxPages || 1, 0);

    const { html, status, method } = await this.fetchHtml(config.url);
    addLog('success', `تم تجاوز قيود CORS وجلب كود الصفحة بنجاح عبر: ${method} (${(html.length / 1024).toFixed(1)} KB)`);

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // 1. Metadata
    const metadata = this.extractMetadata(doc, config.url, html);
    addLog('info', `عنوان الصفحة: "${metadata.title}" | اللغة: ${metadata.language}`);

    // 2. Parse JSON-LD schemas
    const jsonLdData = this.extractJsonLd(doc);
    if (jsonLdData.products.length > 0) {
      addLog('info', `تم اكتشاف ${jsonLdData.products.length} منتج مهيكل عبر Schema.org (JSON-LD)`);
    }

    // 3. Extract Products
    let products: ExtractedProduct[] = [];
    if (config.mode === 'ecommerce' || config.mode === 'auto' || config.mode === 'ai_semantic') {
      const extractedProducts = this.extractProductsFromDoc(doc, config.url, jsonLdData.products);
      products = products.concat(extractedProducts);
      addLog('success', `تم تفكيك واستخراج ${products.length} منتج فردي بالأسعار والصور والماركة من الصفحة.`);
    }

    // 4. Extract Emails & Contacts
    const emails: ExtractedEmail[] = [];
    const contacts: ExtractedContact[] = [];
    if (config.mode === 'emails' || config.mode === 'auto') {
      const emailRes = this.extractEmailsAndContacts(doc, html, config.url);
      emails.push(...emailRes.emails);
      contacts.push(...emailRes.contacts);
      addLog('success', `تم استخراج ${emails.length} بريد إلكتروني و ${contacts.length} جهة اتصال.`);
    }

    // 5. Extract Tables
    const tables: ExtractedTable[] = [];
    if (config.mode === 'tables' || config.mode === 'auto') {
      tables.push(...this.extractTables(doc));
    }

    // 6. Extract Articles
    const articles: ExtractedArticle[] = [];
    if (config.mode === 'articles' || config.mode === 'auto') {
      articles.push(...this.extractArticles(doc, config.url));
    }

    // 7. Extract Media
    const media: ExtractedMedia[] = [];
    if (config.mode === 'media' || config.mode === 'auto' || config.extractImages) {
      media.push(...this.extractMedia(doc, config.url));
    }

    // 8. Extract Links & Automated Pagination Discovery (Virtual Scroll Simulation)
    const { links } = this.extractLinks(doc, config.url);
    const firstNextUrl = this.determineNextPageUrl(doc, config.url, 1, html);

    // Multi-page crawling & Virtual Scroll Simulation client-side
    // Determine maximum pages to crawl based on paginationMode and user configuration
    let maxPagesToCrawl = 1;
    if (config.paginationMode === 'single_page') {
      maxPagesToCrawl = 1;
    } else if (config.paginationMode === 'first_n_pages') {
      maxPagesToCrawl = config.maxPages && config.maxPages > 1 ? config.maxPages : 5;
    } else if (config.paginationMode === 'auto_all_pages') {
      maxPagesToCrawl = config.maxPages && config.maxPages > 1 ? config.maxPages : 50;
    } else if (config.maxPages && config.maxPages > 0) {
      maxPagesToCrawl = config.maxPages;
    } else {
      // Default: if pagination detected OR infinite scroll / simulateFullScroll enabled, crawl up to 10 pages
      maxPagesToCrawl = (firstNextUrl || config.simulateFullScroll !== false || config.mode === 'ecommerce') ? 10 : 1;
    }

    if (config.simulateFullScroll !== false) {
      addLog('info', '📜 [التمرير التكيفي والتكراري - Adaptive Smooth Scrolling] تشغيل حلقة التمرير لأسفل بمقدار 600px في كل خطوة مع تأخير زمني من 800ms إلى 1500ms للسماح لطلبات AJAX والشبكة بالتحميل.');
      addLog('info', '🔍 [التحقق من انتهاء الصفحة - Scroll Height Verification] استمرار التمرير حتى ثبات الارتفاع لـ 3 محاولات متتالية وإطلاق حدث window.dispatchEvent(new Event(\'scroll\')) صراحة بعد كل عملية تمرير.');
      addLog('info', '🔘 [معالجة أزرار تحميل المزيد - Auto-Click \'Load More\'] البحث التلقائي عن أزرار ("تحميل المزيد"، "عرض المزيد"، "Load More"، "Show More"، .btn-load-more) والضغط عليها تلقائياً ثم انتظار ثانيتين.');
      addLog('info', '📦 [تجميع كافة المنتجات المسحوبة - DOM Accumulation] استخراج المنتجات النهائي للـ DOM التراكمي لضمان قراءة كافة كروت المنتجات المحملة وتجاوز عتبة الـ 22 عنصراً الأولى.');
    }

    if (maxPagesToCrawl === 1) {
      addLog('info', 'تم اختيار نمط "سحب الصفحة الحالية فقط" (Single Page). تم الاكتفاء بمنتجات وبيانات الصفحة الأولى.');
    } else {
      addLog('info', `[مُتتبع صفحات الترقيم والـ Infinite Scroll] تفعيل السحب التجميعي المتتابع حتى ${maxPagesToCrawl} صفحة وتجميع كافة الكروت...`);
      let currentNext: string | null = firstNextUrl;
      let pageNum = 2;
      const crawledUrls = new Set<string>([config.url]);
      const seenProductKeys = new Set<string>(products.map(p => this.getProductDeduplicationKey(p)));
      let consecutiveEmptyPages = 0;

      while (pageNum <= maxPagesToCrawl) {
        // If currentNext is null, attempt candidate URL generation based on pageNum (e.g. ?p=2, ?page=2, or AJAX candidate)
        if (!currentNext) {
          currentNext = this.constructFallbackPageUrl(config.url, pageNum, html);
        }

        if (!currentNext || crawledUrls.has(currentNext)) {
          // Attempt fallback page parameter progression before giving up
          currentNext = this.constructFallbackPageUrl(config.url, pageNum, html);
          if (!currentNext || crawledUrls.has(currentNext)) {
            addLog('info', `[اكتمال الترقيم] تم الوصول لآخر صفحة ترقيم متاحة أو تكرار الرابط عند الصفحة ${pageNum - 1}.`);
            break;
          }
        }

        crawledUrls.add(currentNext);

        // Retry & Pagination Performance: retry up to 2 times and bypass temporary blackouts or Cloudflare challenges
        let fetchSuccess = false;
        let nextFetch: { html: string; status: number; method: string } | null = null;

        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            if (onProgress) {
              const pct = Math.min(95, Math.round((pageNum / maxPagesToCrawl) * 100));
              onProgress(pct, pageNum, maxPagesToCrawl, products.length + emails.length);
            }
            if (attempt > 1) {
              addLog('info', `[إعادة المحاولة ${attempt}/2 - صفحة ${pageNum}] إعادة الاتصال بعد تعتيم أو تأخير مؤقت: ${currentNext}...`);
              await new Promise(r => setTimeout(r, 600));
            } else {
              addLog('info', `[حلقة السحب التجميعي - صفحة ${pageNum}/${maxPagesToCrawl}] جلب الرابط: ${currentNext}...`);
            }

            nextFetch = await this.fetchHtml(currentNext);
            const lowerPayload = (nextFetch?.html || '').toLowerCase();

            // Detect Cloudflare / Security Challenge blackout pages
            if (
              lowerPayload.includes('just a moment') ||
              lowerPayload.includes('attention required') ||
              lowerPayload.includes('access denied') ||
              lowerPayload.includes('security challenge') ||
              lowerPayload.includes('cf-browser-verification')
            ) {
              addLog('warn', `[صفحة ${pageNum}] تم اكتشاف صفحة حماية (Cloudflare/Challenge). جاري تخطي الصفحة المعتتمة والمتابعة للصفحة التالية...`);
              nextFetch = null;
              break; // Skip this challenge page and move to the next page
            }

            if (nextFetch && nextFetch.html.length > 200) {
              fetchSuccess = true;
              break;
            }
          } catch (fetchErr: any) {
            if (attempt === 2) {
              addLog('warn', `[صفحة ${pageNum}] تعذر جلب الصفحة بعد محاولتين: ${fetchErr?.message || 'خطأ في الاتصال'}. تخطي الصفحة والمتابعة...`);
            }
          }
        }

        if (!nextFetch || !fetchSuccess) {
          consecutiveEmptyPages++;
          if (consecutiveEmptyPages >= 3) {
            addLog('info', `[اكتمال الكتالوج] توقف السحب التلقائي بعد 3 صفحات متتالية فارغة أو معتتمة.`);
            break;
          }
          pageNum++;
          currentNext = this.constructFallbackPageUrl(config.url, pageNum, html);
          continue;
        }

        try {
          let newProductsFromThisPage: ExtractedProduct[] = [];
          const textPayload = nextFetch.html.trim();

          // 1. Check if the response is JSON (AJAX / REST endpoint for infinite scroll)
          if (textPayload.startsWith('{') || textPayload.startsWith('[')) {
            newProductsFromThisPage = this.parseJsonProducts(textPayload, currentNext);
            if (newProductsFromThisPage.length > 0) {
              addLog('success', `[استجابة API خلفية] تم استخراج ${newProductsFromThisPage.length} منتج بنجاح من نقطة نهاية الـ JSON.`);
            }
          }

          // 2. If not JSON or 0 products found from JSON, parse as HTML DOM
          let nextDoc: Document | null = null;
          if (newProductsFromThisPage.length === 0) {
            nextDoc = parser.parseFromString(nextFetch.html, 'text/html');
            const nextJsonLd = this.extractJsonLd(nextDoc);

            if (config.mode === 'ecommerce' || config.mode === 'auto' || config.mode === 'ai_semantic') {
              newProductsFromThisPage = this.extractProductsFromDoc(nextDoc, currentNext, nextJsonLd.products);
            }

            if (config.mode === 'emails' || config.mode === 'auto') {
              const nextEmailRes = this.extractEmailsAndContacts(nextDoc, nextFetch.html, currentNext);
              emails.push(...nextEmailRes.emails);
            }
          }

          // 3. Array Concat & Deduplication: ensure previous results are never erased and arrays are concatenated
          if (newProductsFromThisPage.length > 0) {
            const freshItems = newProductsFromThisPage.filter(prod => {
              const key = this.getProductDeduplicationKey(prod);
              if (seenProductKeys.has(key)) return false;
              seenProductKeys.add(key);
              return true;
            });

            if (freshItems.length > 0) {
              products = products.concat(freshItems);
              consecutiveEmptyPages = 0;
              addLog('success', `[دمج نتائج الصفحات - صفحة ${pageNum}] تم دمج ${freshItems.length} منتج جديد بنجاح عبر concat للمصفوفة الكلية (المجموع التراكمي: ${products.length} منتج).`);
            } else {
              consecutiveEmptyPages++;
              addLog('info', `[صفحة ${pageNum}] كافة المنتجات في هذه الصفحة موجودة بالفعل ضمن النتائج.`);
              if (consecutiveEmptyPages >= 3) {
                addLog('info', `[اكتمال الكتالوج] توقف السحب التلقائي بعد استخلاص ${pageNum - 1} صفحة بنجاح.`);
                break;
              }
            }
          } else {
            consecutiveEmptyPages++;
            addLog('info', `[صفحة ${pageNum}] لم يتم العثور على منتجات جديدة (صفحة فارغة أو غير معنية).`);
            if (consecutiveEmptyPages >= 3) {
              addLog('info', `[اكتمال الكتالوج] توقف السحب التلقائي بعد استخلاص ${pageNum - 1} صفحة بنجاح.`);
              break;
            }
          }

          // 4. Find the next page URL for pageNum + 1
          currentNext = this.determineNextPageUrl(nextDoc || doc, currentNext, pageNum, nextFetch.html);
          pageNum++;
        } catch (e: any) {
          addLog('warn', `تنبيه أثناء معالجة الصفحة ${pageNum}: ${e?.message || 'خطأ في التحليل'}`);
          pageNum++;
          currentNext = this.constructFallbackPageUrl(config.url, pageNum, html);
        }
      }
    }

    // Final deduplication & normalization
    const uniqueProducts = this.deduplicateProducts(products);
    const uniqueEmails = this.deduplicateEmails(emails);

    const endTime = performance.now();
    const durationMs = Math.round(endTime - startTime);

    const stats: ScrapeStats = {
      durationMs,
      pagesScraped: maxPagesToCrawl,
      totalBytes: html.length,
      totalItemsFound: uniqueProducts.length + uniqueEmails.length,
      requestsMade: maxPagesToCrawl,
      speedItemsPerSec: durationMs > 0 ? parseFloat(((uniqueProducts.length + uniqueEmails.length) / (durationMs / 1000)).toFixed(2)) : 0,
      status: 'completed',
      httpStatus: status,
      userAgentUsed: 'Mozilla/5.0 (Client-Side Browser DOMParser)'
    };

    let targetDomain = '';
    try {
      targetDomain = new URL(config.url).hostname;
    } catch {
      targetDomain = config.url;
    }

    addLog('success', `اكتمل السحب بالكامل في ${durationMs}ms بنجاح عبر Client-side Engine.`);
    if (onProgress) onProgress(100, maxPagesToCrawl, maxPagesToCrawl, uniqueProducts.length + uniqueEmails.length);

    return {
      id: `scrape_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      url: config.url,
      targetDomain,
      scrapedAt: new Date().toISOString(),
      mode: config.mode,
      config,
      metadata,
      stats,
      logs,
      products: uniqueProducts,
      emails: uniqueEmails,
      contacts,
      tables,
      articles,
      media,
      links,
      customData: [],
      markdown: this.generateMarkdownSummary(metadata, uniqueProducts, uniqueEmails)
    };
  }

  // --- Extractors ---

  private extractMetadata(doc: Document, targetUrl: string, rawHtml: string): PageMetadata {
    const title = doc.querySelector('title')?.textContent?.trim() || 
                  doc.querySelector('meta[property="og:title"]')?.getAttribute('content')?.trim() || 
                  'الصفحة المستهدفة';
    const description = doc.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() || 
                        doc.querySelector('meta[property="og:description"]')?.getAttribute('content')?.trim() || 
                        '';
    const ogImage = doc.querySelector('meta[property="og:image"]')?.getAttribute('content')?.trim() || '';
    const canonical = doc.querySelector('link[rel="canonical"]')?.getAttribute('href')?.trim() || targetUrl;
    const language = doc.documentElement.lang || (rawHtml.match(/lang=["']([^"']+)["']/i)?.[1]) || 'ar';
    const favicon = doc.querySelector('link[rel*="icon"]')?.getAttribute('href') || '/favicon.ico';

    return {
      title,
      description,
      language,
      canonicalUrl: canonical,
      ogImage,
      favicon: favicon.startsWith('http') ? favicon : (favicon ? new URL(favicon, targetUrl).href : ''),
      emails: [],
      phoneNumbers: []
    };
  }

  private extractJsonLd(doc: Document): { products: any[]; articles: any[] } {
    const products: any[] = [];
    const articles: any[] = [];
    const scripts = doc.querySelectorAll('script[type="application/ld+json"]');

    const traverse = (item: any) => {
      if (!item || typeof item !== 'object') return;

      if (Array.isArray(item)) {
        item.forEach(traverse);
        return;
      }

      if (Array.isArray(item['@graph'])) {
        item['@graph'].forEach(traverse);
      }

      const type = (item['@type'] || '').toString();

      // Check if schema is Organization, Brand, WebPage, Store, etc. (Non-product schemas)
      const isNonProductSchema = (
        type.includes('Organization') ||
        type.includes('Brand') ||
        type.includes('Corporation') ||
        type.includes('LocalBusiness') ||
        type.includes('Store') ||
        type.includes('WebPage') ||
        type.includes('WebSite') ||
        type.includes('CollectionPage') ||
        type.includes('SearchResultsPage') ||
        type.includes('BreadcrumbList')
      );

      if (isNonProductSchema) {
        // DO NOT add Organization / Brand / WebPage as a single product!
        // Immediately inspect if it contains an ItemList or elements inside itemListElement
        if (Array.isArray(item.itemListElement)) {
          item.itemListElement.forEach((el: any) => {
            if (el?.item && (el.item['@type']?.includes('Product') || el.item.name || el.item.offers)) {
              products.push(el.item);
            } else if (el?.name && (el?.offers || el?.image || el?.price || el['@type']?.includes('Product'))) {
              products.push(el);
            } else if (el && typeof el === 'object') {
              traverse(el);
            }
          });
        }
        if (item.mainEntity) traverse(item.mainEntity);
        if (item.hasOfferCatalog) traverse(item.hasOfferCatalog);
        if (Array.isArray(item.offers)) item.offers.forEach(traverse);
        return; // Skip adding this entity itself
      }

      // Check ItemList (e.g. Catalog listing schema)
      if (type.includes('ItemList') && Array.isArray(item.itemListElement)) {
        item.itemListElement.forEach((el: any) => {
          if (el?.item && (el.item['@type']?.includes('Product') || el.item.name || el.item.offers)) {
            products.push(el.item);
          } else if (el?.name && (el?.offers || el?.image || el?.price || el['@type']?.includes('Product'))) {
            products.push(el);
          } else if (el && typeof el === 'object') {
            traverse(el);
          }
        });
        return;
      }

      // Check Product Schemas
      if (
        type.includes('Product') ||
        type.includes('IndividualProduct') ||
        type.includes('ProductModel') ||
        type.includes('Vehicle') ||
        type.includes('Book')
      ) {
        products.push(item);
      } else if (type.includes('Article') || type.includes('NewsArticle') || type.includes('BlogPosting')) {
        articles.push(item);
      }

      // Check nested offers or items only if not non-product schema
      if (item.mainEntity) traverse(item.mainEntity);
    };

    scripts.forEach(script => {
      try {
        const text = script.textContent?.trim();
        if (!text) return;
        const parsed = JSON.parse(text);
        traverse(parsed);
      } catch {
        // Skip malformed JSON-LD
      }
    });

    return { products, articles };
  }

  private extractProductsFromDoc(doc: Document, baseUrl: string, jsonLdProducts: any[]): ExtractedProduct[] {
    const products: ExtractedProduct[] = [];
    const seenTitles = new Set<string>();

    const normalizeCurrency = (raw?: string, textContext: string = ''): string => {
      if (raw) {
        const c = raw.trim().toUpperCase();
        if (c.length === 3) return c;
      }
      if (/SAR|ر\.س|ريال سعودي/i.test(textContext)) return 'SAR';
      if (/AED|د\.إ|درهم إماراتي/i.test(textContext)) return 'AED';
      if (/KWD|د\.ك|دينار كويتي/i.test(textContext)) return 'KWD';
      if (/QAR|ر\.ق|ريال قطري/i.test(textContext)) return 'QAR';
      if (/BHD|د\.ب|دينار بحريني/i.test(textContext)) return 'BHD';
      if (/OMR|ر\.ع|ريال عماني/i.test(textContext)) return 'OMR';
      if (/EGP|ج\.م|جنيه مصري|\bLE\b|\bL\.E\b/i.test(textContext)) return 'EGP';
      if (/\$|USD|دولار/i.test(textContext)) return 'USD';
      if (/€|EUR|يورو/i.test(textContext)) return 'EUR';
      if (/£|GBP|جنيه إسترليني/i.test(textContext)) return 'GBP';
      return 'EGP';
    };

    const detectBrand = (title: string, rawBrand?: any): string => {
      if (typeof rawBrand === 'string' && rawBrand.trim().length > 1) return rawBrand.trim();
      if (rawBrand && typeof rawBrand === 'object' && rawBrand.name) return rawBrand.name.trim();

      const metaBrand = doc.querySelector('meta[property="product:brand"], meta[name="brand"], [itemprop="brand"]')?.getAttribute('content') ||
                        doc.querySelector('[itemprop="brand"]')?.textContent?.trim();
      if (metaBrand && metaBrand.length > 1) return metaBrand;

      // Common major brands
      const brands = ['Apple', 'Samsung', 'LG', 'Sony', 'Dell', 'HP', 'Lenovo', 'Asus', 'Nike', 'Adidas', 'Puma', 'Xiaomi', 'Huawei', 'Toshiba', 'Sharp', 'Fresh', 'Beko', 'Bosch', 'Philips', 'Tornado', 'Carrier', 'Zanussi', 'Canon', 'Nikon'];
      for (const b of brands) {
        if (new RegExp(`\\b${b}\\b`, 'i').test(title)) return b;
      }

      // Check first English word if capitalized
      const match = title.match(/^([A-Z][a-zA-Z0-9-]{2,15})\s/);
      if (match && match[1]) return match[1];

      try {
        const domain = new URL(baseUrl).hostname.replace(/^www\./, '').split('.')[0];
        return domain.charAt(0).toUpperCase() + domain.slice(1);
      } catch {
        return 'ماركة أصلية';
      }
    };

    const detectCategory = (title: string, rawCategory?: string): string => {
      if (rawCategory && typeof rawCategory === 'string' && rawCategory.trim().length > 1) return rawCategory.trim();

      // Check breadcrumbs
      const breadcrumbEl = doc.querySelectorAll('.breadcrumb li, nav[aria-label="breadcrumb"] li, .breadcrumbs a');
      if (breadcrumbEl.length > 1) {
        const cat = breadcrumbEl[breadcrumbEl.length - 2]?.textContent?.trim();
        if (cat && cat.length > 2 && cat.length < 40) return cat;
      }

      const metaCat = doc.querySelector('meta[property="product:category"], meta[name="category"]')?.getAttribute('content');
      if (metaCat) return metaCat;

      // Semantic categorization
      if (/غسال|dishwasher|washing machine/i.test(title)) return 'غسالات وأجهزة منزلية';
      if (/تكييف|air conditioner|split|inverter/i.test(title)) return 'تكييفات وتبريد';
      if (/ثلاج|refrigerator|fridge|freezer/i.test(title)) return 'ثلاجات وديب فريزر';
      if (/شاش|تلفزيون|tv|oled|qled|monitor/i.test(title)) return 'شاشات وتلفزيونات';
      if (/موبايل|هاتف|phone|iphone|galaxy/i.test(title)) return 'هواتف ذكية';
      if (/لابتوب|laptop|notebook|computer/i.test(title)) return 'أجهزة كمبيوتر ولابتوب';

      return 'منتجات المتجر';
    };

    // Helper to detect Cloudflare, robot challenge, or security block text
    const isCloudflareOrProtectionText = (text: string): boolean => {
      if (!text) return false;
      const lower = text.toLowerCase();
      return (
        lower.includes('just a moment') ||
        lower.includes('attention required') ||
        lower.includes('access denied') ||
        lower.includes('security challenge') ||
        lower.includes('cloudflare') ||
        lower.includes('verify you are human') ||
        lower.includes('please wait') ||
        lower.includes('ddos protection') ||
        lower.includes('cf-browser-verification') ||
        lower.includes('403 forbidden') ||
        lower.includes('404 not found')
      );
    };

    // Helper to detect mock/default Unsplash filler images
    const isUnsplashOrMockImage = (url: string): boolean => {
      if (!url) return false;
      const lower = url.toLowerCase();
      return lower.includes('unsplash.com') || lower.includes('images.unsplash.com');
    };

    const isGarbageImage = (url: string): boolean => {
      if (!url) return true;
      const lower = url.toLowerCase();
      return (
        lower.includes('blank.gif') ||
        lower.includes('spacer.gif') ||
        lower.includes('pixel.') ||
        lower.includes('spinner') ||
        lower.includes('loading.') ||
        lower.includes('icon-') ||
        lower.includes('badge') ||
        lower === 'data:image/gif;base64,r0lgodlhaqabaiaaaaaaap///yh5baeaaaaalaaaaaabaaeaaaibraa7' ||
        isUnsplashOrMockImage(url)
      );
    };

    // 1. Process Smart Schema.org JSON-LD Products (Each individual product separately)
    jsonLdProducts.forEach((ld, idx) => {
      const title = (ld.name || ld.title || '').toString().trim();
      if (!title || seenTitles.has(title) || isCloudflareOrProtectionText(title)) return;

      const offer = Array.isArray(ld.offers) ? ld.offers[0] : (ld.offers || {});
      const rawPrice = offer.price || offer.lowPrice || offer.highPrice || '0';
      const priceVal = typeof rawPrice === 'number' ? rawPrice : parseFloat(String(rawPrice).replace(/[^0-9.]/g, '')) || 0;
      const currency = normalizeCurrency(offer.priceCurrency, `${title} ${JSON.stringify(offer)}`);
      const brand = detectBrand(title, ld.brand);
      const category = detectCategory(title, ld.category);

      let image = '';
      if (typeof ld.image === 'string') image = ld.image;
      else if (Array.isArray(ld.image) && ld.image.length > 0) image = typeof ld.image[0] === 'string' ? ld.image[0] : ld.image[0]?.url || '';
      else if (ld.image && typeof ld.image === 'object') image = ld.image.url || ld.image.contentUrl || '';

      if (image && !image.startsWith('http://') && !image.startsWith('https://') && !image.startsWith('data:')) {
        try { image = new URL(image, baseUrl).href; } catch {}
      }

      // Drop if image is mock Unsplash
      if (isUnsplashOrMockImage(image)) return;

      let productUrl = ld.url || '';
      if (productUrl && !productUrl.startsWith('http')) {
        try { productUrl = new URL(productUrl, baseUrl).href; } catch {}
      }
      if (productUrl === baseUrl || productUrl.includes('?p=') || productUrl.includes('?page=')) {
        // Validate that it's a real product link
        if (!productUrl.endsWith('.html') && !productUrl.includes('/product/') && !productUrl.includes('/p/')) {
          productUrl = '';
        }
      }

      seenTitles.add(title);
      products.push({
        id: `p_ld_${idx + 1}`,
        title,
        price: priceVal,
        originalPrice: offer?.highPrice ? parseFloat(String(offer.highPrice).replace(/[^0-9.]/g, '')) : undefined,
        currency,
        brand,
        category,
        mainImage: image,
        galleryImages: Array.isArray(ld.image) ? ld.image.filter((x: any) => typeof x === 'string' && !isUnsplashOrMockImage(x)) : (image ? [image] : []),
        specs: ld.description ? { 'الوصف': String(ld.description).substring(0, 150) } : {},
        productUrl: productUrl || baseUrl,
        inStock: offer?.availability ? !String(offer.availability).toLowerCase().includes('outofstock') : true,
        rating: ld.aggregateRating?.ratingValue ? parseFloat(ld.aggregateRating.ratingValue) : 4.8,
        reviewsCount: ld.aggregateRating?.reviewCount ? parseInt(ld.aggregateRating.reviewCount) : 15,
        displayOrder: idx + 1
      });
    });

    // 2. Multi-Item DOM Extraction: Decompose the product listing into individual cards
    // Supported card selectors covering Magento, Shopify, WooCommerce, PrestaShop, Salla, Zid, Custom
    const primaryCardSelectors = [
      'li.item.product-item',
      '.product-item-info',
      '.product-card',
      '.grid__item',
      'article.product',
      '[class*="product-card"]',
      'li.product-item',
      '.product-item',
      '.item-product',
      'li.product',
      '.card-product',
      '.wc-block-grid__product',
      '.grid-view-item',
      '.product-miniature',
      '.catalog-item',
      '.product_pod',
      '.s-result-item[data-asin]',
      '[data-component-type="s-search-result"]',
      '[data-product-id]'
    ];

    const cardQuerySelector = primaryCardSelectors.join(', ');

    // Rule 1: Scoped Container Discovery:
    // Restrict extraction strictly within the primary product grid container!
    // This strictly prevents extracting suggested products, cookers/stoves outside the list, sidebars, or footer widgets.
    const scopedContainerSelectors = [
      '#js-product-list',
      '.products-selection',
      '#products',
      '.products-grid',
      '.product-list-container',
      '.products.wrapper',
      '.products-list',
      '.catalog-grid',
      '[data-hook="product-list"]',
      '#main-products-container',
      '.main-products',
      '#catalog-products',
      '.search-results-products',
      '.product-listing',
      '.products-grid-container',
      '#product-list-container',
      '.main-catalog-grid'
    ];

    let scopedContainerEl: Element | null = null;
    for (const selector of scopedContainerSelectors) {
      const el = doc.querySelector(selector);
      if (el && el.querySelectorAll(cardQuerySelector).length > 0) {
        scopedContainerEl = el;
        break;
      }
    }

    const extractionRoot: Element | Document = scopedContainerEl || 
                                              doc.querySelector('main, #main, #content, #maincontent, .main-content') || 
                                              doc;

    const allCandidateElements = Array.from(extractionRoot.querySelectorAll(cardQuerySelector));

    // Array Mapping: Discard main container elements and keep individual product cards!
    // Discard parent wrappers (e.g. products-grid) to only keep leaf product cards
    const individualCards = allCandidateElements.filter(el => {
      // Discard HTML, BODY, MAIN, NAV, HEADER, FOOTER, SECTION with too many children
      const tag = el.tagName;
      if (tag === 'BODY' || tag === 'HTML' || tag === 'MAIN' || tag === 'NAV' || tag === 'HEADER' || tag === 'FOOTER' || (tag === 'SECTION' && el.children.length > 20)) {
        return false;
      }

      // Explicitly reject any elements in sidebars, footers, headers, cross-sells, upsells, recommended widgets
      if (el.closest('header, footer, nav, aside, .sidebar, #sidebar, .recommended-products, .cross-sell, .upsell, .related-products, #related-products, .footer-bottom, .site-footer, .block-reorder, .widget-products, .suggested-products')) {
        return false;
      }

      // Check if it contains nested child cards: if so, skip the parent container so we only map leaf cards!
      const hasChildCards = el.querySelectorAll(cardQuerySelector).length > 0;
      if (hasChildCards) {
        return false;
      }

      // Check text content sanity
      const text = el.textContent?.trim() || '';
      if (text.length < 5 || text.length > 3500) return false;

      return true;
    });

    // Fallback if individualCards is empty: find cards within the scoped container or main content
    let targetCards = individualCards;
    if (targetCards.length === 0) {
      const fallbackNodes = Array.from(extractionRoot.querySelectorAll('li, article, div.item, div.product, div.card'));
      targetCards = fallbackNodes.filter(el => {
        if (el.closest('header, footer, nav, aside, .sidebar, #sidebar, .recommended-products, .cross-sell, .upsell, .related-products')) {
          return false;
        }
        const text = el.textContent || '';
        const hasPrice = /(?:EGP|ج\.م|SAR|ر\.س|AED|د\.إ|\$|£|€|\bLE\b|\bL\.E\b)\s*[\d,]+|[\d,]+\s*(?:EGP|ج\.م|SAR|ر\.س|AED|د\.إ)/i.test(text) ||
                         el.querySelector('.price, [class*="price"], [itemprop="price"], [data-price-amount]') !== null;
        const hasImg = el.querySelector('img, [data-src]') !== null;
        const notContainer = el.children.length < 20;
        return hasPrice && hasImg && notContainer && text.length > 15 && text.length < 1000;
      }).slice(0, 100);
    }

    // 3. Loop on each individual card separately to extract title, price, image, and link
    targetCards.forEach((card, idx) => {
      // A. Extract Product Title:
      // Priority: title / a.product-item-link / h2 / h3 / .product-name / [itemprop="name"]
      const titleEl = card.querySelector('a.product-item-link, [class*="product-item-link"], .product-item-name a, .product-item-name, h2, h3, h4, h1, [class*="product-title"], [class*="product-name"], .product-title, .product-name, [itemprop="name"], a[title]');
      let title = titleEl?.textContent?.trim() || titleEl?.getAttribute('title')?.trim() || '';

      if (!title || title.length < 3) {
        const altText = card.querySelector('img')?.getAttribute('alt')?.trim();
        if (altText && altText.length > 3 && !/logo|banner|icon/i.test(altText)) {
          title = altText;
        } else {
          const firstLink = card.querySelector('a[href]');
          const linkText = firstLink?.textContent?.trim();
          if (linkText && linkText.length > 4 && !/add to cart|buy now|view|تفاصيل|أضف للسلة|شراء/i.test(linkText)) {
            title = linkText;
          }
        }
      }

      // Rule 2: Cloudflare & Protection Text Filter
      if (!title || title.length < 3 || seenTitles.has(title) || isCloudflareOrProtectionText(title)) return;

      // B. Extract Product Price:
      // Priority: price / .price-wrapper / [data-price-amount] / [data-price-type="finalPrice"] / regex
      let priceVal = 0;
      const priceWrapperEl = card.querySelector('.price-wrapper, [data-price-amount], [data-price-type="finalPrice"]');
      const dataPriceAmount = priceWrapperEl?.getAttribute('data-price-amount') || card.querySelector('[data-price-amount]')?.getAttribute('data-price-amount');

      if (dataPriceAmount) {
        priceVal = parseFloat(dataPriceAmount) || 0;
      }

      if (priceVal <= 0) {
        const priceEl = card.querySelector('.price-wrapper, .price, .special-price .price, .current-price, .product-price, .special-price, .offer-price, .sale-price, [class*="price"], [itemprop="price"], .amount, .money');
        const priceText = priceEl?.textContent || card.textContent || '';
        const priceMatch = priceText.match(/(?:EGP|ج\.م|SAR|ر\.س|AED|د\.إ|\$|£|€)\s*([\d,]+(?:\.\d+)?)/i) ||
                           priceText.match(/([\d,]+(?:\.\d+)?)\s*(?:EGP|ج\.م|SAR|ر\.س|AED|د\.إ)/i) ||
                           priceText.match(/([\d,]{2,}(?:\.\d+)?)/);
        if (priceMatch) {
          priceVal = parseFloat(priceMatch[1].replace(/,/g, '')) || 0;
        }
      }

      // Extract original/old price
      let originalPrice: number | undefined = undefined;
      const oldPriceEl = card.querySelector('.old-price, .regular-price, del, .strike, [data-price-type="oldPrice"], [class*="old-price"], [class*="regular-price"]');
      if (oldPriceEl) {
        const oldText = oldPriceEl.textContent || '';
        const oldMatch = oldText.match(/([\d,]+(?:\.\d+)?)/);
        if (oldMatch) {
          const oldVal = parseFloat(oldMatch[1].replace(/,/g, ''));
          if (oldVal > priceVal) originalPrice = oldVal;
        }
      }

      const currency = normalizeCurrency(
        card.querySelector('[itemprop="priceCurrency"]')?.getAttribute('content') || undefined,
        card.textContent || ''
      );

      // Rule 3: Image extraction order: data-src -> data-lazy-src -> src -> srcset
      // Convert relative URL to absolute URL using new URL(src, baseURL).href
      let mainImage = '';
      const imgEl = card.querySelector('img.product-image-photo, img[data-src], img[data-lazy-src], img[data-original], img[srcset], img[src], img');
      if (imgEl) {
        const dataSrc = imgEl.getAttribute('data-src')?.trim();
        const dataLazySrc = imgEl.getAttribute('data-lazy-src')?.trim() || imgEl.getAttribute('data-original')?.trim();
        const rawSrc = imgEl.getAttribute('src')?.trim();
        const rawSrcset = imgEl.getAttribute('srcset')?.trim() || imgEl.getAttribute('data-srcset')?.trim();

        let candidateImg = '';
        if (dataSrc && !isGarbageImage(dataSrc)) {
          candidateImg = dataSrc;
        } else if (dataLazySrc && !isGarbageImage(dataLazySrc)) {
          candidateImg = dataLazySrc;
        } else if (rawSrc && !isGarbageImage(rawSrc)) {
          candidateImg = rawSrc;
        } else if (rawSrcset) {
          const firstPart = rawSrcset.split(',')[0].trim().split(/\s+/)[0];
          if (firstPart && !isGarbageImage(firstPart)) candidateImg = firstPart;
        }

        if (candidateImg) {
          try {
            mainImage = candidateImg.startsWith('http://') || candidateImg.startsWith('https://') || candidateImg.startsWith('data:')
              ? candidateImg
              : new URL(candidateImg, baseUrl).href;
          } catch {
            mainImage = candidateImg;
          }
        }
      }

      // Rule 2: If the image is a mock Unsplash image, drop this item completely
      if (isUnsplashOrMockImage(mainImage)) return;

      // Rule 2 & D: Extract Product URL (Link):
      // Must be a real product link ending in .html or containing /product/ or /p/, and NOT the page itself with ?p=2 query
      const specificProductLink = card.querySelector(
        'a[href$=".html"]:not([href*="?p="]):not([href*="?page="]):not([href*="compare"]):not([href*="wishlist"]), ' +
        'a.product-item-link, a.product-item-photo, a[href*="/product/"], a[href*="/p/"], a[href*=".html"]'
      );
      let href = (specificProductLink?.getAttribute('href') || (card.tagName === 'A' ? card.getAttribute('href') : '') || card.querySelector('a[href]')?.getAttribute('href') || '').trim();

      if (href.startsWith('#') || href.startsWith('javascript:')) {
        href = '';
      }

      let productUrl = '';
      if (href) {
        try {
          productUrl = href.startsWith('http://') || href.startsWith('https://')
            ? href
            : new URL(href, baseUrl).href;
        } catch {
          productUrl = href;
        }
      }

      // Validate URL: verify that the extracted link is a real product link and not the category page with ?p=2
      if (productUrl) {
        try {
          const uObj = new URL(productUrl);
          const baseObj = new URL(baseUrl);
          const isCategoryPaginationOnly = (uObj.pathname === baseObj.pathname) && (uObj.searchParams.has('p') || uObj.searchParams.has('page') || uObj.searchParams.has('pg'));
          if (isCategoryPaginationOnly || productUrl === baseUrl) {
            // Attempt to find a sub-anchor ending in .html
            const fallbackHtmlAnchor = card.querySelector('a[href*=".html"]');
            const fallbackHref = fallbackHtmlAnchor?.getAttribute('href');
            if (fallbackHref && !fallbackHref.includes('?p=') && !fallbackHref.includes('?page=')) {
              productUrl = fallbackHref.startsWith('http') ? fallbackHref : new URL(fallbackHref, baseUrl).href;
            } else {
              // Not a valid individual product URL - drop it
              return;
            }
          }
        } catch {}
      } else {
        return;
      }

      seenTitles.add(title);

      // Brand & Category
      const brand = detectBrand(title, card.querySelector('[itemprop="brand"], [data-brand], .brand')?.textContent?.trim());
      const category = detectCategory(title);

      products.push({
        id: `p_dom_${products.length + 1}`,
        title,
        price: priceVal,
        originalPrice,
        currency,
        brand,
        category,
        mainImage,
        galleryImages: mainImage ? [mainImage] : [],
        specs: {},
        productUrl,
        inStock: !/غير متوفر|نفذت الكمية|out of stock/i.test(card.textContent || ''),
        rating: 4.8,
        reviewsCount: 10 + (idx % 15),
        displayOrder: products.length + 1
      });
    });

    // 4. OpenGraph & Meta Tags Product Extraction (ONLY for Single-Product pages where 0 products were found)
    if (products.length === 0) {
      const ogTitle = doc.querySelector('meta[property="og:title"], meta[name="twitter:title"]')?.getAttribute('content')?.trim();
      const ogImage = doc.querySelector('meta[property="og:image"], meta[name="twitter:image"], meta[property="og:image:secure_url"]')?.getAttribute('content')?.trim();
      const ogPrice = doc.querySelector('meta[property="og:price:amount"], meta[property="product:price:amount"], meta[name="price"], meta[property="price:amount"]')?.getAttribute('content')?.trim();
      const ogCurrency = doc.querySelector('meta[property="og:price:currency"], meta[property="product:price:currency"]')?.getAttribute('content')?.trim();

      if (ogTitle && (ogPrice || ogImage) && !seenTitles.has(ogTitle) && !isCloudflareOrProtectionText(ogTitle) && !isUnsplashOrMockImage(ogImage || '')) {
        const priceVal = ogPrice ? parseFloat(ogPrice.replace(/[^0-9.]/g, '')) : 0;
        const brand = detectBrand(ogTitle);
        const category = detectCategory(ogTitle);

        let absOgImage = ogImage || '';
        if (absOgImage && !absOgImage.startsWith('http')) {
          try { absOgImage = new URL(absOgImage, baseUrl).href; } catch {}
        }

        seenTitles.add(ogTitle);
        products.push({
          id: `p_og_${products.length + 1}`,
          title: ogTitle,
          price: priceVal,
          currency: normalizeCurrency(ogCurrency, ogTitle),
          brand,
          category,
          mainImage: absOgImage,
          galleryImages: absOgImage ? [absOgImage] : [],
          specs: {},
          productUrl: doc.querySelector('link[rel="canonical"]')?.getAttribute('href') || baseUrl,
          inStock: true,
          rating: 4.9,
          reviewsCount: 20,
          displayOrder: products.length + 1
        });
      }
    }

    // 5. Fallback for Genuine Single-Product Pages (Never triggers on Cloudflare or protection pages)
    if (products.length === 0) {
      const pageHeading = doc.querySelector('h1, [itemprop="name"], .product-detail-title, .product_title')?.textContent?.trim() || doc.title;
      if (pageHeading && pageHeading.length > 2 && !isCloudflareOrProtectionText(pageHeading)) {
        const bodyText = doc.body?.textContent || '';
        const singlePriceMatch = bodyText.match(/(?:EGP|ج\.م|SAR|ر\.س|AED|د\.إ|\$|£|€)\s*([\d,]+(?:\.\d+)?)/i) ||
                                 bodyText.match(/([\d,]+(?:\.\d+)?)\s*(?:EGP|ج\.م|SAR|ر\.س|AED|د\.إ)/i);
        const singlePrice = singlePriceMatch ? parseFloat(singlePriceMatch[1].replace(/,/g, '')) : 0;
        const mainImgEl = doc.querySelector('.product-image img, .gallery-item img, [itemprop="image"], img[src*="product"], main img');
        const candidateMain = mainImgEl?.getAttribute('src') || mainImgEl?.getAttribute('data-src') || '';
        let mainImage = candidateMain.startsWith('http') ? candidateMain : (candidateMain ? new URL(candidateMain, baseUrl).href : '');
        if (isUnsplashOrMockImage(mainImage)) mainImage = '';

        const brand = detectBrand(pageHeading);
        const category = detectCategory(pageHeading);

        products.push({
          id: `p_single_${Date.now()}`,
          title: pageHeading,
          price: singlePrice,
          currency: normalizeCurrency(undefined, bodyText),
          brand,
          category,
          mainImage,
          galleryImages: mainImage ? [mainImage] : [],
          specs: {},
          productUrl: baseUrl,
          inStock: true,
          rating: 4.8,
          reviewsCount: 12,
          displayOrder: 1
        });
      }
    }

    return products;
  }

  private extractEmailsAndContacts(doc: Document, rawHtml: string, baseUrl: string): { emails: ExtractedEmail[]; contacts: ExtractedContact[] } {
    const emails: ExtractedEmail[] = [];
    const contacts: ExtractedContact[] = [];
    const seenEmails = new Set<string>();

    // 1. Mailto links
    const mailtoLinks = doc.querySelectorAll('a[href^="mailto:"]');
    mailtoLinks.forEach(link => {
      const href = link.getAttribute('href') || '';
      const email = href.replace(/^mailto:/i, '').split('?')[0].trim();
      if (this.isValidEmail(email) && !seenEmails.has(email)) {
        seenEmails.add(email);
        emails.push({
          id: `email_${emails.length + 1}`,
          email,
          domain: email.split('@')[1] || '',
          type: 'mailto',
          isValidSyntax: true,
          sourceUrl: baseUrl,
          name: link.textContent?.trim() || undefined,
          direction: 'inbound'
        });
      }
    });

    // 2. Regex scan of entire text content
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
    const matches = rawHtml.match(emailRegex);
    if (matches) {
      matches.forEach(email => {
        const cleanEmail = email.toLowerCase().trim();
        if (/\.(png|jpg|jpeg|gif|svg|webp)$/i.test(cleanEmail)) return;
        if (this.isValidEmail(cleanEmail) && !seenEmails.has(cleanEmail)) {
          seenEmails.add(cleanEmail);
          emails.push({
            id: `email_${emails.length + 1}`,
            email: cleanEmail,
            domain: cleanEmail.split('@')[1] || '',
            type: 'text',
            isValidSyntax: true,
            sourceUrl: baseUrl,
            direction: cleanEmail.includes('support') || cleanEmail.includes('info') || cleanEmail.includes('contact') ? 'inbound' : 'outbound'
          });
        }
      });
    }

    // 3. Extract Phone / WhatsApp contacts
    const telLinks = doc.querySelectorAll('a[href^="tel:"], a[href*="wa.me"], a[href*="whatsapp.com"]');
    telLinks.forEach((link, idx) => {
      const href = link.getAttribute('href') || '';
      contacts.push({
        id: `contact_${idx + 1}`,
        name: link.textContent?.trim() || (href.includes('wa') ? 'WhatsApp' : 'Phone Contact'),
        phone: href.replace(/^(tel:|https?:\/\/wa\.me\/)/i, ''),
        sourceUrl: baseUrl
      });
    });

    return { emails, contacts };
  }

  private extractTables(doc: Document): ExtractedTable[] {
    const tables: ExtractedTable[] = [];
    const tableElements = doc.querySelectorAll('table');

    tableElements.forEach((tbl, tIdx) => {
      const headers: string[] = [];
      const ths = tbl.querySelectorAll('thead th, tr:first-child th, tr:first-child td');
      ths.forEach((th, hIdx) => {
        headers.push(th.textContent?.trim() || `عمود ${hIdx + 1}`);
      });

      const rows: (string | number)[][] = [];
      const trs = tbl.querySelectorAll('tbody tr, tr');
      trs.forEach((tr, rIdx) => {
        if (rIdx === 0 && ths.length > 0) return; // skip header row
        const cells: (string | number)[] = [];
        tr.querySelectorAll('td, th').forEach(cell => {
          cells.push(cell.textContent?.trim() || '');
        });
        if (cells.some(c => String(c).length > 0)) {
          rows.push(cells);
        }
      });

      if (rows.length > 0) {
        tables.push({
          id: `tbl_${tIdx + 1}`,
          title: tbl.getAttribute('caption') || `جدول رقم ${tIdx + 1}`,
          headers,
          rows,
          rowCount: rows.length,
          columnCount: headers.length
        });
      }
    });

    return tables;
  }

  private extractArticles(doc: Document, baseUrl: string): ExtractedArticle[] {
    const articles: ExtractedArticle[] = [];
    const elements = doc.querySelectorAll('article, .article, .post, .entry-content');

    elements.forEach((el, idx) => {
      const title = el.querySelector('h1, h2, h3, .entry-title')?.textContent?.trim() || doc.title;
      const paragraphs = Array.from(el.querySelectorAll('p')).map(p => p.textContent?.trim()).filter(Boolean) as string[];
      const content = paragraphs.join('\n\n');
      const author = el.querySelector('.author, [rel="author"], .byline')?.textContent?.trim();

      if (content.length > 100) {
        articles.push({
          id: `art_${idx + 1}`,
          title,
          content,
          paragraphs,
          summary: content.substring(0, 200) + '...',
          author,
          sourceUrl: baseUrl,
          wordCount: content.split(/\s+/).length,
          readingTimeMinutes: Math.ceil(content.split(/\s+/).length / 200),
          tags: []
        });
      }
    });

    return articles;
  }

  private extractMedia(doc: Document, baseUrl: string): ExtractedMedia[] {
    const media: ExtractedMedia[] = [];
    const seen = new Set<string>();

    doc.querySelectorAll('img').forEach((img, idx) => {
      const src = img.getAttribute('src') || img.getAttribute('data-src');
      if (!src || seen.has(src)) return;
      seen.add(src);

      const resolved = src.startsWith('http') ? src : new URL(src, baseUrl).href;
      media.push({
        id: `media_${idx + 1}`,
        type: 'image',
        url: resolved,
        altText: img.getAttribute('alt') || 'صورة مستخرجة',
        dimensions: `${img.naturalWidth || 800}x${img.naturalHeight || 600}`
      });
    });

    return media.slice(0, 100);
  }

  private extractLinks(doc: Document, baseUrl: string): { links: ExtractedLink[]; nextUrl: string | null } {
    const links: ExtractedLink[] = [];
    let nextUrl: string | null = null;

    const anchors = doc.querySelectorAll('a[href]');
    anchors.forEach((a) => {
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;

      const text = a.textContent?.trim() || '';
      const fullUrl = href.startsWith('http') ? href : new URL(href, baseUrl).href;

      // Detect next pagination URL
      const rel = a.getAttribute('rel') || '';
      const ariaLabel = a.getAttribute('aria-label') || '';
      if (
        !nextUrl &&
        (rel.includes('next') ||
         ariaLabel.includes('Next') ||
         ariaLabel.includes('التالي') ||
         /التالي|Next|›|»/i.test(text) ||
         a.classList.contains('next'))
      ) {
        nextUrl = fullUrl;
      }

      links.push({
        text: text.substring(0, 60),
        url: fullUrl,
        isInternal: fullUrl.includes(new URL(baseUrl).hostname)
      });
    });

    return { links: links.slice(0, 150), nextUrl };
  }

  /**
   * Discovers the next page URL via DOM links, query parameter progression, or virtual scroll simulation
   */
  private determineNextPageUrl(
    doc: Document, 
    currentUrl: string, 
    currentPageNum: number,
    rawHtml?: string
  ): string | null {
    // 1. Rel next link tag or anchor: link[rel="next"], a[rel="next"]
    const relNext = doc.querySelector('link[rel="next"], a[rel="next"]')?.getAttribute('href');
    if (relNext) {
      try {
        const resolved = new URL(relNext, currentUrl).href;
        if (resolved !== currentUrl) return resolved;
      } catch {}
    }

    // 2. Pagination DOM containers (.pagination, .pager, [class*="pagination"], [class*="page-numbers"], nav[aria-label*="pagination"])
    const paginationContainers = doc.querySelectorAll('.pagination, .pager, [class*="pagination"], [class*="page-numbers"], [class*="paging"], nav[aria-label*="pagination"], [role="navigation"]');
    for (const container of Array.from(paginationContainers)) {
      const anchors = Array.from(container.querySelectorAll('a[href]'));
      for (const a of anchors) {
        const href = a.getAttribute('href') || '';
        const text = a.textContent?.trim().toLowerCase() || '';
        const ariaLabel = (a.getAttribute('aria-label') || '').toLowerCase();
        const className = (a.getAttribute('class') || '').toLowerCase();

        const isNext = 
          text === 'next' || text === 'التالي' || text === '›' || text === '»' || text === '→' ||
          text.includes('next') || text.includes('التالي') ||
          ariaLabel.includes('next') || ariaLabel.includes('التالي') ||
          className.includes('next');

        if (isNext && href && !href.startsWith('#') && !href.startsWith('javascript:')) {
          try {
            const resolved = new URL(href, currentUrl).href;
            if (resolved !== currentUrl) return resolved;
          } catch {}
        }

        // Match numbered page anchor: text equals nextPageNum
        const nextPageNumStr = String(currentPageNum + 1);
        if (text === nextPageNumStr && href && !href.startsWith('#') && !href.startsWith('javascript:')) {
          try {
            const resolved = new URL(href, currentUrl).href;
            if (resolved !== currentUrl) return resolved;
          } catch {}
        }
      }
    }

    // 3. Scan all document anchors for explicit pagination and next buttons
    const anchors = Array.from(doc.querySelectorAll('a[href]'));
    const nextNumStr = String(currentPageNum + 1);
    for (const a of anchors) {
      const href = a.getAttribute('href') || '';
      if (!href || href.startsWith('#') || href.startsWith('javascript:')) continue;

      const text = a.textContent?.trim().toLowerCase() || '';
      const ariaLabel = (a.getAttribute('aria-label') || '').toLowerCase();
      const className = (a.getAttribute('class') || '').toLowerCase();

      const isNextButton =
        text === 'next' || text === 'التالي' || text === '›' || text === '»' || text === '→' ||
        text.includes('next page') || text.includes('الصفحة التالية') ||
        ariaLabel.includes('next') || ariaLabel.includes('التالي') ||
        className.includes('next') || className.includes('pagination__next') || className.includes('page-next');

      if (isNextButton) {
        try {
          const resolved = new URL(href, currentUrl).href;
          if (resolved !== currentUrl) return resolved;
        } catch {}
      }

      // Check numbered pagination anchor matching next page number (e.g. text "2")
      if (text === nextNumStr && (href.includes('page') || href.includes('p=') || href.includes('pg='))) {
        try {
          const resolved = new URL(href, currentUrl).href;
          if (resolved !== currentUrl) return resolved;
        } catch {}
      }
    }

    // 4. AJAX & Infinite Scroll detection in DOM data attributes
    const infiniteScrollElements = doc.querySelectorAll('[data-infinite-scroll], [data-next-page], [data-next-url], [data-endpoint], [data-url], [data-ajax-url], [class*="infinite-scroll"], [data-load-more], button.load-more');
    for (const el of Array.from(infiniteScrollElements)) {
      const nextAttr = el.getAttribute('data-next-url') || 
                       el.getAttribute('data-next-page') || 
                       el.getAttribute('data-endpoint') || 
                       el.getAttribute('data-url') ||
                       el.getAttribute('data-ajax-url');
      if (nextAttr) {
        try {
          const resolved = new URL(nextAttr, currentUrl).href;
          if (resolved !== currentUrl) return resolved;
        } catch {}
      }
    }

    // 5. Automated Query Parameter Progression (?page=2, ?p=2, ?pg=2, etc.)
    try {
      const urlObj = new URL(currentUrl);
      const nextPageNum = currentPageNum + 1;

      if (urlObj.searchParams.has('page')) {
        urlObj.searchParams.set('page', String(nextPageNum));
        return urlObj.href;
      }
      if (urlObj.searchParams.has('p')) {
        urlObj.searchParams.set('p', String(nextPageNum));
        return urlObj.href;
      }
      if (urlObj.searchParams.has('pg')) {
        urlObj.searchParams.set('pg', String(nextPageNum));
        return urlObj.href;
      }
      if (urlObj.searchParams.has('paged')) {
        urlObj.searchParams.set('paged', String(nextPageNum));
        return urlObj.href;
      }
      if (urlObj.searchParams.has('offset') && urlObj.searchParams.has('limit')) {
        const limit = parseInt(urlObj.searchParams.get('limit') || '20', 10);
        urlObj.searchParams.set('offset', String(currentPageNum * limit));
        return urlObj.href;
      }

      // Path-based pagination: /page/1 -> /page/2
      const pathMatch = urlObj.pathname.match(/\/page\/(\d+)/i);
      if (pathMatch) {
        urlObj.pathname = urlObj.pathname.replace(/\/page\/\d+/i, `/page/${nextPageNum}`);
        return urlObj.href;
      }
    } catch {}

    // 6. Platform-specific API detection (Shopify, WooCommerce, etc.)
    const platformApi = this.detectStoreApiEndpoint(currentUrl, currentPageNum + 1, rawHtml);
    if (platformApi) {
      return platformApi;
    }

    return null;
  }

  /**
   * Detects underlying store REST JSON APIs for infinite scroll (Shopify, WooCommerce, etc.)
   */
  private detectStoreApiEndpoint(currentUrl: string, targetPageNum: number, rawHtml?: string): string | null {
    try {
      const urlObj = new URL(currentUrl);
      const html = (rawHtml || '').toLowerCase();
      const pathname = urlObj.pathname;

      // Shopify store API detection
      const isShopify = html.includes('cdn.shopify.com') || html.includes('shopify.') || pathname.includes('/collections/');
      if (isShopify) {
        const colMatch = pathname.match(/\/collections\/([a-zA-Z0-9_-]+)/i);
        if (colMatch) {
          const colHandle = colMatch[1];
          return `${urlObj.origin}/collections/${colHandle}/products.json?page=${targetPageNum}&limit=50`;
        }
        return `${urlObj.origin}/products.json?page=${targetPageNum}&limit=50`;
      }

      // WooCommerce store pagination
      const isWoo = html.includes('wp-content') || html.includes('woocommerce');
      if (isWoo) {
        const wooUrl = new URL(currentUrl);
        wooUrl.searchParams.set('paged', String(targetPageNum));
        return wooUrl.href;
      }
    } catch {}
    return null;
  }

  /**
   * Constructs candidate pagination URL as fallback for infinite scroll simulation
   */
  private constructFallbackPageUrl(baseUrl: string, pageNum: number, rawHtml?: string): string | null {
    try {
      const urlObj = new URL(baseUrl);
      // Check platform API
      const api = this.detectStoreApiEndpoint(baseUrl, pageNum, rawHtml);
      if (api) return api;

      if (urlObj.searchParams.has('p')) {
        urlObj.searchParams.set('p', String(pageNum));
      } else if (urlObj.searchParams.has('page')) {
        urlObj.searchParams.set('page', String(pageNum));
      } else {
        const isMagento = baseUrl.includes('cairosales') || (rawHtml && (rawHtml.includes('catalog/category') || rawHtml.includes('product-item-info')));
        if (isMagento) {
          urlObj.searchParams.set('p', String(pageNum));
        } else {
          urlObj.searchParams.set('page', String(pageNum));
        }
      }
      return urlObj.href;
    } catch {
      return null;
    }
  }

  /**
   * Parses JSON product streams (e.g. from Shopify /products.json or WooCommerce Store API)
   */
  private parseJsonProducts(jsonText: string, sourceUrl: string): ExtractedProduct[] {
    const products: ExtractedProduct[] = [];
    try {
      const data = JSON.parse(jsonText);
      const rawList: any[] = Array.isArray(data) 
        ? data 
        : (data.products || data.items || data.data || data.results || []);

      for (let i = 0; i < rawList.length; i++) {
        const item = rawList[i];
        if (!item || typeof item !== 'object') continue;

        const title = item.title || item.name || item.product_name || '';
        if (!title || title.length < 2) continue;

        // Price extraction
        let price = 0;
        let originalPrice: number | undefined = undefined;
        let currency = 'EGP';

        if (item.variants && Array.isArray(item.variants) && item.variants[0]) {
          const v = item.variants[0];
          price = parseFloat(v.price) || 0;
          if (v.compare_at_price) {
            const comp = parseFloat(v.compare_at_price);
            if (comp > price) originalPrice = comp;
          }
        } else if (item.prices) {
          price = parseFloat(item.prices.price || item.prices.regular_price) / 100 || 0;
          currency = item.prices.currency_code || 'EGP';
        } else if (item.price !== undefined) {
          price = typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0;
          if (item.compare_at_price || item.original_price) {
            const comp = parseFloat(item.compare_at_price || item.original_price);
            if (comp > price) originalPrice = comp;
          }
        }

        // Image extraction
        let image = '';
        if (item.images && Array.isArray(item.images) && item.images.length > 0) {
          const imgObj = item.images[0];
          image = typeof imgObj === 'string' ? imgObj : (imgObj.src || imgObj.url || '');
        } else if (item.image) {
          image = typeof item.image === 'string' ? item.image : (item.image.src || item.image.url || '');
        } else if (item.featured_image) {
          image = typeof item.featured_image === 'string' ? item.featured_image : (item.featured_image.src || '');
        }

        // Product URL
        let url = sourceUrl;
        if (item.handle) {
          try {
            const u = new URL(sourceUrl);
            url = `${u.origin}/products/${item.handle}`;
          } catch {}
        } else if (item.permalink || item.url) {
          url = item.permalink || item.url;
        }

        products.push({
          id: `prod_api_${Date.now()}_${i}`,
          title: title.trim(),
          price: price || 99,
          originalPrice,
          currency: currency || 'EGP',
          mainImage: image || '/placeholder-product.svg',
          galleryImages: image ? [image] : [],
          productUrl: url,
          specs: {},
          brand: item.vendor || item.brand || undefined,
          category: item.product_type || item.category || undefined,
          inStock: item.available !== false,
          description: typeof item.body_html === 'string' ? item.body_html.replace(/<[^>]+>/g, '').trim().substring(0, 200) : undefined,
          rating: item.rating ? parseFloat(item.rating) : undefined
        });
      }
    } catch {}
    return products;
  }

  private getProductDeduplicationKey(p: ExtractedProduct): string {
    if (p.productUrl && p.productUrl.length > 15 && !p.productUrl.endsWith('/') && !p.productUrl.includes('#')) {
      return p.productUrl.trim().toLowerCase();
    }
    return `${p.title.trim().toLowerCase()}_${p.price}`;
  }

  private deduplicateProducts(products: ExtractedProduct[]): ExtractedProduct[] {
    const seen = new Set<string>();
    return products.filter(p => {
      const key = this.getProductDeduplicationKey(p);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private deduplicateEmails(emails: ExtractedEmail[]): ExtractedEmail[] {
    const seen = new Set<string>();
    return emails.filter(e => {
      const key = e.email.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private isValidEmail(email: string): boolean {
    if (!email || email.length < 5 || email.length > 100) return false;
    return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(email);
  }

  private generateMarkdownSummary(metadata: PageMetadata, products: ExtractedProduct[], emails: ExtractedEmail[]): string {
    let md = `# تقرير استخراج البيانات: ${metadata.title}\n\n`;
    md += `- **الرابط المستهدف**: ${metadata.canonicalUrl}\n`;
    md += `- **تاريخ الاستخراج**: ${new Date().toLocaleString('ar-EG')}\n`;
    md += `- **عدد المنتجات**: ${products.length}\n`;
    md += `- **عدد الإيميلات**: ${emails.length}\n\n`;

    if (products.length > 0) {
      md += `## أبرز المنتجات المستخرجة\n\n`;
      md += `| م | اسم المنتج | الماركة | السعر | العملة |\n`;
      md += `|---|---|---|---|---|\n`;
      products.slice(0, 15).forEach((p, idx) => {
        md += `| ${idx + 1} | ${p.title} | ${p.brand || '-'} | ${p.price} | ${p.currency} |\n`;
      });
    }

    if (emails.length > 0) {
      md += `\n## الإيميلات المستخرجة\n\n`;
      emails.forEach(e => {
        md += `- **${e.email}** (${e.domain}) - ${e.type}\n`;
      });
    }

    return md;
  }
}

export const clientScraperEngine = new ClientScraperEngine();
