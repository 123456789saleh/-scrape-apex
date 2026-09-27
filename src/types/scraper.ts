export type ScrapeMode = 
  | 'auto' 
  | 'ecommerce' 
  | 'emails'
  | 'tables' 
  | 'articles' 
  | 'media' 
  | 'custom' 
  | 'ai_semantic';

export type UserAgentPreset = 
  | 'chrome_desktop' 
  | 'safari_mac' 
  | 'firefox_desktop' 
  | 'edge_desktop' 
  | 'iphone_mobile' 
  | 'android_chrome' 
  | 'googlebot' 
  | 'rotate_all';

export interface CustomSelectorRule {
  id: string;
  name: string;
  selector: string;
  type: 'text' | 'attribute' | 'html' | 'array';
  attributeName?: string;
  regexPattern?: string;
  required?: boolean;
}

export type CrawlDepthLevel = 
  | 'level_1_single' 
  | 'level_2_scroll' 
  | 'level_3_deep_product' 
  | 'level_4_full_catalog';

export interface ExtractionFieldsConfig {
  specs: boolean;
  galleryImages: boolean;
  sellerDetails: boolean;
  sellerRating: boolean;
  warranty: boolean;
  bulletPoints: boolean;
  stockAndShipping: boolean;
  description: boolean;
  skuAndBrand: boolean;
  priceHistory: boolean;
}

export interface ScrapeConfig {
  url: string;
  mode: ScrapeMode;
  maxPages: number;
  enableJs: boolean;
  respectRobots: boolean;
  userAgentType: UserAgentPreset;
  customUserAgent?: string;
  proxyUrl?: string;
  timeoutMs: number;
  rateLimitMs: number;
  customSelectors: CustomSelectorRule[];
  customHeaders: Record<string, string>;
  customCookies: Record<string, string>;
  extractImages: boolean;
  aiPrompt?: string;
  enableAiInference: boolean;
  translateToArabic: boolean;
  cleanData: boolean;
  removeDuplicates: boolean;
  webhookUrl?: string;
  paginationSelector?: string;
  // Advanced granular extraction & crawl depth
  crawlDepth?: CrawlDepthLevel;
  preserveScreenOrder?: boolean;
  extractionFields?: ExtractionFieldsConfig;
  maxItemsLimit?: number;
  simulateFullScroll?: boolean;
  extractSubPagesDeep?: boolean;
  // Smart DOM Tracking & Multi-Pass Simulated Scroll
  scrollPasses?: number;
  scrollIntervalMs?: number;
  lazyLoadResolution?: boolean;
  expandDynamicCarousels?: boolean;
  // Multi-Page Catalog Crawler & Deep Pagination
  crawlAllProductPages?: boolean;
  crawlAllStorePages?: boolean;
  maxCatalogPages?: number;
  paginationMode?: 'auto_all_pages' | 'first_n_pages' | 'single_page';
  strictOriginalImages?: boolean;
  // Deep Email & Contact Lead Crawler
  crawlContactPages?: boolean;
  detectObfuscatedEmails?: boolean;
  verifyEmailSyntax?: boolean;
  extractAssociatedNames?: boolean;
  crawlAllEmailPages?: boolean;
  emailPaginationMode?: 'auto_all_pages' | 'single_page' | 'custom_range';
  // Universal Precision & Anti-Mixing System
  targetBrand?: string;
  targetCategory?: string;
  priceMin?: number;
  priceMax?: number;
  strictPrecisionMode?: boolean;
  minIntegrityScore?: number;
  tenantId?: string;
}

export interface ExtractedEmail {
  id: string;
  email: string;
  domain: string;
  name?: string;
  department?: string;
  phone?: string;
  role?: string;
  sourceUrl: string;
  contextText?: string;
  subject?: string;
  date?: string;
  senderName?: string;
  senderEmail?: string;
  recipientEmail?: string;
  direction?: 'inbound' | 'outbound' | 'contact' | 'broadcast' | 'unknown';
  snippet?: string;
  type: 'inbound_message' | 'sender' | 'recipient' | 'mailto' | 'text' | 'obfuscated' | 'jsonld' | 'footer' | 'contact_page' | 'header';
  isValidSyntax: boolean;
  score?: number;
}

export interface ExtractedContact {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  department?: string;
  domain?: string;
  address?: string;
  sourceUrl: string;
}

export interface ExtractedProduct {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  currency: string;
  discountPercentage?: number;
  rating?: number;
  reviewsCount?: number;
  inStock: boolean;
  availabilityText?: string;
  seller?: string;
  sellerDetails?: string;
  brand?: string;
  category?: string;
  sku?: string;
  description?: string;
  bulletPoints?: string[];
  specs: Record<string, string>;
  mainImage: string;
  galleryImages: string[];
  productUrl: string;
  shippingInfo?: string;
  warrantyInfo?: string;
  displayOrder?: number;
  pageNumber?: number;
  isOriginalImage?: boolean;
  integrityScore?: number;
  qualityPassed?: boolean;
  qualityNotes?: string[];
}

export interface ExtractedTable {
  id: string;
  title?: string;
  headers: string[];
  rows: (string | number)[][];
  rowCount: number;
  columnCount: number;
}

export interface ExtractedArticle {
  id: string;
  title: string;
  author?: string;
  publishedDate?: string;
  summary?: string;
  content: string;
  paragraphs: string[];
  wordCount: number;
  readingTimeMinutes: number;
  tags: string[];
  bannerImage?: string;
  sourceUrl: string;
}

export interface ExtractedMedia {
  id: string;
  type: 'image' | 'document' | 'video' | 'audio';
  url: string;
  filename?: string;
  altText?: string;
  dimensions?: string;
  mimeType?: string;
  fileSize?: string;
}

export interface ExtractedLink {
  url: string;
  text: string;
  isInternal: boolean;
  rel?: string;
}

export interface ScrapeLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  details?: any;
}

export interface ScrapeStats {
  durationMs: number;
  pagesScraped: number;
  totalBytes: number;
  totalItemsFound: number;
  requestsMade: number;
  speedItemsPerSec: number;
  status: 'idle' | 'running' | 'completed' | 'failed' | 'paused';
  httpStatus: number;
  userAgentUsed: string;
}

export interface PageMetadata {
  title: string;
  description?: string;
  keywords?: string[];
  favicon?: string;
  ogImage?: string;
  ogType?: string;
  canonicalUrl?: string;
  language?: string;
  jsonLd?: any[];
  emails: string[];
  phoneNumbers: string[];
  targetBrand?: string;
}

export interface ScrapeResult {
  id: string;
  url: string;
  targetDomain: string;
  scrapedAt: string;
  mode: ScrapeMode;
  config: ScrapeConfig;
  stats: ScrapeStats;
  metadata: PageMetadata;
  targetBrand?: string;
  products: ExtractedProduct[];
  emails: ExtractedEmail[];
  contacts?: ExtractedContact[];
  tables: ExtractedTable[];
  articles: ExtractedArticle[];
  media: ExtractedMedia[];
  links: ExtractedLink[];
  customData: Record<string, any>[];
  aiAnalysis?: {
    summary: string;
    identifiedEntities: { category: string; value: string; confidence: number }[];
    dataQualityScore: number;
    schemaInference: Record<string, string>;
    insightsArabic?: string;
    translatedContent?: any;
  };
  logs: ScrapeLog[];
  rawHtmlSample?: string;
  unreadEmailsCount?: number;
  totalMailboxCount?: number;
  detectedTotalMessages?: number;
  detectedTotalPages?: number;
  totalPagesScraped?: number;
  primaryAccountEmail?: string;
  precisionReport?: {
    sessionId: string;
    totalExtracted: number;
    duplicatesRemoved: number;
    failedQA: number;
    finalValidCount: number;
    confidenceScore: number;
    activeFilters: {
      domain?: string;
      category?: string;
      brand?: string;
      priceRange?: string;
    };
  };
  contentTypeDetection?: ContentTypeDetectionReport;
}

export type DetectedPageType = 'products' | 'ecommerce_store' | 'webmail' | 'brand' | 'category' | 'search' | 'contact' | 'single_product' | 'content';

export interface ContentTypeDetectionReport {
  detectedType: DetectedPageType;
  detectedTypeLabel: string;
  detectedTypeLabelAr: string;
  confidenceScore: number;
  confidenceLevel: 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW' | 'VERY_LOW';
  userSelectedMode: string;
  isMismatch: boolean;
  mismatchAlert?: string;
  mismatchAlertAr?: string;
  matchedRule?: string;
  suggestedAction?: 'extract_brand' | 'extract_products' | 'extract_contact' | 'filter_search' | 'switch_mode' | 'proceed';
  scores: {
    urlScore: number;
    metadataScore: number;
    contentScore: number;
    structureScore: number;
  };
  indicators: {
    found: string[];
    missing: string[];
  };
  pageSummary?: {
    productCount?: number;
    emailCount?: number;
    brandElementsFound?: boolean;
    hasPriceElements?: boolean;
    searchElementsFound?: boolean;
  };
}

export interface PresetSite {
  id: string;
  name: string;
  nameAr: string;
  category: 'ecommerce' | 'tables' | 'news' | 'finance' | 'tech' | 'leads' | 'contacts';
  url: string;
  mode: ScrapeMode;
  description: string;
  descriptionAr: string;
  selectors?: Partial<CustomSelectorRule>[];
  icon: string;
}

export interface ScheduledTask {
  id: string;
  name: string;
  url: string;
  cronExpr: string;
  mode: ScrapeMode;
  config: Partial<ScrapeConfig>;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
  status: 'active' | 'paused' | 'error';
  runsCount: number;
}
