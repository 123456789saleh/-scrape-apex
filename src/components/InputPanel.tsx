import React, { useState } from 'react';
import { 
  Search, 
  Sparkles, 
  ShoppingBag, 
  Table, 
  Newspaper, 
  Image as ImageIcon, 
  Cpu, 
  Settings2, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Trash2, 
  Sliders, 
  Globe2, 
  Zap, 
  CheckCircle2, 
  Play, 
  RotateCw,
  FileCode,
  Layers,
  CheckSquare,
  Square,
  SlidersHorizontal,
  Compass,
  ListChecks,
  Camera,
  Store,
  Shield,
  ShieldCheck,
  Tag,
  Truck,
  FileText,
  Star,
  Infinity as InfinityIcon,
  Filter,
  Check,
  Mail,
  Send,
  Building2,
  AlertTriangle
} from 'lucide-react';
import { 
  ScrapeConfig, 
  ScrapeMode, 
  UserAgentPreset, 
  CustomSelectorRule, 
  PresetSite,
  CrawlDepthLevel,
  ExtractionFieldsConfig
} from '../types/scraper.ts';

interface InputPanelProps {
  config: ScrapeConfig;
  setConfig: React.Dispatch<React.SetStateAction<ScrapeConfig>>;
  onStartScrape: () => void;
  isScraping: boolean;
  presets: PresetSite[];
  lang: 'ar' | 'en';
}

export const InputPanel: React.FC<InputPanelProps> = ({
  config,
  setConfig,
  onStartScrape,
  isScraping,
  presets,
  lang
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [newSelector, setNewSelector] = useState<Partial<CustomSelectorRule>>({
    name: '',
    selector: '',
    type: 'text'
  });

  const isAr = lang === 'ar';

  const modes: { id: ScrapeMode; labelAr: string; labelEn: string; icon: any; descAr: string; descEn: string }[] = [
    { id: 'auto', labelAr: 'اكتشاف تلقائي', labelEn: 'Auto Detect', icon: Zap, descAr: 'كشف ذكي للمحتوى وهيكلته آلياً', descEn: 'Smart content structure discovery' },
    { id: 'emails', labelAr: 'سحب الإيميلات والاتصال', labelEn: 'Emails & Leads', icon: Mail, descAr: 'استخراج البريد الإلكتروني وجهات الاتصال باللينك', descEn: 'Extract emails, contacts & leads from URL' },
    { id: 'ecommerce', labelAr: 'متاجر إلكترونية', labelEn: 'E-Commerce', icon: ShoppingBag, descAr: 'أسعار، خصومات، صور، وتقييمات', descEn: 'Prices, discounts, ratings & specs' },
    { id: 'tables', labelAr: 'جداول وبيانات', labelEn: 'Data Tables', icon: Table, descAr: 'تحويل الجداول إلى مصفوفات منسقة', descEn: 'Parse complex multi-column tables' },
    { id: 'articles', labelAr: 'مقالات ونصوص', labelEn: 'Articles & News', icon: Newspaper, descAr: 'نصوص كاملة، كتاب، ووسوم', descEn: 'Full text, authors, dates & tags' },
    { id: 'media', labelAr: 'وسائط وملفات', labelEn: 'Media & Files', icon: ImageIcon, descAr: 'استخراج الصور والملفات القابلة للتحميل', descEn: 'Extract images, PDFs & assets' },
    { id: 'ai_semantic', labelAr: 'استخلاص ذكي (AI)', labelEn: 'AI Extraction', icon: Cpu, descAr: 'تحليل دلالي متقدم بنموذج Gemini', descEn: 'Semantic parsing via Gemini model' },
    { id: 'custom', labelAr: 'محددات مخصصة', labelEn: 'Custom Rules', icon: FileCode, descAr: 'تطبيق CSS Selectors و XPath', descEn: 'Custom CSS Selectors & XPath' },
  ];

  const crawlDepthLevels: {
    id: CrawlDepthLevel;
    titleAr: string;
    titleEn: string;
    descAr: string;
    descEn: string;
    badgeAr: string;
    badgeEn: string;
    icon: any;
  }[] = [
    {
      id: 'level_1_single',
      titleAr: 'المستوى 1: فحص الصفحة الحالية المباشرة',
      titleEn: 'Level 1: Single Page Fast Scan',
      descAr: 'سحب العناصر المرئية فوراً في الصفحة الأولى بسرعة فائقة',
      descEn: 'Instant extraction of visible items on first page',
      badgeAr: 'سريع جداً (1x)',
      badgeEn: 'Ultra Fast',
      icon: Zap
    },
    {
      id: 'level_2_scroll',
      titleAr: 'المستوى 2: التمرير الكامل والتحميل التفاعلي',
      titleEn: 'Level 2: Full Scroll & Dynamic Lazy-Load',
      descAr: 'محاكاة التمرير التلقائي لأسفل الصفحة وتفعيل كافة السلايدرز والأقسام الديناميكية',
      descEn: 'Simulate scrolling down to trigger carousels & lazy-loaded grids',
      badgeAr: 'موصى به للمتاجر',
      badgeEn: 'Recommended',
      icon: Layers
    },
    {
      id: 'level_3_deep_product',
      titleAr: 'المستوى 3: استكشاف متعمق لصفحات المنتجات الفرعية',
      titleEn: 'Level 3: Deep Product Pages Inspection',
      descAr: 'زيارة كل رابط منتج تلقائياً واستخلاص المواصفات، الوصف، الضمان، وصور المعرض الكاملة',
      descEn: 'Crawl each product link to extract all DOM specs, warranty & gallery',
      badgeAr: 'بيانات فرعية تفصيلية 100%',
      badgeEn: 'Deep Sub-data 100%',
      icon: Compass
    },
    {
      id: 'level_4_full_catalog',
      titleAr: 'المستوى 4: فهرسة الكتالوج الشامل وترقيم الصفحات',
      titleEn: 'Level 4: Full Catalog & Auto-Pagination',
      descAr: 'تتبع أزرار التالي (Pagination) وسحب كافة المنتجات الموجودة بدون أي اقتطاع',
      descEn: 'Follow pagination links & capture full store catalog without truncation',
      badgeAr: 'شامل وغير محدود ♾️',
      badgeEn: 'All Catalog ♾️',
      icon: InfinityIcon
    }
  ];

  const subElementsList: {
    key: keyof ExtractionFieldsConfig;
    labelAr: string;
    labelEn: string;
    descAr: string;
    descEn: string;
    icon: any;
  }[] = [
    {
      key: 'specs',
      labelAr: 'المواصفات الفنية والتقنية (Specs)',
      labelEn: 'Technical Specs & Attributes',
      descAr: 'المقاس، الدقة، المعالج، الأبعاد، واستهلاك الطاقة',
      descEn: 'Size, resolution, processor, dimensions, wattage',
      icon: Settings2
    },
    {
      key: 'galleryImages',
      labelAr: 'صور المعرض المتعددة (Gallery Images)',
      labelEn: 'Full Multi-Image Gallery',
      descAr: 'كافة زوايا المنتج وصور الـ High-Res عالية الدقة',
      descEn: 'All product view angles & high-resolution assets',
      icon: Camera
    },
    {
      key: 'sellerDetails',
      labelAr: 'بيانات وتفاصيل البائع (Seller Info)',
      labelEn: 'Seller & Store Details',
      descAr: 'اسم المتجر، تفاصيل الوكيل، وسياسة البيع المعتمدة',
      descEn: 'Store name, verified dealer & after-sales info',
      icon: Store
    },
    {
      key: 'sellerRating',
      labelAr: 'تقييم المتجر وعدد المراجعات (Ratings & Reviews)',
      labelEn: 'Ratings & Reviews Count',
      descAr: 'التقييم من 5 نجوم وعدد المراجعات الحقيقية',
      descEn: 'Star ratings & total verified customer reviews',
      icon: Star
    },
    {
      key: 'warranty',
      labelAr: 'معلومات الضمان والصيانة (Warranty Info)',
      labelEn: 'Warranty & Guarantee Details',
      descAr: 'مدة الضمان المحلي، الوكيل المعتمد، وخدمة الصيانة',
      descEn: 'Authorized agent warranty period & coverage terms',
      icon: Shield
    },
    {
      key: 'bulletPoints',
      labelAr: 'أبرز المزايا والنقاط الرئيسية (Bullet Points)',
      labelEn: 'Key Features & Bullet Points',
      descAr: 'قائمة الخصائص والمزايا التسويقية للمنتج',
      descEn: 'Key product highlights and feature lists',
      icon: ListChecks
    },
    {
      key: 'stockAndShipping',
      labelAr: 'المخزون والشحن السريع (Stock & Shipping)',
      labelEn: 'Stock & Shipping Availability',
      descAr: 'حالة التوفر، مدة التوصيل، ورسوم الشحن المجاني',
      descEn: 'Stock status, delivery ETA & free shipping flags',
      icon: Truck
    },
    {
      key: 'description',
      labelAr: 'الوصف الكامل للمنتج (Full Description)',
      labelEn: 'Full Product Description',
      descAr: 'النص التعريفي والتفاصيل الشاملة من صفحة المنتج',
      descEn: 'Detailed multi-paragraph description body',
      icon: FileText
    },
    {
      key: 'skuAndBrand',
      labelAr: 'كود الـ SKU والعلامة التجارية (Brand & SKU)',
      labelEn: 'Brand & SKU Model Identifier',
      descAr: 'رقم الموديل، كود SKU، والشركة المصنعة',
      descEn: 'Product model number, SKU code & manufacturer',
      icon: Tag
    },
    {
      key: 'priceHistory',
      labelAr: 'تحليل الخصم والتوفير (Discount & Savings)',
      labelEn: 'Discount & Savings Calculation',
      descAr: 'السعر الأصلي، نسبة الخصم، ومقدار التوفير الفعلي',
      descEn: 'Original price, discount % & net savings value',
      icon: ShoppingBag
    }
  ];

  const currentExtractionFields: ExtractionFieldsConfig = config.extractionFields || {
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
  };

  const handleToggleSubElement = (key: keyof ExtractionFieldsConfig) => {
    setConfig(prev => ({
      ...prev,
      extractionFields: {
        ...(prev.extractionFields || currentExtractionFields),
        [key]: !((prev.extractionFields || currentExtractionFields)[key])
      }
    }));
  };

  const handleSelectAllSubElements = (selectAll: boolean) => {
    setConfig(prev => ({
      ...prev,
      extractionFields: {
        specs: selectAll,
        galleryImages: selectAll,
        sellerDetails: selectAll,
        sellerRating: selectAll,
        warranty: selectAll,
        bulletPoints: selectAll,
        stockAndShipping: selectAll,
        description: selectAll,
        skuAndBrand: selectAll,
        priceHistory: selectAll
      }
    }));
  };

  const preflightDetection = React.useMemo(() => {
    const url = config.url?.trim();
    if (!url || url.length < 8) return null;
    const lower = url.toLowerCase();

    // 1. Webmail or Direct Mail Link Detection
    const isWebmail = 
      lower.includes('mail.google.com') ||
      lower.includes('outlook.') ||
      lower.includes('roundcube') ||
      lower.includes('webmail.') ||
      lower.includes('/webmail') ||
      lower.includes('/inbox') ||
      lower.includes('#inbox') ||
      lower.includes('mail.yahoo.com') ||
      lower.includes('mail.ru') ||
      lower.includes('zoho.com/mail') ||
      lower.includes('proton.me') ||
      lower.includes('icloud.com/mail') ||
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(url);

    if (isWebmail) {
      return {
        type: 'webmail' as const,
        labelEn: 'Webmail / Mail Link',
        labelAr: 'ميل لينك / صندوق بريد إلكتروني',
        score: 99,
        isMismatch: config.mode === 'ecommerce',
        suggestedMode: 'emails' as const,
        mismatchDescAr: '⚠️ الرابط المدخل يمثل ميل لينك / صندوق بريد إلكتروني (Webmail Portal) وليس متجراً إلكترونياً. يُنصح بتحويل النمط إلى استخلاص البريد الإلكتروني وصندوق الرسائل.',
        mismatchDescEn: '⚠️ The entered URL is a Webmail / Inbox portal, not an e-commerce store. It is recommended to switch to Emails extraction mode.',
        suggestedAction: 'switch_to_emails'
      };
    }

    // 2. E-Commerce Store or Catalog Page Detection
    const isEcommerceStore =
      lower.includes('cairosales.com') ||
      lower.includes('jumia.com') ||
      lower.includes('amazon.') ||
      lower.includes('noon.com') ||
      lower.includes('btech.com') ||
      lower.includes('rayashop.com') ||
      lower.includes('elarabygroup.com') ||
      lower.includes('2b.com.eg') ||
      lower.includes('carrefour') ||
      lower.includes('/product') ||
      lower.includes('/shop') ||
      lower.includes('/store') ||
      lower.includes('/تسوق') ||
      lower.includes('/category') ||
      lower.includes('/categories') ||
      lower.includes('/manufacturer') ||
      lower.includes('/brand');

    if (isEcommerceStore) {
      const isMismatch = config.mode === 'emails';
      let brand = '';
      const mMatch = lower.match(/(?:manufacturer|brand|brands)[\/=]([a-z0-9_-]+)/i);
      if (mMatch) {
        brand = mMatch[1].replace(/\.html?$/, '').replace(/[-_]/g, '');
      }

      return {
        type: 'ecommerce_store' as const,
        labelEn: 'E-Commerce Online Store',
        labelAr: 'متجر تسوق إلكتروني',
        suggestedBrand: brand.toUpperCase() || undefined,
        score: 95,
        isMismatch,
        suggestedMode: 'ecommerce' as const,
        mismatchDescAr: '⚠️ تنبيه التفريق التام بين ميل لينك وصفحات المتاجر: هذا الرابط متجر إلكتروني للتسوق (E-Commerce Store) وليس صفحة بريد إلكتروني (Mail Link). سيقوم المحرك بحجب سحب إيميلات التذييل والدعم لمنع تلوث البيانات، وتوجيه الاستخراج 100% نحو كتالوج المنتجات والأسعار والمواصفات.',
        mismatchDescEn: '⚠️ Target Discrimination: This URL is an E-Commerce Store, not a Mail Link. The engine will block scraping footer/support emails and direct 100% of extraction towards product catalogs and prices.',
        suggestedAction: 'switch_to_ecommerce'
      };
    }

    if (lower.includes('/search') || lower.includes('?q=') || lower.includes('&q=')) {
      return {
        type: 'search' as const,
        labelEn: 'Search Results Page',
        labelAr: 'صفحة نتائج بحث',
        score: 92,
        isMismatch: config.mode !== 'ecommerce',
        suggestedMode: 'ecommerce' as const,
        mismatchDescAr: 'صفحة نتائج بحث ديناميكية، موصى باستخدام وضع التجارة الإلكترونية.',
        mismatchDescEn: 'Dynamic search page, e-commerce mode recommended.',
        suggestedAction: 'filter_search'
      };
    }
    if (lower.includes('/contact') || lower.includes('contact-us') || lower.includes('contact_us') || lower.includes('/اتصل-بنا')) {
      return {
        type: 'contact' as const,
        labelEn: 'Contact / Info Page',
        labelAr: 'صفحة اتصال وتواصل',
        score: 96,
        isMismatch: config.mode === 'ecommerce',
        suggestedMode: 'emails' as const,
        mismatchDescAr: 'صفحة اتصال مخصصة لبيانات التواصل والإيميلات.',
        mismatchDescEn: 'Contact page dedicated to contact info and emails.',
        suggestedAction: 'extract_contact'
      };
    }
    return {
      type: 'products' as const,
      labelEn: 'Web Target',
      labelAr: 'صفحة ويب عادية',
      score: 75,
      isMismatch: false,
      suggestedAction: 'proceed'
    };
  }, [config.url, config.mode]);

  const handlePresetSelect = (preset: PresetSite) => {
    setConfig(prev => ({
      ...prev,
      url: preset.url,
      mode: preset.mode,
      customSelectors: preset.selectors ? preset.selectors.map((s, idx) => ({
        id: `preset-${idx}`,
        name: s.name || `Field_${idx}`,
        selector: s.selector || '',
        type: s.type || 'text',
        attributeName: s.attributeName,
        regexPattern: s.regexPattern
      })) : prev.customSelectors
    }));
  };

  const handleAddSelector = () => {
    if (!newSelector.name || !newSelector.selector) return;
    const rule: CustomSelectorRule = {
      id: `rule-${Date.now()}`,
      name: newSelector.name.trim(),
      selector: newSelector.selector.trim(),
      type: newSelector.type || 'text',
      attributeName: newSelector.attributeName,
      regexPattern: newSelector.regexPattern
    };
    setConfig(prev => ({
      ...prev,
      customSelectors: [...prev.customSelectors, rule]
    }));
    setNewSelector({ name: '', selector: '', type: 'text' });
  };

  const handleRemoveSelector = (id: string) => {
    setConfig(prev => ({
      ...prev,
      customSelectors: prev.customSelectors.filter(s => s.id !== id)
    }));
  };

  const activeDepth = config.crawlDepth || 'level_3_deep_product';
  const activeFieldsCount = Object.values(currentExtractionFields).filter(Boolean).length;

  return (
    <div className="bg-[#161F2E] border border-[#1E293B] rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
      {/* Decorative gradient glow top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00D9FF] to-transparent opacity-80" />

      {/* Main URL Input Bar */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-white">
              <Globe2 className="w-4 h-4 text-[#00D9FF]" />
              {isAr ? 'رابط الموقع المستهدف أو عنوان البريد الإلكتروني (سحب شامل لكافة البيانات)' : 'Target Website URL, Webmail Link, or Email Address (Full Extraction)'}
            </span>
            <span className="text-[11px] text-[#00D9FF] font-mono">
              {isAr ? 'يدعم المتاجر، المواقع، وبوابات البريد (4,000+ رسالة وعنصر)' : 'Supports E-Commerce, Portals & Inboxes (4,000+ Items)'}
            </span>
          </label>

          <div className="relative flex flex-col sm:flex-row items-stretch gap-2.5">
            <div className="relative flex-1">
              <input
                id="scraper-url-input"
                type="text"
                dir="ltr"
                value={config.url}
                onChange={(e) => setConfig(prev => ({ ...prev, url: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && onStartScrape()}
                placeholder={isAr ? "https://outlook.cloud.microsoft/mail/ أو user@example.com أو https://cairosales.com/ar/" : "https://outlook.cloud.microsoft/mail/ or user@domain.com or https://example.com"}
                className="w-full bg-[#0F1419] border border-[#1E293B] focus:border-[#00D9FF] focus:ring-2 focus:ring-[#00D9FF]/20 rounded-xl px-4 py-3.5 pl-11 text-sm font-mono text-white placeholder-[#64748B] outline-none transition-all"
              />
              <Search className="w-5 h-5 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              {config.url && (
                <button
                  onClick={() => setConfig(prev => ({ ...prev, url: '' }))}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#64748B] hover:text-white px-1.5 py-0.5 rounded bg-[#1E293B]"
                >
                  Clear
                </button>
              )}
            </div>

            <button
              id="start-scrape-btn"
              onClick={onStartScrape}
              disabled={isScraping || !config.url}
              className={`px-7 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-lg cursor-pointer ${
                isScraping || !config.url
                  ? 'bg-[#1E293B] text-[#64748B] cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#00D9FF] to-[#0284C7] text-[#0F1419] hover:brightness-110 shadow-cyan-500/20 active:scale-[0.98]'
              }`}
            >
              {isScraping ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin text-[#0F1419]" />
                  <span>{isAr ? 'جاري الاستخلاص الشامل...' : 'Scraping Full Catalog...'}</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>{isAr ? 'ابدأ الاستخلاص الشامل الآن' : 'Start Full Extraction'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Pre-flight Universal Content Type Detection & Mismatch Alert */}
        {preflightDetection && config.url && (
          <div className={`p-3 rounded-xl border text-xs transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5 ${
            preflightDetection.isMismatch
              ? 'bg-[#F59E0B]/10 border-[#F59E0B]/40 text-[#F59E0B]'
              : 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]'
          }`}>
            <div className="flex items-start md:items-center gap-2.5">
              {preflightDetection.isMismatch ? (
                <AlertTriangle className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5 md:mt-0" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5 md:mt-0" />
              )}
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-white">
                    {isAr ? 'التعرف الذكي على نوع الصفحة:' : 'Smart Content Type Detected:'}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-[#0F1419] border border-current font-bold">
                    {isAr ? preflightDetection.labelAr : preflightDetection.labelEn}
                  </span>
                  <span className="text-[11px] opacity-80 font-mono">
                    ({preflightDetection.score}% {isAr ? 'دقة وتوافق' : 'confidence'})
                  </span>
                </div>
                {preflightDetection.isMismatch && (
                  <p className="text-[11px] text-[#E2E8F0] mt-1 font-sans leading-relaxed">
                    {isAr
                      ? (preflightDetection.mismatchDescAr || '⚠️ تنبيه عدم تطابق نوع الصفحة: تم تفعيل الاستخراج التكيفي لمنع سحب رسائل البريد كمنتجات والحفاظ على نقاء البيانات.')
                      : (preflightDetection.mismatchDescEn || '⚠️ Page Type Mismatch: Adaptive guards are activated to prevent extracting emails as products.')}
                  </p>
                )}
              </div>
            </div>

            {preflightDetection.isMismatch && preflightDetection.suggestedMode && (
              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                <button
                  type="button"
                  onClick={() => {
                    setConfig(prev => ({
                      ...prev,
                      mode: preflightDetection.suggestedMode || prev.mode,
                      targetBrand: preflightDetection.suggestedBrand || prev.targetBrand
                    }));
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#00D9FF] text-[#0F1419] font-bold text-xs hover:bg-[#00D9FF]/90 transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5" />
                  {isAr 
                    ? (preflightDetection.suggestedMode === 'ecommerce' ? 'تحويل النمط إلى منتجات المتجر 🛒' : 'تحويل النمط إلى صندوق البريد 📧')
                    : (preflightDetection.suggestedMode === 'ecommerce' ? 'Switch to E-Commerce Store' : 'Switch to Mail Link Mode')}
                </button>
              </div>
            )}

            {'suggestedBrand' in preflightDetection && preflightDetection.suggestedBrand && (
              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                <button
                  type="button"
                  onClick={() => {
                    const brand = 'suggestedBrand' in preflightDetection ? preflightDetection.suggestedBrand : undefined;
                    setConfig(prev => ({
                      ...prev,
                      targetBrand: brand || prev.targetBrand,
                      strictPrecisionMode: true
                    }));
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#F59E0B] text-[#0F1419] font-bold text-xs hover:bg-[#F59E0B]/90 transition-all cursor-pointer shadow-sm"
                >
                  {isAr ? `تثبيت ${preflightDetection.suggestedBrand} كعلامة مستهدفة` : `Lock ${preflightDetection.suggestedBrand}`}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Quick Presets Bar */}
        <div>
          <div className="flex items-center justify-between text-xs text-[#94A3B8] mb-2">
            <span className="flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
              {isAr ? 'مواقع جاهزة للاختبار الفوري الكامل:' : 'Ready-to-scrape Sample Presets:'}
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {presets.map(preset => {
              const isSelected = config.url === preset.url;
              return (
                <button
                  key={preset.id}
                  onClick={() => handlePresetSelect(preset)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border cursor-pointer ${
                    isSelected
                      ? 'bg-[#00D9FF]/15 border-[#00D9FF] text-[#00D9FF]'
                      : 'bg-[#0F1419] border-[#1E293B] text-[#94A3B8] hover:border-[#64748B] hover:text-white'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00D9FF]"></span>
                  <span>{isAr ? preset.nameAr : preset.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scraping Modes Pills */}
        <div className="pt-2 border-t border-[#1E293B]">
          <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-2.5">
            {isAr ? 'تحديد نمط الاستخلاص المستهدف:' : 'Extraction Mode:'}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {modes.map(mode => {
              const Icon = mode.icon;
              const isSelected = config.mode === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => setConfig(prev => ({ ...prev, mode: mode.id }))}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-b from-[#1E3A8A]/50 to-[#0F1419] border-[#00D9FF] text-white shadow-md shadow-cyan-500/10'
                      : 'bg-[#0F1419] border-[#1E293B] text-[#94A3B8] hover:border-[#334155] hover:text-[#E2E8F0]'
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-1.5 ${isSelected ? 'text-[#00D9FF]' : 'text-[#64748B]'}`} />
                  <span className="text-xs font-bold leading-tight">{isAr ? mode.labelAr : mode.labelEn}</span>
                </button>
              );
            })}
          </div>

          {/* Email Extraction Specific Options (When Emails Mode is Selected) */}
          {config.mode === 'emails' && (
            <div className="mt-3 p-3.5 rounded-xl bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#8B5CF6]">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>{isAr ? 'خيارات الزحف واستخلاص الإيميلات وصندوق الرسائل المتعددة:' : 'Email & Inbox Multi-Page Extraction Options:'}</span>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded bg-[#8B5CF6]/20 text-[#A78BFA] border border-[#8B5CF6]/30">
                  {isAr ? 'يدعم تتبع الصفحات والـ Scroll لأكثر من 4000 رسالة' : 'Supports pagination & 4000+ messages'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
                <label className="flex items-center gap-2 text-xs text-[#E2E8F0] cursor-pointer bg-[#0F1419]/60 p-2 rounded-lg border border-[#8B5CF6]/20 hover:border-[#8B5CF6]/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={config.crawlAllEmailPages !== false}
                    onChange={(e) => setConfig(prev => ({ ...prev, crawlAllEmailPages: e.target.checked }))}
                    className="accent-[#8B5CF6] rounded"
                  />
                  <span className="font-medium">{isAr ? 'تتبع كل صفحات البريد (صفحة 1، 2..)' : 'Crawl All Pages (Pagination)'}</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-[#E2E8F0] cursor-pointer bg-[#0F1419]/60 p-2 rounded-lg border border-[#8B5CF6]/20 hover:border-[#8B5CF6]/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={config.crawlContactPages !== false}
                    onChange={(e) => setConfig(prev => ({ ...prev, crawlContactPages: e.target.checked }))}
                    className="accent-[#8B5CF6] rounded"
                  />
                  <span>{isAr ? 'زحف صفحات اتصل بنا (/contact)' : 'Crawl Contact Subpages'}</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-[#E2E8F0] cursor-pointer bg-[#0F1419]/60 p-2 rounded-lg border border-[#8B5CF6]/20 hover:border-[#8B5CF6]/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={config.detectObfuscatedEmails !== false}
                    onChange={(e) => setConfig(prev => ({ ...prev, detectObfuscatedEmails: e.target.checked }))}
                    className="accent-[#8B5CF6] rounded"
                  />
                  <span>{isAr ? 'فك تشفير الإيميلات المشفرة' : 'Decode Obfuscated Emails'}</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-[#E2E8F0] cursor-pointer bg-[#0F1419]/60 p-2 rounded-lg border border-[#8B5CF6]/20 hover:border-[#8B5CF6]/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={config.verifyEmailSyntax !== false}
                    onChange={(e) => setConfig(prev => ({ ...prev, verifyEmailSyntax: e.target.checked }))}
                    className="accent-[#8B5CF6] rounded"
                  />
                  <span>{isAr ? 'التحقق المعياري (RFC 5322)' : 'RFC Syntax Verification'}</span>
                </label>
              </div>
            </div>
          )}

          {/* E-Commerce Specific Multi-Page & Scroll Options (When Ecommerce Mode is Selected) */}
          {(config.mode === 'ecommerce' || config.mode === 'auto') && (
            <div className="mt-3 p-3.5 rounded-xl bg-[#00D9FF]/10 border border-[#00D9FF]/30 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#00D9FF]">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  <span>{isAr ? 'خيارات سحب جميع منتجات المتاجر الإلكترونية والصفحات المتعاقبة:' : 'E-Commerce All Pages & Infinite Scroll Extraction:'}</span>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded bg-[#00D9FF]/20 text-[#00D9FF] border border-[#00D9FF]/30 font-mono font-bold">
                  {isAr ? 'سحب صفحة 1..2..N + قاع الصفحة (Scroll)' : 'Pages 1..2..N + Scroll'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
                <label className="flex items-center gap-2 text-xs text-[#E2E8F0] cursor-pointer bg-[#0F1419]/60 p-2 rounded-lg border border-[#00D9FF]/20 hover:border-[#00D9FF]/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={config.crawlAllStorePages !== false && config.crawlAllProductPages !== false}
                    onChange={(e) => setConfig(prev => ({ 
                      ...prev, 
                      crawlAllStorePages: e.target.checked,
                      crawlAllProductPages: e.target.checked 
                    }))}
                    className="accent-[#00D9FF] rounded"
                  />
                  <span className="font-medium">{isAr ? 'سحب كل صفحات المتجر (صفحة 1..2 إلى آخر صفحة)' : 'Crawl All Pages (1..2 to Last)'}</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-[#E2E8F0] cursor-pointer bg-[#0F1419]/60 p-2 rounded-lg border border-[#00D9FF]/20 hover:border-[#00D9FF]/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={config.simulateFullScroll ?? true}
                    onChange={(e) => setConfig(prev => ({ ...prev, simulateFullScroll: e.target.checked }))}
                    className="accent-[#00D9FF] rounded"
                  />
                  <span>{isAr ? 'سحب المنتجات بأسفل الصفحات (Scroll / Lazy Load)' : 'Capture Scroll & Lazy Loaded Products'}</span>
                </label>
                <div className="flex items-center gap-2 text-xs text-[#E2E8F0] bg-[#0F1419]/60 p-2 rounded-lg border border-[#00D9FF]/20">
                  <span className="text-[#94A3B8]">{isAr ? 'أقصى عدد صفحات:' : 'Max Pages:'}</span>
                  <select
                    value={config.maxPages || 25}
                    onChange={(e) => setConfig(prev => ({ ...prev, maxPages: parseInt(e.target.value, 10), maxCatalogPages: parseInt(e.target.value, 10) }))}
                    className="bg-[#161F2E] border border-[#334155] rounded px-2 py-0.5 text-xs text-[#00D9FF] font-bold focus:outline-none cursor-pointer"
                  >
                    <option value={5}>5 {isAr ? 'صفحات' : 'pages'}</option>
                    <option value={10}>10 {isAr ? 'صفحات' : 'pages'}</option>
                    <option value={25}>25 {isAr ? 'صفحة (افتراضي)' : 'pages (Default)'}</option>
                    <option value={50}>50 {isAr ? 'صفحة' : 'pages'}</option>
                    <option value={100}>100 {isAr ? 'صفحة (شامل)' : 'pages (All)'}</option>
                  </select>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-[#94A3B8] bg-[#0F1419]/60 p-2 rounded-lg border border-[#00D9FF]/20">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] flex-shrink-0" />
                  <span>{isAr ? 'تفريغ الـ noscript والـ template تلقائياً' : 'Auto unrolls noscript & template'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Fast Toggles Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
          {/* JS Rendering */}
          <label className="flex items-center gap-2 p-2.5 rounded-lg bg-[#0F1419] border border-[#1E293B] cursor-pointer hover:border-[#334155] transition-colors">
            <input
              type="checkbox"
              checked={config.enableJs}
              onChange={(e) => setConfig(prev => ({ ...prev, enableJs: e.target.checked }))}
              className="rounded bg-[#1E293B] border-[#334155] text-[#00D9FF] focus:ring-0"
            />
            <span className="text-xs text-[#E2E8F0] font-medium">{isAr ? 'محاكاة JS التفاعلية' : 'Dynamic JS Engine'}</span>
          </label>

          {/* AI Schema Discovery */}
          <label className="flex items-center gap-2 p-2.5 rounded-lg bg-[#0F1419] border border-[#1E293B] cursor-pointer hover:border-[#334155] transition-colors">
            <input
              type="checkbox"
              checked={config.enableAiInference}
              onChange={(e) => setConfig(prev => ({ ...prev, enableAiInference: e.target.checked }))}
              className="rounded bg-[#1E293B] border-[#334155] text-[#00D9FF] focus:ring-0"
            />
            <span className="text-xs text-[#E2E8F0] font-medium">{isAr ? 'تحليل ذكي (Gemini)' : 'Gemini AI Analysis'}</span>
          </label>

          {/* Translate to Arabic */}
          <label className="flex items-center gap-2 p-2.5 rounded-lg bg-[#0F1419] border border-[#1E293B] cursor-pointer hover:border-[#334155] transition-colors">
            <input
              type="checkbox"
              checked={config.translateToArabic}
              onChange={(e) => setConfig(prev => ({ ...prev, translateToArabic: e.target.checked }))}
              className="rounded bg-[#1E293B] border-[#334155] text-[#00D9FF] focus:ring-0"
            />
            <span className="text-xs text-[#E2E8F0] font-medium">{isAr ? 'ترجمة آلية للعربية' : 'Translate to Arabic'}</span>
          </label>

          {/* Extract Media */}
          <label className="flex items-center gap-2 p-2.5 rounded-lg bg-[#0F1419] border border-[#1E293B] cursor-pointer hover:border-[#334155] transition-colors">
            <input
              type="checkbox"
              checked={config.extractImages}
              onChange={(e) => setConfig(prev => ({ ...prev, extractImages: e.target.checked }))}
              className="rounded bg-[#1E293B] border-[#334155] text-[#00D9FF] focus:ring-0"
            />
            <span className="text-xs text-[#E2E8F0] font-medium">{isAr ? 'سحب الصور الأصلية' : 'Extract Media Assets'}</span>
          </label>

          {/* Full Scroll simulation */}
          <label className="flex items-center gap-2 p-2.5 rounded-lg bg-[#0F1419] border border-[#1E293B] cursor-pointer hover:border-[#334155] transition-colors">
            <input
              type="checkbox"
              checked={config.simulateFullScroll ?? true}
              onChange={(e) => setConfig(prev => ({ ...prev, simulateFullScroll: e.target.checked }))}
              className="rounded bg-[#1E293B] border-[#334155] text-[#00D9FF] focus:ring-0"
            />
            <span className="text-xs text-[#E2E8F0] font-medium">{isAr ? 'تمرير كامل للصفحة' : 'Full Page Scroll'}</span>
          </label>

          {/* Deep Sub-pages Extraction */}
          <label className="flex items-center gap-2 p-2.5 rounded-lg bg-[#0F1419] border border-[#1E293B] cursor-pointer hover:border-[#334155] transition-colors">
            <input
              type="checkbox"
              checked={config.extractSubPagesDeep ?? true}
              onChange={(e) => setConfig(prev => ({ ...prev, extractSubPagesDeep: e.target.checked }))}
              className="rounded bg-[#1E293B] border-[#334155] text-[#00D9FF] focus:ring-0"
            />
            <span className="text-xs text-[#E2E8F0] font-medium">{isAr ? 'استخلاص الروابط الفرعية' : 'Deep Sub-pages'}</span>
          </label>
        </div>

        {/* Configuration Panel Toggle */}
        <div className="pt-2">
          <button
            id="toggle-advanced-drawer"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gradient-to-r from-[#0F1419] via-[#161F2E] to-[#0F1419] border border-[#00D9FF]/40 text-xs font-bold text-white hover:border-[#00D9FF] hover:shadow-lg hover:shadow-cyan-500/10 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Sliders className="w-4 h-4 text-[#00D9FF]" />
              <span className="text-sm font-bold text-[#00D9FF]">
                {isAr ? 'لوحة الإعدادات المتقدمة (تخصيص العناصر الفرعية، عمق التصفح، والحد الأقصى)' : 'Advanced Configuration Panel (Sub-elements, Crawl Depth & Limits)'}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#00D9FF]/20 text-[#00D9FF] border border-[#00D9FF]/30">
                {activeFieldsCount}/10 {isAr ? 'عنصر نشط' : 'fields'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#94A3B8] hidden sm:inline">
                {showAdvanced ? (isAr ? 'إخفاء الإعدادات' : 'Collapse') : (isAr ? 'تخصيص متقدم' : 'Expand Settings')}
              </span>
              {showAdvanced ? <ChevronUp className="w-4 h-4 text-[#00D9FF]" /> : <ChevronDown className="w-4 h-4 text-[#00D9FF]" />}
            </div>
          </button>
        </div>

        {/* Expandable Advanced Configuration Panel */}
        {showAdvanced && (
          <div className="p-5 rounded-xl bg-[#0F1419] border border-[#1E293B] space-y-6 animate-in fade-in duration-200">
            
            {/* SECTION 1: CRAWL DEPTH LEVEL SELECTOR */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-bold text-white flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[#00D9FF]" />
                  <span>{isAr ? '1. تحديد مستوى عمق التصفح والاستكشاف لكل رابط (Crawl Depth):' : '1. Crawl & Extraction Depth Level:'}</span>
                </label>
                <span className="text-[11px] text-[#00D9FF] font-medium">
                  {isAr ? 'يحدد آلية تتبع الصفحات والروابط الفرعية' : 'Controls deep page traversal strategy'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {crawlDepthLevels.map(lvl => {
                  const Icon = lvl.icon;
                  const isSelected = activeDepth === lvl.id;
                  return (
                    <div
                      key={lvl.id}
                      onClick={() => setConfig(prev => ({ ...prev, crawlDepth: lvl.id }))}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                        isSelected
                          ? 'bg-gradient-to-b from-[#1E3A8A]/40 to-[#161F2E] border-[#00D9FF] ring-1 ring-[#00D9FF]/40 text-white shadow-lg shadow-cyan-500/10'
                          : 'bg-[#161F2E] border-[#1E293B] text-[#94A3B8] hover:border-[#334155] hover:text-[#E2E8F0]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-[#00D9FF]/20 text-[#00D9FF]' : 'bg-[#0F1419] text-[#64748B]'}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isSelected ? 'bg-[#00D9FF] text-[#0F1419]' : 'bg-[#0F1419] text-[#94A3B8]'
                          }`}>
                            {isAr ? lvl.badgeAr : lvl.badgeEn}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-white mb-1">{isAr ? lvl.titleAr : lvl.titleEn}</h4>
                        <p className="text-[11px] text-[#94A3B8] leading-relaxed">{isAr ? lvl.descAr : lvl.descEn}</p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-[#1E293B] flex items-center gap-1.5 text-[10px]">
                        <Check className={`w-3 h-3 ${isSelected ? 'text-[#00D9FF]' : 'text-transparent'}`} />
                        <span className={isSelected ? 'text-[#00D9FF] font-bold' : 'text-[#64748B]'}>
                          {isSelected ? (isAr ? 'المستوى المختار' : 'Active Level') : (isAr ? 'انقر للتحديد' : 'Click to select')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SECTION 2: GRANULAR SUB-ELEMENTS SELECTOR */}
            <div className="pt-4 border-t border-[#1E293B]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div>
                  <label className="text-xs font-bold text-white flex items-center gap-2">
                    <ListChecks className="w-4 h-4 text-[#10B981]" />
                    <span>{isAr ? '2. تخصيص استخراج العناصر والبيانات الفرعية بدقة (Sub-Elements Selector):' : '2. Granular Sub-Elements Selector:'}</span>
                  </label>
                  <p className="text-[11px] text-[#94A3B8] mt-0.5">
                    {isAr ? 'حدد العناصر المطلوب استخراجها من صفحات وروابط المنتجات لتضمينها في الجداول وملفات التصدير' : 'Toggle specific sub-attributes to be extracted and structured in final datasets'}
                  </p>
                </div>
                
                {/* Quick select buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectAllSubElements(true)}
                    className="px-2.5 py-1 rounded bg-[#161F2E] hover:bg-[#1E293B] border border-[#1E293B] text-[11px] font-medium text-[#00D9FF] cursor-pointer"
                  >
                    {isAr ? 'تحديد الكل' : 'Select All'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectAllSubElements(false)}
                    className="px-2.5 py-1 rounded bg-[#161F2E] hover:bg-[#1E293B] border border-[#1E293B] text-[11px] font-medium text-[#94A3B8] hover:text-white cursor-pointer"
                  >
                    {isAr ? 'إلغاء التحديد' : 'Clear All'}
                  </button>
                </div>
              </div>

              {/* Sub-elements Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {subElementsList.map(elem => {
                  const Icon = elem.icon;
                  const isChecked = Boolean(currentExtractionFields[elem.key]);
                  return (
                    <label
                      key={elem.key}
                      className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-[#161F2E] border-[#00D9FF]/40 text-white'
                          : 'bg-[#0F1419] border-[#1E293B] text-[#64748B] hover:border-[#334155]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleSubElement(elem.key)}
                        className="mt-0.5 rounded bg-[#0F1419] border-[#334155] text-[#00D9FF] focus:ring-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Icon className={`w-3.5 h-3.5 ${isChecked ? 'text-[#00D9FF]' : 'text-[#64748B]'}`} />
                          <span className={`text-xs font-bold ${isChecked ? 'text-white' : 'text-[#94A3B8]'}`}>
                            {isAr ? elem.labelAr : elem.labelEn}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#94A3B8] mt-0.5 leading-tight">
                          {isAr ? elem.descAr : elem.descEn}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* SECTION 3: SMART DOM TRACKING & MULTI-PASS SIMULATED SCROLL */}
            <div className="pt-4 border-t border-[#1E293B]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div>
                  <label className="text-xs font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#00D9FF]" />
                    <span>{isAr ? '3. استراتيجية محاكاة التمرير الذكي (Smart Simulated Scroll & Lazy Load):' : '3. Smart Multi-Pass Simulated Scroll & Lazy Loading:'}</span>
                  </label>
                  <p className="text-[11px] text-[#94A3B8] mt-0.5">
                    {isAr ? 'إرسال أوامر محاكاة التمرير لأسفل الصفحة عدة مرات وتنشيط الـ IntersectionObserver لجمع كافة المنتجات دون فقدان أي عنصر' : 'Executes multi-step simulated scroll commands and DOM triggers to capture every product across lazy-loaded sections'}
                  </p>
                </div>
                <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30 font-bold self-start sm:self-auto">
                  {isAr ? '✓ مفعل تلقائياً لكافة الأقسام' : '✓ Full DOM Coverage Active'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                {[
                  { passes: 3, labelAr: '3 دورات تمرير', labelEn: '3 Scroll Passes', descAr: 'تمرير سريع للأقسام البسيطة', descEn: 'Fast scroll for standard pages' },
                  { passes: 5, labelAr: '5 دورات تمرير (موصى به)', labelEn: '5 Passes (Recommended)', descAr: 'تغطية كاملة للسلايدرز والأقسام الرئيسية', descEn: 'Complete coverage of carousels & grids' },
                  { passes: 8, labelAr: '8 دورات عميقة', labelEn: '8 Deep Passes', descAr: 'سحب صفحات الـ Infinite Scroll الطويلة', descEn: 'Deep capture for long infinite scroll' },
                  { passes: 12, labelAr: '12 دورة شاملة ♾️', labelEn: '12 Full Passes ♾️', descAr: 'استخراج فائق لجميع المنتجات بدون استثناء', descEn: 'Maximum discovery for mega catalogs' },
                ].map(opt => {
                  const isSel = (config.scrollPasses ?? 5) === opt.passes;
                  return (
                    <button
                      key={opt.passes}
                      type="button"
                      onClick={() => setConfig(prev => ({ ...prev, scrollPasses: opt.passes }))}
                      className={`p-3 rounded-xl border text-right sm:text-center transition-all cursor-pointer ${
                        isSel
                          ? 'bg-[#00D9FF]/15 border-[#00D9FF] text-white shadow-md shadow-cyan-500/10'
                          : 'bg-[#161F2E] border-[#1E293B] text-[#94A3B8] hover:border-[#334155] hover:text-white'
                      }`}
                    >
                      <div className="text-xs font-bold text-[#E2E8F0] mb-0.5">{isAr ? opt.labelAr : opt.labelEn}</div>
                      <div className="text-[10px] text-[#64748B]">{isAr ? opt.descAr : opt.descEn}</div>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic DOM Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[#161F2E] border border-[#00D9FF]/40 cursor-pointer hover:border-[#00D9FF] transition-colors sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={config.preserveScreenOrder ?? true}
                    onChange={(e) => setConfig(prev => ({ ...prev, preserveScreenOrder: e.target.checked }))}
                    className="rounded bg-[#0F1419] border-[#334155] text-[#00D9FF] focus:ring-0"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#E2E8F0] font-bold">{isAr ? '📐 سحب العناصر بترتيب الظهور الفعلي على الشاشة (Screen Visual Order)' : 'Scrape Products in Exact Screen Appearance Order'}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#00D9FF]/20 text-[#00D9FF] border border-[#00D9FF]/30">{isAr ? 'مُفعّل افتراضياً' : 'Active by Default'}</span>
                    </div>
                    <div className="text-[10px] text-[#94A3B8]">{isAr ? 'استخراج بطاقات المنتجات وفقاً لتسلسل تدفق الصفحة من أعلى لأسفل ومن الأول للأخير مع حفظ رقم الترتيب (#1، #2، #3...)' : 'Preserve 1-to-N visual DOM flow order on the scraped page with dedicated sequence tags'}</div>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[#161F2E] border border-[#1E293B] cursor-pointer hover:border-[#334155] transition-colors">
                  <input
                    type="checkbox"
                    checked={config.lazyLoadResolution ?? true}
                    onChange={(e) => setConfig(prev => ({ ...prev, lazyLoadResolution: e.target.checked }))}
                    className="rounded bg-[#0F1419] border-[#334155] text-[#00D9FF] focus:ring-0"
                  />
                  <div>
                    <div className="text-xs text-[#E2E8F0] font-bold">{isAr ? 'تفكيك وحل روابط الصور الكسولة (Lazy Images)' : 'Resolve Lazy Image Attributes'}</div>
                    <div className="text-[10px] text-[#94A3B8]">{isAr ? 'تحويل data-src و data-original إلى روابط صور أصلية' : 'Extract high-res src from data-src & data-original'}</div>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[#161F2E] border border-[#1E293B] cursor-pointer hover:border-[#334155] transition-colors">
                  <input
                    type="checkbox"
                    checked={config.expandDynamicCarousels ?? true}
                    onChange={(e) => setConfig(prev => ({ ...prev, expandDynamicCarousels: e.target.checked }))}
                    className="rounded bg-[#0F1419] border-[#334155] text-[#00D9FF] focus:ring-0"
                  />
                  <div>
                    <div className="text-xs text-[#E2E8F0] font-bold">{isAr ? 'فتح وتفريغ كافة السلايدرز والتبويبات المخفية' : 'Expand Hidden Tabs & Carousels'}</div>
                    <div className="text-[10px] text-[#94A3B8]">{isAr ? 'سحب المنتجات من تبويبات .tab-pane و .owl-item و .slick' : 'Extract items from inactive carousel slides & tabs'}</div>
                  </div>
                </label>
              </div>
            </div>

            {/* SECTION 4: MAX PRODUCTS LIMIT & INFINITE SCRAPING */}
            <div className="pt-4 border-t border-[#1E293B]">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-white flex items-center gap-2">
                  <InfinityIcon className="w-4 h-4 text-[#F59E0B]" />
                  <span>{isAr ? '4. الحد الأقصى للعناصر وسحب كامل محتويات الصفحة (Items Limit):' : '4. Items Extraction Limit & Full Coverage:'}</span>
                </label>
                <span className="text-xs font-bold text-[#00D9FF]">
                  {!config.maxItemsLimit || config.maxItemsLimit === 0 
                    ? (isAr ? '♾️ سحب كامل الصفحة بدون أي اقتطاع' : '♾️ All Page Products (No Limit)')
                    : `${config.maxItemsLimit} ${isAr ? 'منتج كحد أقصى' : 'items max'}`
                  }
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {[
                  { value: 0, labelAr: '♾️ سحب كافة المنتجات بالكامل (بدون حد)', labelEn: '♾️ Complete Page (No Limit)' },
                  { value: 50, labelAr: '50 منتج', labelEn: '50 Items' },
                  { value: 100, labelAr: '100 منتج', labelEn: '100 Items' },
                  { value: 200, labelAr: '200 منتج', labelEn: '200 Items' },
                  { value: 500, labelAr: '500+ منتج شامل', labelEn: '500+ Items' },
                ].map(opt => {
                  const isSel = (config.maxItemsLimit ?? 0) === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setConfig(prev => ({ ...prev, maxItemsLimit: opt.value }))}
                      className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                        isSel
                          ? 'bg-[#00D9FF] text-[#0F1419] border-[#00D9FF] shadow-md shadow-cyan-500/20'
                          : 'bg-[#161F2E] border-[#1E293B] text-[#94A3B8] hover:border-[#334155] hover:text-white'
                      }`}
                    >
                      {isAr ? opt.labelAr : opt.labelEn}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SECTION 5: APEX UNIVERSAL PRECISION & ANTI-DATA-MIXING SHIELD */}
            <div className="pt-4 border-t border-[#1E293B]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <label className="text-xs font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#00D9FF]" />
                  <span>{isAr ? '5. درع الدقة الفائقة ومنع خلط البيانات (Universal Precision & Anti-Mixing):' : '5. Universal Precision & Anti-Mixing Guardrails:'}</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#10B981]/20 text-[#10B981] font-bold border border-[#10B981]/30">
                    {isAr ? '6 طبقات عزل + 5 حراس جودة' : '6 Isolation Layers + 5 Guardrails'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Target Category */}
                <div>
                  <label className="block text-[11px] font-medium text-[#94A3B8] mb-1">
                    {isAr ? 'تحديد فئة دقيقة محددة (Category Filter)' : 'Category Filter'}
                  </label>
                  <input
                    type="text"
                    placeholder={isAr ? 'مثال: غسالات أطباق أو Dishwashers' : 'e.g. Dishwashers'}
                    value={config.targetCategory || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, targetCategory: e.target.value }))}
                    className="w-full bg-[#161F2E] border border-[#1E293B] rounded-lg px-3 py-2 text-xs text-white placeholder-[#64748B] outline-none focus:border-[#00D9FF]"
                  />
                </div>

                {/* Target Brand */}
                <div>
                  <label className="block text-[11px] font-medium text-[#94A3B8] mb-1">
                    {isAr ? 'العلامة التجارية المعتمدة (Brand Lock)' : 'Brand Lock'}
                  </label>
                  <input
                    type="text"
                    placeholder={isAr ? 'مثال: LG أو Samsung' : 'e.g. LG or Samsung'}
                    value={config.targetBrand || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, targetBrand: e.target.value }))}
                    className="w-full bg-[#161F2E] border border-[#1E293B] rounded-lg px-3 py-2 text-xs text-white placeholder-[#64748B] outline-none focus:border-[#00D9FF]"
                  />
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-[11px] font-medium text-[#94A3B8] mb-1">
                    {isAr ? 'نطاق السعر (الحد الأدنى - الأقصى)' : 'Price Range (Min - Max)'}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder={isAr ? 'الحد الأدنى' : 'Min'}
                      value={config.priceMin ?? ''}
                      onChange={(e) => setConfig(prev => ({ ...prev, priceMin: e.target.value ? Number(e.target.value) : undefined }))}
                      className="w-1/2 bg-[#161F2E] border border-[#1E293B] rounded-lg px-2.5 py-2 text-xs text-white placeholder-[#64748B] outline-none focus:border-[#00D9FF]"
                    />
                    <span className="text-[#64748B]">-</span>
                    <input
                      type="number"
                      placeholder={isAr ? 'الحد الأقصى' : 'Max'}
                      value={config.priceMax ?? ''}
                      onChange={(e) => setConfig(prev => ({ ...prev, priceMax: e.target.value ? Number(e.target.value) : undefined }))}
                      className="w-1/2 bg-[#161F2E] border border-[#1E293B] rounded-lg px-2.5 py-2 text-xs text-white placeholder-[#64748B] outline-none focus:border-[#00D9FF]"
                    />
                  </div>
                </div>
              </div>

              {/* Strict Mode Toggle */}
              <div className="mt-3">
                <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[#161F2E] border border-[#10B981]/40 cursor-pointer hover:border-[#10B981] transition-colors">
                  <input
                    type="checkbox"
                    checked={config.strictPrecisionMode ?? true}
                    onChange={(e) => setConfig(prev => ({ ...prev, strictPrecisionMode: e.target.checked }))}
                    className="rounded bg-[#0F1419] border-[#334155] text-[#10B981] focus:ring-0"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#E2E8F0] font-bold">
                        {isAr ? '🛡️ تفعيل الحظر الصارم لخلط البيانات وحذف التكرارات بنسبة 100%' : 'Strict Zero-Data-Mixing & Deduplication Enforcement'}
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30">
                        {isAr ? '0% خلط بيانات' : '0% Mixing'}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#94A3B8]">
                      {isAr ? 'استبعاد أي أصناف تابعة لفئات أخرى أو شركات منافسة ومطابقة الأسعار والصور بدقة متناهية' : 'Rejects competitor brands, cross-category contamination, and duplicate items'}
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* SECTION 5: USER AGENT, PROXY & TIMEOUT */}
            <div className="pt-4 border-t border-[#1E293B] grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
                  {isAr ? 'سياسة الـ User-Agent وتخطي الحجب' : 'User-Agent Policy'}
                </label>
                <select
                  value={config.userAgentType}
                  onChange={(e) => setConfig(prev => ({ ...prev, userAgentType: e.target.value as UserAgentPreset }))}
                  className="w-full bg-[#161F2E] border border-[#1E293B] rounded-lg px-3 py-2 text-xs text-[#E2E8F0] outline-none focus:border-[#00D9FF]"
                >
                  <option value="rotate_all">{isAr ? '🔄 تدوير عشوائي ذكي عبر كل المتصفحات' : '🔄 Intelligent Rotation (All Pool)'}</option>
                  <option value="chrome_desktop">Google Chrome (Desktop Windows/Mac)</option>
                  <option value="safari_mac">Apple Safari (macOS)</option>
                  <option value="firefox_desktop">Mozilla Firefox</option>
                  <option value="edge_desktop">Microsoft Edge</option>
                  <option value="iphone_mobile">iPhone Mobile Safari</option>
                  <option value="android_chrome">Samsung/Android Mobile</option>
                  <option value="googlebot">Googlebot Crawler</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
                  {isAr ? 'بروكسي مخصص (اختياري)' : 'Custom Proxy (Optional)'}
                </label>
                <input
                  type="text"
                  placeholder="http://user:pass@proxy.example.com:8080"
                  value={config.proxyUrl || ''}
                  onChange={(e) => setConfig(prev => ({ ...prev, proxyUrl: e.target.value }))}
                  className="w-full bg-[#161F2E] border border-[#1E293B] rounded-lg px-3 py-2 text-xs text-[#E2E8F0] font-mono outline-none focus:border-[#00D9FF]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1.5 flex justify-between">
                  <span>{isAr ? 'عدد الصفحات المستهدفة للتنقل' : 'Pagination Pages Count'}</span>
                  <span className="text-[#00D9FF] font-bold">{config.maxPages || 1} صفحة</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={config.maxPages || 1}
                  onChange={(e) => setConfig(prev => ({ ...prev, maxPages: parseInt(e.target.value) }))}
                  className="w-full accent-[#00D9FF]"
                />
              </div>
            </div>

            {/* SECTION 5: AI CUSTOM PROMPT INSTRUCTION */}
            <div className="pt-2 border-t border-[#1E293B]">
              <label className="block text-xs font-medium text-[#94A3B8] mb-1.5 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-[#00D9FF]" />
                <span>{isAr ? 'توجيهات نموذج الذكاء الاصطناعي لاستخراج حقول مخصصة (Gemini Prompt):' : 'Custom AI Schema Instruction (Gemini Prompt):'}</span>
              </label>
              <input
                type="text"
                placeholder={isAr ? "مثال: استخرج تفاصيل المقاس والضمان والخصومات وقارنها مع متوسط السوق" : "e.g. Extract detailed technical specs, warranty agent, and discount margin"}
                value={config.aiPrompt || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, aiPrompt: e.target.value }))}
                className="w-full bg-[#161F2E] border border-[#1E293B] rounded-lg px-3 py-2 text-xs text-[#E2E8F0] outline-none focus:border-[#00D9FF]"
              />
            </div>

            {/* SECTION 6: CUSTOM CSS/XPATH SELECTORS BUILDER */}
            <div className="pt-2 border-t border-[#1E293B]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#E2E8F0] flex items-center gap-1.5">
                  <FileCode className="w-4 h-4 text-[#10B981]" />
                  {isAr ? 'بناء محددات CSS / XPath مخصصة (Custom Selectors):' : 'Custom Selectors Builder:'}
                </span>
                <span className="text-[11px] text-[#64748B]">
                  {config.customSelectors.length} {isAr ? 'محدد مضاف' : 'rules active'}
                </span>
              </div>

              {/* Selector List */}
              {config.customSelectors.length > 0 && (
                <div className="space-y-2 mb-3">
                  {config.customSelectors.map((rule) => (
                    <div key={rule.id} className="flex items-center justify-between p-2.5 rounded-lg bg-[#161F2E] border border-[#1E293B] text-xs">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-[#00D9FF]">{rule.name}</span>
                        <span className="font-mono text-[#94A3B8] bg-[#0F1419] px-2 py-0.5 rounded">{rule.selector}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1E293B] text-[#E2E8F0]">{rule.type}</span>
                        {rule.attributeName && <span className="text-[10px] text-[#F59E0B]">attr: {rule.attributeName}</span>}
                      </div>
                      <button
                        onClick={() => handleRemoveSelector(rule.id)}
                        className="text-[#EF4444] hover:bg-[#EF4444]/20 p-1 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Selector Input Form */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <input
                  type="text"
                  placeholder={isAr ? "اسم الحقل (مثال: ProductPrice)" : "Field Name"}
                  value={newSelector.name}
                  onChange={(e) => setNewSelector(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-[#161F2E] border border-[#1E293B] rounded-lg px-3 py-1.5 text-xs text-[#E2E8F0] outline-none focus:border-[#00D9FF]"
                />
                <input
                  type="text"
                  placeholder="CSS Selector (e.g. .price-value)"
                  value={newSelector.selector}
                  onChange={(e) => setNewSelector(prev => ({ ...prev, selector: e.target.value }))}
                  className="bg-[#161F2E] border border-[#1E293B] rounded-lg px-3 py-1.5 text-xs font-mono text-[#E2E8F0] outline-none focus:border-[#00D9FF]"
                />
                <select
                  value={newSelector.type}
                  onChange={(e) => setNewSelector(prev => ({ ...prev, type: e.target.value as any }))}
                  className="bg-[#161F2E] border border-[#1E293B] rounded-lg px-3 py-1.5 text-xs text-[#E2E8F0] outline-none"
                >
                  <option value="text">{isAr ? 'نص مباشر (Text)' : 'Direct Text'}</option>
                  <option value="attribute">{isAr ? 'قيمة خاصية (Attribute)' : 'Element Attribute'}</option>
                  <option value="array">{isAr ? 'مصفوفة عناصر (Array/List)' : 'Array List'}</option>
                  <option value="html">{isAr ? 'كود HTML كامل' : 'Raw HTML'}</option>
                </select>
                <button
                  type="button"
                  onClick={handleAddSelector}
                  className="flex items-center justify-center gap-1.5 bg-[#1E3A8A] hover:bg-[#1E3A8A]/80 text-[#00D9FF] border border-[#00D9FF]/30 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAr ? 'إضافة المحدد' : 'Add Selector'}</span>
                </button>
              </div>
            </div>

            {/* SECTION 7: WEBHOOK INTEGRATION */}
            <div className="pt-2 border-t border-[#1E293B]">
              <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
                {isAr ? 'Webhook URL (إرسال البيانات فور الانتهاء تلقائياً إلى خادمك أو Slack / Zapier)' : 'Webhook Endpoint (Auto-dispatch payload on scrape completion)'}
              </label>
              <input
                type="url"
                placeholder="https://api.yourdomain.com/webhooks/scraper-results"
                value={config.webhookUrl || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, webhookUrl: e.target.value }))}
                className="w-full bg-[#161F2E] border border-[#1E293B] rounded-lg px-3 py-2 text-xs font-mono text-[#E2E8F0] outline-none focus:border-[#00D9FF]"
              />
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
