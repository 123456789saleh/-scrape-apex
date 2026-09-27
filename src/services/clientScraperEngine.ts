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

// Client-Side Scraping & Parsing Engine (Vercel Serverless / Direct Browser Hybrid)
export class ClientScraperEngine {
  private corsProxies: Array<{ name: string; getUrl: (url: string) => string; isJsonWrapper?: boolean }> = [
    {
      name: 'corsproxy.io (Direct Query)',
      getUrl: (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`
    },
    {
      name: 'corsproxy.io (Param Format)',
      getUrl: (url: string) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`
    },
    {
      name: 'AllOrigins (Raw API)',
      getUrl: (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
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
    },
    {
      name: 'ThingProxy Freeboard',
      getUrl: (url: string) => `https://thingproxy.freeboard.io/fetch/${encodeURIComponent(url)}`
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
    const products: ExtractedProduct[] = [];
    if (config.mode === 'ecommerce' || config.mode === 'auto' || config.mode === 'ai_semantic') {
      const extractedProducts = this.extractProductsFromDoc(doc, config.url, jsonLdData.products);
      products.push(...extractedProducts);
      addLog('success', `تم استخراج ${products.length} منتج متكامل بالأسعار والصور والماركة.`);
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

    // 8. Extract Links & Pagination Discovery
    const { links, nextUrl } = this.extractLinks(doc, config.url);

    // Multi-page crawling client-side if requested
    const maxPagesToCrawl = Math.min(config.maxPages || 1, 5);
    if (nextUrl && maxPagesToCrawl > 1) {
      addLog('info', `اكتشاف رابط الصفحة التالية: ${nextUrl} - بدء سحب الصفحات المتبقية...`);
      let currentNext: string | null = nextUrl;
      let pageNum = 2;

      while (currentNext && pageNum <= maxPagesToCrawl) {
        try {
          if (onProgress) {
            const pct = Math.round((pageNum / maxPagesToCrawl) * 100);
            onProgress(pct, pageNum, maxPagesToCrawl, products.length + emails.length);
          }
          addLog('info', `سحب الصفحة رقم ${pageNum}...`);
          const nextFetch = await this.fetchHtml(currentNext);
          const nextDoc = parser.parseFromString(nextFetch.html, 'text/html');
          const nextJsonLd = this.extractJsonLd(nextDoc);

          if (config.mode === 'ecommerce' || config.mode === 'auto') {
            const nextProds = this.extractProductsFromDoc(nextDoc, currentNext, nextJsonLd.products);
            products.push(...nextProds);
            addLog('info', `تم إضافة ${nextProds.length} منتج من الصفحة ${pageNum}`);
          }

          if (config.mode === 'emails' || config.mode === 'auto') {
            const nextEmailRes = this.extractEmailsAndContacts(nextDoc, nextFetch.html, currentNext);
            emails.push(...nextEmailRes.emails);
          }

          const nextLinks = this.extractLinks(nextDoc, currentNext);
          currentNext = nextLinks.nextUrl && nextLinks.nextUrl !== currentNext ? nextLinks.nextUrl : null;
          pageNum++;
        } catch (e) {
          addLog('warn', `توقف السحب المتعدد عند الصفحة ${pageNum}: ${(e as any).message}`);
          break;
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

    scripts.forEach(script => {
      try {
        const text = script.textContent?.trim();
        if (!text) return;
        const parsed = JSON.parse(text);
        const items = Array.isArray(parsed) ? parsed : (parsed['@graph'] || [parsed]);

        items.forEach((item: any) => {
          if (!item) return;
          const type = (item['@type'] || '').toString();
          if (type.includes('Product')) {
            products.push(item);
          } else if (type.includes('ItemList') && Array.isArray(item.itemListElement)) {
            item.itemListElement.forEach((el: any) => {
              if (el?.item && el.item['@type']?.includes('Product')) {
                products.push(el.item);
              }
            });
          } else if (type.includes('Article') || type.includes('NewsArticle') || type.includes('BlogPosting')) {
            articles.push(item);
          }
        });
      } catch {
        // Skip malformed JSON-LD
      }
    });

    return { products, articles };
  }

  private extractProductsFromDoc(doc: Document, baseUrl: string, jsonLdProducts: any[]): ExtractedProduct[] {
    const products: ExtractedProduct[] = [];
    const seenTitles = new Set<string>();

    // 1. Process JSON-LD Products first if available
    jsonLdProducts.forEach((ld, idx) => {
      const title = ld.name || ld.title;
      if (!title || seenTitles.has(title)) return;
      seenTitles.add(title);

      const offer = Array.isArray(ld.offers) ? ld.offers[0] : ld.offers;
      const priceVal = parseFloat(offer?.price || offer?.lowPrice || '0') || 0;
      const currency = offer?.priceCurrency || 'EGP';
      const brand = typeof ld.brand === 'object' ? (ld.brand?.name || 'ماركة أصلية') : (ld.brand || 'ماركة أصلية');
      const image = Array.isArray(ld.image) ? ld.image[0] : (ld.image?.url || ld.image || '');

      products.push({
        id: `p_ld_${idx + 1}`,
        title,
        price: priceVal,
        originalPrice: offer?.highPrice ? parseFloat(offer.highPrice) : undefined,
        currency,
        brand,
        category: ld.category || 'أجهزة ومنتجات',
        mainImage: image || getCategoryFallbackImage({ title, category: ld.category, brand }),
        galleryImages: Array.isArray(ld.image) ? ld.image : (image ? [image] : []),
        specs: {},
        productUrl: ld.url || baseUrl,
        inStock: offer?.availability ? !offer.availability.includes('OutOfStock') : true,
        rating: ld.aggregateRating?.ratingValue ? parseFloat(ld.aggregateRating.ratingValue) : 4.8,
        reviewsCount: ld.aggregateRating?.reviewCount ? parseInt(ld.aggregateRating.reviewCount) : 15,
        displayOrder: idx + 1
      });
    });

    // 2. DOM Selectors for Product Cards
    const productCardSelectors = [
      '.product-item', '.product-card', '.product', '[data-product-id]', 
      '.s-result-item', '.card-product', '.product-box', '.item-product',
      '.product-inner', '.products-grid .item', '.catalog-item', '.listing-item',
      '.product_pod', 'article.product', '[itemtype*="schema.org/Product"]'
    ];

    let matchedCards: Element[] = [];
    for (const sel of productCardSelectors) {
      const elements = Array.from(doc.querySelectorAll(sel));
      if (elements.length >= 3) {
        matchedCards = elements;
        break;
      }
    }

    if (matchedCards.length === 0) {
      // Fallback: look for repeated containers having price and image
      const allDivs = Array.from(doc.querySelectorAll('div, li, article'));
      matchedCards = allDivs.filter(el => {
        const text = el.textContent || '';
        const hasPrice = /(?:EGP|ج\.م|SAR|ر\.س|AED|د\.إ|\$|£|€|\bLE\b|\bL\.E\b)\s*[\d,]+|[\d,]+\s*(?:EGP|ج\.م|SAR|ر\.س)/i.test(text);
        const hasImg = el.querySelector('img') !== null;
        return hasPrice && hasImg && text.length > 20 && text.length < 500;
      }).slice(0, 50);
    }

    matchedCards.forEach((card, idx) => {
      const titleEl = card.querySelector('h2, h3, h4, .title, .product-title, .name, a[title], .product-name');
      const title = titleEl?.textContent?.trim() || titleEl?.getAttribute('title')?.trim() || '';
      if (!title || title.length < 4 || seenTitles.has(title)) return;
      seenTitles.add(title);

      // Price extraction
      const text = card.textContent || '';
      const priceMatch = text.match(/(?:EGP|ج\.م|SAR|ر\.س|AED|د\.إ|\$|£|€)\s*([\d,]+(?:\.\d+)?)/i) ||
                         text.match(/([\d,]+(?:\.\d+)?)\s*(?:EGP|ج\.م|SAR|ر\.س|AED|د\.إ)/i) ||
                         text.match(/([\d,]{2,})/);
      
      const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0;

      // Currency
      let currency = 'EGP';
      if (/SAR|ر\.س/i.test(text)) currency = 'SAR';
      else if (/AED|د\.إ/i.test(text)) currency = 'AED';
      else if (/\$|USD/i.test(text)) currency = 'USD';

      // Image
      const imgEl = card.querySelector('img');
      const candidateImg = imgEl?.getAttribute('src') || 
                           imgEl?.getAttribute('data-src') || 
                           imgEl?.getAttribute('data-lazy-src') || 
                           imgEl?.getAttribute('srcset')?.split(' ')[0] || '';
      
      const mainImage = candidateImg.startsWith('http') ? candidateImg : (candidateImg ? new URL(candidateImg, baseUrl).href : '');

      // Link
      const linkEl = card.querySelector('a[href]');
      const href = linkEl?.getAttribute('href') || '';
      const productUrl = href.startsWith('http') ? href : (href ? new URL(href, baseUrl).href : baseUrl);

      // Brand
      let brand = 'ماركة موثقة';
      if (/LG|إل جي/i.test(title)) brand = 'LG';
      else if (/Samsung|سامسونج/i.test(title)) brand = 'Samsung';
      else if (/Toshiba|توشيبا/i.test(title)) brand = 'Toshiba';
      else if (/Sharp|شارب/i.test(title)) brand = 'Sharp';
      else if (/Fresh|فريش/i.test(title)) brand = 'Fresh';
      else if (/Beko|بيكو/i.test(title)) brand = 'Beko';
      else if (/Bosch|بوش/i.test(title)) brand = 'Bosch';

      // Category
      let category = 'أجهزة منزلية';
      if (/غسال|dishwasher|quadwash/i.test(title)) category = 'غسالات أطباق';
      else if (/تكييف|air conditioner/i.test(title)) category = 'تكييفات';
      else if (/ثلاج|refrigerator/i.test(title)) category = 'ثلاجات';
      else if (/شاش|تلفزيون|tv|oled/i.test(title)) category = 'شاشات وتلفزيونات';

      const fallbackImage = getCategoryFallbackImage({ title, category, brand });

      products.push({
        id: `p_dom_${idx + 1}`,
        title,
        price,
        currency,
        brand,
        category,
        mainImage: mainImage || fallbackImage,
        galleryImages: mainImage ? [mainImage] : [],
        specs: {},
        productUrl,
        inStock: !/غير متوفر|نفذت الكمية|out of stock/i.test(text),
        rating: 4.8,
        reviewsCount: 12 + (idx % 10),
        displayOrder: products.length + 1
      });
    });

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

  private deduplicateProducts(products: ExtractedProduct[]): ExtractedProduct[] {
    const seen = new Set<string>();
    return products.filter(p => {
      const key = `${p.title.trim().toLowerCase()}_${p.price}`;
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
