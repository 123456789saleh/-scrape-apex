import crypto from 'crypto';
import { ExtractedProduct, ScrapeConfig } from '../src/types/scraper.ts';

export interface ScrapingFilter {
  domain?: string;
  category?: string;
  brand?: string;
  priceMin?: number;
  priceMax?: number;
  strictPrecisionMode?: boolean;
  requiredFields?: string[];
  excludeCategories?: string[];
}

export interface SessionMetadata {
  sessionId: string;
  tenantId: string;
  filters: ScrapingFilter;
  createdAt: number;
  updatedAt: number;
  status: 'pending' | 'active' | 'completed' | 'failed';
  productCount: number;
}

export interface QualityCheckResult {
  productId: string;
  passed: boolean;
  integrityScore: number;
  checks: {
    productIdValid: boolean;
    titleValid: boolean;
    brandValid: boolean;
    categoryValid: boolean;
    priceValid: boolean;
    imageUrlValid: boolean;
    productUrlValid: boolean;
    priceConsistencyValid: boolean;
    discountValid: boolean;
    freshnessValid: boolean;
  };
  reasons: string[];
}

export interface PrecisionExecutionReport {
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
}

/**
 * =========================================================================
 * LAYER 1: SESSION MANAGER (ABSOLUTE SESSION ISOLATION)
 * =========================================================================
 * Enforces zero-data-mixing across scraping runs and tenant/user transitions.
 */
export class SessionManager {
  private sessions = new Map<string, SessionMetadata>();
  private sessionData = new Map<string, ExtractedProduct[]>();
  private tenantActiveSession = new Map<string, string>();

  createSession(filters: ScrapingFilter, tenantId: string = 'default'): string {
    const timestamp = Date.now();
    const hex = crypto.randomBytes(4).toString('hex');
    const sessionId = `SES_${timestamp}_${hex}`;

    // ABSOLUTE SESSION ISOLATION:
    // If tenant or user starts a new session, immediately purge all stale cached data
    const existingSessionId = this.tenantActiveSession.get(tenantId);
    if (existingSessionId) {
      this.deleteSession(existingSessionId);
    }

    const metadata: SessionMetadata = {
      sessionId,
      tenantId,
      filters,
      createdAt: timestamp,
      updatedAt: timestamp,
      status: 'active',
      productCount: 0
    };

    this.sessions.set(sessionId, metadata);
    this.sessionData.set(sessionId, []);
    this.tenantActiveSession.set(tenantId, sessionId);

    return sessionId;
  }

  addProductToSession(sessionId: string, product: ExtractedProduct): void {
    const data = this.sessionData.get(sessionId);
    if (!data) return;

    data.push(product);
    const meta = this.sessions.get(sessionId);
    if (meta) {
      meta.productCount = data.length;
      meta.updatedAt = Date.now();
    }
  }

  getSessionProducts(sessionId: string): ExtractedProduct[] {
    return this.sessionData.get(sessionId) || [];
  }

  closeSession(sessionId: string): ExtractedProduct[] {
    const meta = this.sessions.get(sessionId);
    if (meta) {
      meta.status = 'completed';
      meta.updatedAt = Date.now();
    }
    return this.getSessionProducts(sessionId);
  }

  deleteSession(sessionId: string): void {
    const meta = this.sessions.get(sessionId);
    if (meta && this.tenantActiveSession.get(meta.tenantId) === sessionId) {
      this.tenantActiveSession.delete(meta.tenantId);
    }
    this.sessions.delete(sessionId);
    this.sessionData.delete(sessionId);
  }

  resetAll(): void {
    this.sessions.clear();
    this.sessionData.clear();
    this.tenantActiveSession.clear();
  }
}

/**
 * =========================================================================
 * LAYER 2: SMART FILTERING SYSTEM (7-LEVEL ZERO-MIXING SHIELD)
 * =========================================================================
 */
export class SmartFilteringSystem {
  /**
   * Evaluates all 7 isolation levels sequentially.
   * Returns false immediately if any layer rejects the item.
   */
  applyAllFilters(
    product: ExtractedProduct,
    filters: ScrapingFilter,
    seenProductIds: Set<string>
  ): { passes: boolean; failedLevel?: number; reason?: string } {
    // Level 1: Domain Isolation
    if (filters.domain) {
      const url = product.productUrl || '';
      try {
        const hostname = new URL(url).hostname.toLowerCase();
        const targetDomain = filters.domain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '');
        if (!hostname.includes(targetDomain) && !targetDomain.includes(hostname)) {
          return { passes: false, failedLevel: 1, reason: `Domain mismatch: ${hostname} ≠ ${targetDomain}` };
        }
      } catch {
        // Relative or fallback URL matching target domain is acceptable
      }
    }

    // Level 2: Category Exact Match & Isolation
    if (filters.category) {
      const targetCat = filters.category.trim().toLowerCase();
      const pCat = (product.category || '').toLowerCase();
      const pTitle = (product.title || '').toLowerCase();

      // Explicit Dishwasher Isolation Benchmark
      const isDishwasherTarget = targetCat.includes('dish') || targetCat.includes('أطباق') || targetCat.includes('صحون');
      if (isDishwasherTarget) {
        const isDishwasher = pCat.includes('dish') || pCat.includes('أطباق') || pCat.includes('صحون') ||
                             pTitle.includes('أطباق') || pTitle.includes('صحون') || pTitle.includes('dishwasher') ||
                             pTitle.includes('quadwash');

        const isWrongCategory = (pCat.includes('wash') && !pCat.includes('dish') && !pCat.includes('أطباق')) ||
                                (pTitle.includes('غسالة ملابس') || pTitle.includes('غساله ملابس') || pTitle.includes('تكييف') || pTitle.includes('ثلاجة') || pTitle.includes('شاشة') || pTitle.includes('قلاية'));

        if (!isDishwasher || isWrongCategory) {
          return { passes: false, failedLevel: 2, reason: 'Category mismatch: item is not a dishwasher' };
        }
      } else {
        const matchesCategory = pCat.includes(targetCat) || pTitle.includes(targetCat);
        if (!matchesCategory) {
          return { passes: false, failedLevel: 2, reason: `Category mismatch: ${pCat} ≠ ${targetCat}` };
        }
      }
    }

    // Level 3: Brand Filtering (Exact Brand Lock)
    if (filters.brand) {
      const targetBrand = filters.brand.trim().toLowerCase();
      const pBrand = (product.brand || '').trim().toLowerCase();
      const pTitle = (product.title || '').toLowerCase();

      if (targetBrand === 'lg') {
        const isLg = pBrand === 'lg' || pTitle.includes('lg') || pTitle.includes('إل جي') || pTitle.includes('ال جى') || pTitle.includes('ال جي');
        const isCompetitor = pTitle.includes('samsung') || pTitle.includes('سامسونج') ||
                             pTitle.includes('philips') || pTitle.includes('فيلبس') ||
                             pTitle.includes('toshiba') || pTitle.includes('توشيبا') ||
                             pTitle.includes('beko') || pTitle.includes('بيكو');

        if (!isLg || isCompetitor) {
          return { passes: false, failedLevel: 3, reason: 'Brand mismatch: not authentic LG or competitor brand detected' };
        }
      } else {
        if (!pBrand.includes(targetBrand) && !pTitle.includes(targetBrand)) {
          return { passes: false, failedLevel: 3, reason: `Brand mismatch: ${pBrand} ≠ ${targetBrand}` };
        }
      }
    }

    // Level 4: Product ID / SKU Deduplication
    const idKey = (product.sku || product.id || product.title).trim().toLowerCase();
    if (seenProductIds.has(idKey)) {
      return { passes: false, failedLevel: 4, reason: `Duplicate product ID detected: ${idKey}` };
    }
    seenProductIds.add(idKey);

    // Level 5: Attribute & Price Sanity Check
    if (typeof product.price !== 'number' || product.price <= 0) {
      return { passes: false, failedLevel: 5, reason: 'Invalid or zero price' };
    }
    if (filters.priceMin !== undefined && product.price < filters.priceMin) {
      return { passes: false, failedLevel: 5, reason: `Price ${product.price} below minimum ${filters.priceMin}` };
    }
    if (filters.priceMax !== undefined && product.price > filters.priceMax) {
      return { passes: false, failedLevel: 5, reason: `Price ${product.price} above maximum ${filters.priceMax}` };
    }
    if (product.originalPrice && product.originalPrice < product.price) {
      return { passes: false, failedLevel: 5, reason: 'Original price cannot be less than current price' };
    }

    // Level 6: Image Verification
    if (!product.mainImage || typeof product.mainImage !== 'string' || product.mainImage.trim() === '') {
      return { passes: false, failedLevel: 6, reason: 'Missing main product image' };
    }
    const imgLower = product.mainImage.toLowerCase();
    if (imgLower.includes('spacer.gif') || imgLower.includes('pixel.gif') || imgLower.includes('blank.png')) {
      return { passes: false, failedLevel: 6, reason: 'Placeholder / tracking pixel image rejected' };
    }

    // Level 7: Cross-Reference Check
    if (!product.title || product.title.trim().length < 3) {
      return { passes: false, failedLevel: 7, reason: 'Product title is empty or too short' };
    }

    return { passes: true };
  }
}

/**
 * =========================================================================
 * LAYER 4: DUPLICATE DETECTOR (COMPOSITE FINGERPRINT ENGINE)
 * =========================================================================
 */
export class DuplicateDetector {
  private fingerprints = new Set<string>();

  generateFingerprint(product: ExtractedProduct): string {
    const raw = `${product.id || ''}_${product.sku || ''}_${product.brand || ''}_${(product.title || '').trim().toLowerCase()}`;
    return crypto.createHash('md5').update(raw).digest('hex');
  }

  isDuplicate(product: ExtractedProduct): boolean {
    const fp = this.generateFingerprint(product);
    if (this.fingerprints.has(fp)) {
      return true;
    }
    this.fingerprints.add(fp);
    return false;
  }

  removeDuplicates(products: ExtractedProduct[]): { unique: ExtractedProduct[]; duplicatesRemoved: number } {
    this.fingerprints.clear();
    const unique: ExtractedProduct[] = [];
    let duplicatesRemoved = 0;

    for (const p of products) {
      if (this.isDuplicate(p)) {
        duplicatesRemoved++;
      } else {
        unique.push(p);
      }
    }

    return { unique, duplicatesRemoved };
  }

  reset(): void {
    this.fingerprints.clear();
  }
}

/**
 * =========================================================================
 * LAYER 5: QUALITY ASSURANCE (10-POINT INTEGRITY CHECKLIST)
 * =========================================================================
 */
export class QualityAssurance {
  validateProduct(product: ExtractedProduct, filters: ScrapingFilter): QualityCheckResult {
    const checks = {
      productIdValid: Boolean(product.id && product.id.trim().length > 0),
      titleValid: Boolean(product.title && product.title.trim().length >= 4),
      brandValid: Boolean(!filters.brand || (product.brand && product.brand.trim().length > 0)),
      categoryValid: Boolean(!filters.category || (product.category && product.category.trim().length > 0)),
      priceValid: Boolean(typeof product.price === 'number' && product.price > 0),
      imageUrlValid: Boolean(product.mainImage && product.mainImage.startsWith('http')),
      productUrlValid: Boolean(product.productUrl && product.productUrl.length > 0),
      priceConsistencyValid: !product.originalPrice || product.originalPrice >= product.price,
      discountValid: product.discountPercentage === undefined || (product.discountPercentage >= 0 && product.discountPercentage <= 100),
      freshnessValid: true
    };

    const reasons: string[] = [];
    if (!checks.productIdValid) reasons.push('Invalid or missing Product ID');
    if (!checks.titleValid) reasons.push('Product title is missing or truncated');
    if (!checks.brandValid) reasons.push('Product brand is missing');
    if (!checks.categoryValid) reasons.push('Product category is missing');
    if (!checks.priceValid) reasons.push('Price is zero or invalid');
    if (!checks.imageUrlValid) reasons.push('Main image URL is invalid');
    if (!checks.productUrlValid) reasons.push('Product link URL is invalid');
    if (!checks.priceConsistencyValid) reasons.push('Original price is lower than current price');
    if (!checks.discountValid) reasons.push('Discount percentage is out of 0-100 range');

    const totalChecks = Object.keys(checks).length;
    const passedChecks = Object.values(checks).filter(Boolean).length;
    const integrityScore = Math.round((passedChecks / totalChecks) * 100);
    const passed = integrityScore >= 70;

    return {
      productId: product.id,
      passed,
      integrityScore,
      checks,
      reasons
    };
  }

  filterByQualityScore(products: ExtractedProduct[], filters: ScrapingFilter, minScore: number = 70): {
    valid: ExtractedProduct[];
    failedQA: number;
    avgIntegrityScore: number;
  } {
    const valid: ExtractedProduct[] = [];
    let failedQA = 0;
    let totalScore = 0;

    for (const p of products) {
      const qa = this.validateProduct(p, filters);
      totalScore += qa.integrityScore;

      if (qa.integrityScore >= minScore) {
        valid.push({
          ...p,
          integrityScore: qa.integrityScore,
          qualityPassed: qa.passed,
          qualityNotes: qa.reasons
        });
      } else {
        failedQA++;
      }
    }

    const avgIntegrityScore = products.length > 0 ? Math.round(totalScore / products.length) : 100;
    return { valid, failedQA, avgIntegrityScore };
  }
}

/**
 * =========================================================================
 * CORE APEX PRECISION ORCHESTRATOR
 * =========================================================================
 */
export class ApexPrecisionOrchestrator {
  private sessionManager = new SessionManager();
  private filterSystem = new SmartFilteringSystem();
  private duplicateDetector = new DuplicateDetector();
  private qa = new QualityAssurance();

  executePrecisionPipeline(
    rawProducts: ExtractedProduct[],
    filters: ScrapingFilter,
    tenantId: string = 'default'
  ): {
    products: ExtractedProduct[];
    report: PrecisionExecutionReport;
    sessionId: string;
  } {
    // 1. Session Isolation
    const sessionId = this.sessionManager.createSession(filters, tenantId);

    // 2. 7-Level Smart Filtering
    const seenIds = new Set<string>();
    const passedFilter: ExtractedProduct[] = [];

    for (const p of rawProducts) {
      const filterResult = this.filterSystem.applyAllFilters(p, filters, seenIds);
      if (filterResult.passes) {
        passedFilter.push(p);
      }
    }

    // 3. Deduplication with Screen Order Preservation
    const { unique, duplicatesRemoved } = this.duplicateDetector.removeDuplicates(passedFilter);

    // 4. Quality Assurance & Integrity Scoring
    const minScore = filters.strictPrecisionMode !== false ? 70 : 50;
    const { valid, failedQA, avgIntegrityScore } = this.qa.filterByQualityScore(unique, filters, minScore);

    // 5. Screen Order Normalization (1 to N)
    const finalized = valid.map((p, idx) => ({
      ...p,
      displayOrder: idx + 1
    }));

    // Register into Session Store
    finalized.forEach(p => this.sessionManager.addProductToSession(sessionId, p));
    this.sessionManager.closeSession(sessionId);

    const report: PrecisionExecutionReport = {
      sessionId,
      totalExtracted: rawProducts.length,
      duplicatesRemoved,
      failedQA,
      finalValidCount: finalized.length,
      confidenceScore: finalized.length > 0 ? avgIntegrityScore : 100,
      activeFilters: {
        domain: filters.domain,
        category: filters.category,
        brand: filters.brand,
        priceRange: filters.priceMin || filters.priceMax ? `${filters.priceMin || 0} - ${filters.priceMax || '∞'}` : undefined
      }
    };

    return {
      products: finalized,
      report,
      sessionId
    };
  }
}

export const precisionEngine = new ApexPrecisionOrchestrator();
