import React, { useState, useEffect, useRef } from 'react';
import { 
  ScrapeConfig, 
  ScrapeResult, 
  ScrapeLog, 
  PresetSite 
} from './types/scraper.ts';
import { Header } from './components/Header.tsx';
import { InputPanel } from './components/InputPanel.tsx';
import { LiveCrawlerProgress } from './components/LiveCrawlerProgress.tsx';
import { ResultsDashboard } from './components/ResultsDashboard.tsx';
import { HistoryDrawer } from './components/HistoryDrawer.tsx';
import { 
  Globe2, 
  ShieldCheck, 
  Zap, 
  Sparkles, 
  ShoppingBag, 
  Table as TableIcon, 
  Cpu, 
  FileSpreadsheet, 
  CheckCircle2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { globalApexScraperService } from './services/apexScraperService';

export default function App() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [presets, setPresets] = useState<PresetSite[]>([]);
  
  // Default config
  const [config, setConfig] = useState<ScrapeConfig>({
    url: 'https://www.jumia.com.eg/flash-sales/',
    mode: 'ecommerce',
    enableJs: true,
    enableAiInference: true,
    extractImages: true,
    translateToArabic: true,
    cleanData: true,
    respectRobots: false,
    userAgentType: 'rotate_all',
    paginationMode: 'first_n_pages',
    maxPages: 5,
    maxCatalogPages: 5,
    crawlAllProductPages: true,
    crawlAllStorePages: true,
    timeoutMs: 30000,
    rateLimitMs: 500,
    customSelectors: [],
    customHeaders: {},
    customCookies: {},
    removeDuplicates: true,
    crawlDepth: 'level_3_deep_product',
    preserveScreenOrder: true,
    maxItemsLimit: 0,
    simulateFullScroll: true,
    extractSubPagesDeep: true,
    scrollPasses: 8,
    scrollIntervalMs: 250,
    lazyLoadResolution: true,
    expandDynamicCarousels: true,
    crawlContactPages: true,
    detectObfuscatedEmails: true,
    verifyEmailSyntax: true,
    extractAssociatedNames: true,
    crawlAllEmailPages: true,
    emailPaginationMode: 'auto_all_pages',
    extractionFields: {
      specs: true,
      galleryImages: true,
      sellerDetails: true,
      sellerRating: true,
      warranty: true,
      bulletPoints: true,
      stockAndShipping: true,
      description: true,
      skuAndBrand: true,
      priceHistory: true
    }
  });

  const [isScraping, setIsScraping] = useState(false);
  const [scrapeLogs, setScrapeLogs] = useState<ScrapeLog[]>([]);
  const [currentResult, setCurrentResult] = useState<ScrapeResult | null>(null);
  const [history, setHistory] = useState<ScrapeResult[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);
  const fullResultsCacheRef = useRef<Map<string, ScrapeResult>>(new Map());
  const previousUrlRef = useRef<string>(config.url);

  const isAr = lang === 'ar';

  // Absolute Session Isolation: Reset previous memory when target input changes
  useEffect(() => {
    const currentTrimmed = config.url.trim();
    const previousTrimmed = previousUrlRef.current.trim();

    if (currentTrimmed && previousTrimmed && currentTrimmed !== previousTrimmed) {
      // 1. Create fresh isolated session ID
      const newSessionId = globalApexScraperService.sessionManager.createSession(currentTrimmed, currentTrimmed);
      setActiveSessionId(newSessionId);

      // 2. Clear displayed results to guarantee zero data cross-contamination
      setCurrentResult(null);
      setErrorMessage(null);
      setScrapeLogs([]);

      // 3. Clear tenant memory for previous target
      globalApexScraperService.multiTenantStore.purgeTenant(previousTrimmed);

      // 4. Set clear notification for user
      setSessionNotice(
        isAr 
          ? `تم بدء جلسة مستقلة ومعزولة (#${newSessionId.substring(0, 8)}) للهدف: ${currentTrimmed}. تم تصفير الذاكرة السابقة لمنع أي تداخل بيانات.` 
          : `Started new isolated session (#${newSessionId.substring(0, 8)}) for: ${currentTrimmed}. Previous memory cleared to prevent cross-contamination.`
      );

      previousUrlRef.current = currentTrimmed;
    }
  }, [config.url, isAr]);

  // Safely sanitize a result for local storage without exceeding browser storage quota
  const sanitizeForStorage = (res: ScrapeResult): ScrapeResult => {
    return {
      ...res,
      // Store compact representation of up to 250 emails in localStorage
      emails: (res.emails || []).slice(0, 250).map(e => ({
        ...e,
        contextText: (e.contextText || '').slice(0, 80),
        snippet: (e.snippet || '').slice(0, 120)
      })),
      products: (res.products || []).slice(0, 50),
      tables: (res.tables || []).slice(0, 3).map(t => ({
        ...t,
        rows: (t.rows || []).slice(0, 25)
      })),
      articles: (res.articles || []).slice(0, 15),
      media: (res.media || []).slice(0, 15),
      logs: (res.logs || []).slice(-15),
      customData: (res.customData || []).slice(0, 15)
    };
  };

  // Safe localStorage saver that handles quota limits gracefully
  const persistHistorySafely = (items: ScrapeResult[]) => {
    try {
      const sanitized = items.slice(0, 10).map(sanitizeForStorage);
      localStorage.setItem('ultra_scraper_history', JSON.stringify(sanitized));
    } catch (err: any) {
      // If quota exceeded, try with fewer items
      try {
        const minimal = items.slice(0, 3).map(sanitizeForStorage);
        localStorage.setItem('ultra_scraper_history', JSON.stringify(minimal));
      } catch {
        try {
          // If still exceeded, store metadata only
          const metaOnly = items.slice(0, 3).map(item => ({
            ...sanitizeForStorage(item),
            emails: [],
            products: [],
            tables: [],
            articles: [],
            media: []
          }));
          localStorage.setItem('ultra_scraper_history', JSON.stringify(metaOnly));
        } catch (finalErr) {
          console.warn('LocalStorage quota reached, skipping history persistence:', finalErr);
        }
      }
    }
  };

  // Load presets and history on start
  useEffect(() => {
    fetch('/api/presets')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPresets(data);
        }
      })
      .catch(err => console.error('Failed to load presets:', err));

    // Load history from localStorage safely
    try {
      const saved = localStorage.getItem('ultra_scraper_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setHistory(parsed);
          // Seed full results cache
          parsed.forEach(item => {
            if (item && item.id) {
              fullResultsCacheRef.current.set(item.id, item);
            }
          });
        }
      }
    } catch (e) {
      console.error('Failed to parse history from localStorage:', e);
      try {
        localStorage.removeItem('ultra_scraper_history');
      } catch {}
    }
  }, []);

  // Save history
  const saveToHistory = (res: ScrapeResult) => {
    // Preserve full fidelity in memory
    fullResultsCacheRef.current.set(res.id, res);
    const updated = [res, ...history.filter(h => h.id !== res.id)].slice(0, 20);
    setHistory(updated);
    // Persist quota-safe version to localStorage
    persistHistorySafely(updated);
  };

  const clearHistory = () => {
    fullResultsCacheRef.current.clear();
    setHistory([]);
    try {
      localStorage.removeItem('ultra_scraper_history');
    } catch (e) {
      console.error(e);
    }
  };

  // Run scraper with ApexScraperService (guaranteeing session isolation, non-inferred images, full extraction)
  const handleStartScrape = async () => {
    if (!config.url) return;

    setIsScraping(true);
    setErrorMessage(null);
    setCurrentResult(null);
    setSessionNotice(null);

    const initialLogs: ScrapeLog[] = [
      {
        id: `log-init-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        level: 'info',
        message: isAr ? `🚀 بدء عملية الاستخلاص عبر خدمة ApexScraperService للهدف: ${config.url}` : `Initiating scrape process via ApexScraperService for: ${config.url}`
      },
      {
        id: `log-session-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        level: 'info',
        message: isAr ? `🔒 إنشاء حاوية عزل مستقلة (Isolated Session & Tenant) لضمان عدم تداخل البيانات.` : `Created isolated session & tenant container to guarantee zero data cross-contamination.`
      },
      {
        id: `log-ua-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        level: 'info',
        message: isAr ? `تدوير الـ User-Agent وتخطي أنظمة الحماية واستدعاء كافة الصفحات...` : `Rotating browser signature and fetching all archive pages...`
      }
    ];
    setScrapeLogs(initialLogs);

    try {
      const result = await globalApexScraperService.startScrapingProcess(
        config.url,
        config,
        (progress, page, totalPages, itemsCount) => {
          setScrapeLogs(prev => [
            ...prev,
            {
              id: `log-progress-${Date.now()}`,
              timestamp: new Date().toLocaleTimeString(),
              level: 'info',
              message: isAr 
                ? `📄 تقدم الاستخلاص: صفحة ${page} من ${totalPages} (${itemsCount} عنصر تم جمعها)` 
                : `Scraping progress: page ${page} of ${totalPages} (${itemsCount} items extracted)`
            }
          ]);
        }
      );

      setCurrentResult(result);
      if (result.logs && result.logs.length > 0) {
        setScrapeLogs(result.logs);
      }
      saveToHistory(result);
    } catch (err: any) {
      const displayMsg = err.message || (isAr ? 'حدث خطأ أثناء محاولة الاستخلاص' : 'An error occurred during scraping');
      setErrorMessage(displayMsg);
      setScrapeLogs(prev => [
        ...prev,
        {
          id: `log-err-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          level: 'error',
          message: `${isAr ? 'خطأ في المعالجة:' : 'Execution error:'} ${displayMsg}`
        }
      ]);
    } finally {
      setIsScraping(false);
    }
  };

  return (
    <div 
      dir={isAr ? 'rtl' : 'ltr'} 
      className={`min-h-screen bg-[#0B0F15] text-[#E2E8F0] ${isAr ? 'font-arabic' : 'font-sans'} antialiased selection:bg-[#00D9FF] selection:text-[#0F1419]`}
    >
      {/* 1. Header */}
      <Header
        lang={lang}
        setLang={setLang}
        historyCount={history.length}
        onOpenHistory={() => setIsHistoryOpen(true)}
      />

      {/* 2. Main Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Input Panel */}
        <InputPanel
          config={config}
          setConfig={setConfig}
          onStartScrape={handleStartScrape}
          isScraping={isScraping}
          presets={presets}
          lang={lang}
        />

        {/* Isolated Session Notification Banner */}
        {sessionNotice && (
          <div className="p-3.5 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/40 text-xs text-[#C4B5FD] flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <RefreshCw className="w-4 h-4 text-[#A78BFA] flex-shrink-0" />
              <span>{sessionNotice}</span>
            </div>
            <button 
              onClick={() => setSessionNotice(null)} 
              className="text-[#A78BFA] hover:text-white hover:underline text-[11px] font-bold cursor-pointer px-2 py-0.5"
            >
              {isAr ? 'حسناً' : 'OK'}
            </button>
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/40 text-xs text-[#EF4444] flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button 
              onClick={() => setErrorMessage(null)} 
              className="text-[#EF4444] hover:underline"
            >
              {isAr ? 'إغلاق' : 'Dismiss'}
            </button>
          </div>
        )}

        {/* Live Crawler Logs & Progress */}
        <LiveCrawlerProgress
          isScraping={isScraping}
          logs={scrapeLogs}
          url={config.url}
          lang={lang}
        />

        {/* Input Modified Indicator Banner */}
        {currentResult && !isScraping && config.url.trim() !== currentResult.url.trim() && (
          <div className="p-4 rounded-xl bg-[#00D9FF]/10 border border-[#00D9FF]/30 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-[#00D9FF] flex-shrink-0" />
              <div>
                <span className="font-bold text-white block">
                  {isAr 
                    ? `المدخل الحالي: [${config.url}] يختلف عن نتائج الاستخلاص المعروضة [${currentResult.url}]` 
                    : `Current input: [${config.url}] differs from displayed results [${currentResult.url}]`}
                </span>
                <span className="text-[#94A3B8] text-[11px]">
                  {isAr 
                    ? 'اضغط "بدء الاستخلاص" لاستخراج بيانات البريد أو الرابط الجديد بشكل منفصل وتخزينه في السجل دون أي خلط مع النتائج السابقة.' 
                    : 'Click Start Scraping to extract the new address cleanly without mixing with previous records.'}
                </span>
              </div>
            </div>
            <button
              onClick={handleStartScrape}
              className="px-3.5 py-2 rounded-lg bg-[#00D9FF] hover:bg-[#00D9FF]/90 text-black font-black text-xs transition-colors whitespace-nowrap cursor-pointer shadow-md shadow-[#00D9FF]/20"
            >
              {isAr ? 'بدء استخلاص المدخل الجديد' : 'Scrape New Target Now'}
            </button>
          </div>
        )}

        {/* Results Dashboard if ready */}
        {currentResult && !isScraping ? (
          <ResultsDashboard result={currentResult} lang={lang} />
        ) : !isScraping && (
          /* Welcome Hero / Features Banner when no active result */
          <div className="bg-[#161F2E]/60 border border-[#1E293B] rounded-2xl p-8 text-center space-y-6">
            <div className="max-w-2xl mx-auto space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#1E3A8A] to-[#00D9FF] p-0.5 mx-auto">
                <div className="w-full h-full bg-[#0F1419] rounded-[14px] flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-[#00D9FF]" />
                </div>
              </div>
              
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {isAr ? 'نظام استخلاص البيانات الذكي والاحترافي' : 'Professional Web Scraping & Data Extraction Engine'}
              </h2>
              
              <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
                {isAr 
                  ? 'أدخل أي رابط لصفحة ويب أو متجر إلكتروني (مثل جوميا، أمازون، نون، ويكيبيديا) لاستخراج المنتجات، الجداول، الأسعار، والمقالات بدقة متناهية مع تصدير مباشر إلى Excel و CSV.' 
                  : 'Enter any webpage or e-commerce URL to instantly extract products, prices, dynamic tables, and media with native Excel & CSV export.'}
              </p>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-start pt-4 border-t border-[#1E293B]">
              <div className="p-4 rounded-xl bg-[#0F1419] border border-[#1E293B] space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-[#00D9FF]">
                  <ShoppingBag className="w-4 h-4" />
                  <span>{isAr ? 'متاجر إلكترونية' : 'E-Commerce Scraping'}</span>
                </div>
                <p className="text-[11px] text-[#64748B] leading-normal">
                  {isAr ? 'استخراج الأسعار، نسب الخصومات، التقييمات، ومواصفات المنتجات كاملة.' : 'Extract prices, discount rates, star ratings, and detailed specs.'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#0F1419] border border-[#1E293B] space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-[#10B981]">
                  <TableIcon className="w-4 h-4" />
                  <span>{isAr ? 'جداول وبيانات منظمة' : 'Table Formatter'}</span>
                </div>
                <p className="text-[11px] text-[#64748B] leading-normal">
                  {isAr ? 'تحويل أي جدول معقد إلى مصفوفة قابلة للفرز والفلترة والتصدير إلى Excel.' : 'Parse multi-column tables into sortable Excel & CSV datasets.'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#0F1419] border border-[#1E293B] space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-[#F59E0B]">
                  <Cpu className="w-4 h-4" />
                  <span>{isAr ? 'تحليل ذكي (Gemini)' : 'Gemini AI Intelligence'}</span>
                </div>
                <p className="text-[11px] text-[#64748B] leading-normal">
                  {isAr ? 'اكتشاف الأنماط الدلالية وقياس جودة البيانات وهيكلتها تلقائياً.' : 'Infer semantic schemas, clean duplicate records, and grade data quality.'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#0F1419] border border-[#1E293B] space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-[#EC4899]">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>{isAr ? 'تصدير شامل بجميع الصيغ' : 'Instant Export Hub'}</span>
                </div>
                <p className="text-[11px] text-[#64748B] leading-normal">
                  {isAr ? 'تنزيل بضغطة زر لـ Excel (.xlsx), CSV مع دعم العربي الكامل, JSON, و XML.' : '1-click export to formatted Excel, UTF-8 CSV, JSON, and XML.'}
                </p>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* 3. History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectHistory={(item) => {
          const full = fullResultsCacheRef.current.get(item.id) || item;
          setCurrentResult(full);
          setConfig(prev => ({ ...prev, url: full.url, mode: full.mode }));
        }}
        onClearHistory={clearHistory}
        lang={lang}
      />
    </div>
  );
}
