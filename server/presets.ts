import { PresetSite } from '../src/types/scraper.ts';

export const PRESET_SITES: PresetSite[] = [
  {
    id: 'outlook-cloud-demo',
    name: 'Microsoft Outlook 365 (Cloud Mailbox Archive)',
    nameAr: 'مايكروسوفت أوتلوك 365 (صندوق الرسائل السحابي)',
    category: 'leads',
    url: 'https://outlook.cloud.microsoft/mail/',
    mode: 'emails',
    description: 'Scrape Microsoft 365 cloud inbox, security alerts, Teams updates, and partner messages.',
    descriptionAr: 'استخلاص شامل لصندوق بريد مايكروسوفت أوتلوك وتنبيهات الأمان وتحديثات Teams والمراسلات الشريكة.',
    icon: 'Mail'
  },
  {
    id: 'gmail-inbox-demo',
    name: 'Google Workspace & Gmail (Webmail Archive)',
    nameAr: 'جوجل وورك سبيس وجيميل (أرشيف صندوق الوارد)',
    category: 'leads',
    url: 'https://mail.google.com/mail/u/0/#inbox',
    mode: 'emails',
    description: 'Deep archive extraction of inbox communications, senders, dates, and subjects.',
    descriptionAr: 'استخلاص فوري لصندوق الوارد ورسائل الأمان والتقويم والمستندات المشتركة.',
    icon: 'Mail'
  },
  {
    id: 'cairosales-deals',
    name: 'Cairo Sales Egypt - TVs & Appliances Deals',
    nameAr: 'كايرو سيلز مصر - عروض الشاشات والأجهزة',
    category: 'ecommerce',
    url: 'https://cairosales.com/ar/',
    mode: 'ecommerce',
    description: 'Scrape all TV deals, Samsung OLED, LG QNED, discounts, free shipping badges, and full specs.',
    descriptionAr: 'سحب كافة عروض الشاشات وأجهزة سامسونج وإل جي والخصومات وشارات التوصيل المجاني والمواصفات الكاملة.',
    icon: 'Tv'
  },
  {
    id: 'jumia-egypt-deals',
    name: 'Jumia Egypt - Top Deals & Phones',
    nameAr: 'جوميا مصر - أفضل العروض والهواتف',
    category: 'ecommerce',
    url: 'https://www.jumia.com.eg/flash-sales/',
    mode: 'ecommerce',
    description: 'Scrape discounts, stock status, ratings, and gallery images from Jumia flash sales.',
    descriptionAr: 'استخراج الخصومات وحالة المخزون والتقييمات وصور المنتجات من عروض جوميا.',
    icon: 'ShoppingBag'
  },
  {
    id: 'amazon-electronics',
    name: 'Amazon Best Sellers Electronics',
    nameAr: 'أمازون - المنتجات الأكثر مبيعاً للإلكترونيات',
    category: 'ecommerce',
    url: 'https://www.amazon.com/Best-Sellers-Electronics/zgbs/electronics',
    mode: 'ecommerce',
    description: 'Extract product titles, Prime badges, ratings, current & original prices, and ASINs.',
    descriptionAr: 'سحب عناوين المنتجات وشارات التوصيل والتقييمات والأسعار ورموز ASIN.',
    icon: 'Package'
  },
  {
    id: 'noon-mobiles',
    name: 'Noon Store - Smart Devices',
    nameAr: 'متجر نون - الأجهزة الذكية',
    category: 'ecommerce',
    url: 'https://www.noon.com/egypt-en/electronics-and-mobiles/mobiles-and-accessories/',
    mode: 'ecommerce',
    description: 'Parse smartphone specs, express shipping tags, discount percentages, and installments.',
    descriptionAr: 'تحليل مواصفات الهواتف وشحن إكسبريس ونسب الخصم والتقسيط.',
    icon: 'Smartphone'
  },
  {
    id: 'ebay-deals',
    name: 'eBay Global Deals & Auctions',
    nameAr: 'إيباي - العروض العالمية والمزادات',
    category: 'ecommerce',
    url: 'https://www.ebay.com/deals',
    mode: 'ecommerce',
    description: 'Scrape global marketplace items, seller feedback score, and shipping rates.',
    descriptionAr: 'استخراج سلع السوق العالمي وتقييمات البائع وأسعار الشحن.',
    icon: 'Tag'
  },
  {
    id: 'wikipedia-tables',
    name: 'Wikipedia - World Countries by GDP',
    nameAr: 'ويكيبيديا - جدول الناتج المحلي الإجمالي لدول العالم',
    category: 'tables',
    url: 'https://en.wikipedia.org/wiki/List_of_countries_by_GDP_(nominal)',
    mode: 'tables',
    description: 'Extract multi-level tables, country rankings, nominal GDP figures, and IMF estimates.',
    descriptionAr: 'استخراج الجداول المعقدة وترتيب الدول وأرقام الناتج المحلي وتقديرات صندوق النقد.',
    icon: 'Table'
  },
  {
    id: 'techcrunch-news',
    name: 'TechCrunch - AI & Startup Feed',
    nameAr: 'تيك كرانش - أخبار الذكاء الاصطناعي والشركات الناشئة',
    category: 'news',
    url: 'https://techcrunch.com/category/artificial-intelligence/',
    mode: 'articles',
    description: 'Extract articles, author names, publication timestamps, tags, and paragraph bodies.',
    descriptionAr: 'استخراج المقالات الإخبارية وأسماء الكتاب وتاريخ النشر والوسوم والمحتوى.',
    icon: 'Newspaper'
  },
  {
    id: 'yahoo-finance',
    name: 'Yahoo Finance - Active Market Movers',
    nameAr: 'ياهو فاينانس - أكثر الأسهم نشاطاً في السوق',
    category: 'finance',
    url: 'https://finance.yahoo.com/most-active',
    mode: 'tables',
    description: 'Scrape real-time stock ticker tables, price changes, market cap, and volume.',
    descriptionAr: 'سحب جداول أسعار الأسهم اللحظية والتغير السعري والقيمة السوقية وحجم التداول.',
    icon: 'TrendingUp'
  }
];
