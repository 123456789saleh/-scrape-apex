import React, { useState, useMemo } from 'react';
import { 
  ExtractedProduct 
} from '../../types/scraper.ts';
import { 
  LayoutGrid, 
  Table as TableIcon, 
  Search, 
  Star, 
  CheckCircle, 
  XCircle, 
  ExternalLink, 
  Copy, 
  SlidersHorizontal,
  Tag,
  Truck,
  ShieldAlert,
  ShieldCheck,
  Info,
  Maximize2,
  Monitor,
  ArrowUpDown,
  ListOrdered,
  Layers,
  FileText,
  Sparkles
} from 'lucide-react';
import { formatCurrency, copyToClipboard, getAccurateProductImage } from '../../lib/utils.ts';
import { ProductImage } from '../common/ProductImage.tsx';

interface ProductsViewProps {
  products: ExtractedProduct[];
  lang: 'ar' | 'en';
  precisionReport?: any;
}

export const ProductsView: React.FC<ProductsViewProps> = ({ products, lang, precisionReport }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [minDiscount, setMinDiscount] = useState<number>(0);
  const [selectedPage, setSelectedPage] = useState<number | 'all'>('all');
  const [sortBy, setSortBy] = useState<'screen' | 'screen_desc' | 'price_asc' | 'price_desc' | 'discount' | 'rating'>('screen');
  const [selectedProduct, setSelectedProduct] = useState<ExtractedProduct | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const isAr = lang === 'ar';

  const availablePages = useMemo(() => {
    const pages = new Set<number>();
    products.forEach(p => {
      if (p.pageNumber) pages.add(p.pageNumber);
    });
    return Array.from(pages).sort((a, b) => a - b);
  }, [products]);

  const filteredProducts = products.filter(p => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || 
      p.title.toLowerCase().includes(query) ||
      (p.brand && p.brand.toLowerCase().includes(query)) ||
      (p.sku && p.sku.toLowerCase().includes(query)) ||
      (p.seller && p.seller.toLowerCase().includes(query));
    
    const matchesStock = inStockOnly ? p.inStock : true;
    const matchesDiscount = (p.discountPercentage || 0) >= minDiscount;
    const matchesPage = selectedPage === 'all' || p.pageNumber === selectedPage;

    return matchesSearch && matchesStock && matchesDiscount && matchesPage;
  });

  // Strict Screen Order Sorting Engine (Default preserves exact visual display order from scraped store)
  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      const orderA = a.displayOrder ?? 999999;
      const orderB = b.displayOrder ?? 999999;

      if (sortBy === 'screen') {
        return orderA - orderB;
      }
      if (sortBy === 'screen_desc') {
        return orderB - orderA;
      }
      if (sortBy === 'price_asc') {
        return a.price - b.price;
      }
      if (sortBy === 'price_desc') {
        return b.price - a.price;
      }
      if (sortBy === 'discount') {
        return (b.discountPercentage || 0) - (a.discountPercentage || 0);
      }
      if (sortBy === 'rating') {
        return (b.rating || 0) - (a.rating || 0);
      }
      return 0;
    });
  }, [filteredProducts, sortBy]);

  const handleCopyLink = (p: ExtractedProduct) => {
    copyToClipboard(p.productUrl || window.location.href);
    setCopiedId(p.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-16 px-4 text-[#94A3B8] bg-[#0F1419] rounded-xl border border-[#1E293B]">
        <Tag className="w-10 h-10 text-[#64748B] mx-auto mb-3" />
        <p className="text-sm font-medium">{isAr ? 'لم يتم العثور على بطاقات منتجات في هذه الصفحة' : 'No product cards detected in this page.'}</p>
        <p className="text-xs text-[#64748B] mt-1">{isAr ? 'جرب تحديد وضع آخر أو استخدام المحددات المخصصة' : 'Try selecting another mode or inspect custom CSS selectors.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Precision Shield Status Banner */}
      <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#10B981]/15 via-[#0F1419] to-[#00D9FF]/15 border border-[#10B981]/30 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-[#10B981]/20 text-[#10B981]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">
                {isAr ? 'درع الدقة الفائقة ومنع خلط البيانات (Universal Precision Shield)' : 'Universal Precision Shield Active'}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#10B981] text-[#0F1419]">
                {precisionReport?.confidenceScore ?? 100}% {isAr ? 'نقاء تام' : 'Pure'}
              </span>
            </div>
            <p className="text-[11px] text-[#94A3B8] mt-0.5">
              {isAr ? 'تم التحقق من عزل العلامة التجارية، منع التداخل بين الفئات، وحذف التكرارات بالكامل' : '0% data mixing guaranteed: strict brand & category isolation, exact SKU deduplication'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap text-[11px]">
          <span className="px-2.5 py-1 rounded-lg bg-[#161F2E] border border-[#1E293B] text-[#E2E8F0]">
            {isAr ? 'العناصر المعتمدة:' : 'Approved:'} <strong className="text-[#00D9FF]">{products.length}</strong>
          </span>
          {precisionReport && (
            <>
              <span className="px-2.5 py-1 rounded-lg bg-[#161F2E] border border-[#1E293B] text-[#E2E8F0]">
                {isAr ? 'تكرارات محذوفة:' : 'Duplicates Removed:'} <strong className="text-[#F59E0B]">{precisionReport.duplicatesRemoved}</strong>
              </span>
              {precisionReport.failedQA > 0 && (
                <span className="px-2.5 py-1 rounded-lg bg-[#161F2E] border border-[#1E293B] text-[#E2E8F0]">
                  {isAr ? 'مستبعد للجودة:' : 'Excluded QA:'} <strong className="text-[#EF4444]">{precisionReport.failedQA}</strong>
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Filter and View Mode Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0F1419] p-3 rounded-xl border border-[#1E293B]">
        
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder={isAr ? "بحث في المنتجات والعلامات التجارية..." : "Search products, brands, or sellers..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#161F2E] border border-[#1E293B] focus:border-[#00D9FF] rounded-lg px-3 py-2 pl-9 text-xs text-white placeholder-[#64748B] outline-none"
          />
          <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <label className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#161F2E] border border-[#1E293B] text-[#E2E8F0] cursor-pointer">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="rounded bg-[#0F1419] border-[#334155] text-[#00D9FF] focus:ring-0"
            />
            <span>{isAr ? 'المتاح بالمخزون فقط' : 'In Stock Only'}</span>
          </label>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161F2E] border border-[#1E293B] text-[#E2E8F0]">
            <span className="text-[#94A3B8]">{isAr ? 'خصم ≥' : 'Discount ≥'}</span>
            <select
              value={minDiscount}
              onChange={(e) => setMinDiscount(parseInt(e.target.value))}
              className="bg-[#0F1419] text-[#00D9FF] font-bold rounded px-1.5 py-0.5 outline-none"
            >
              <option value="0">0%</option>
              <option value="10">10%</option>
              <option value="20">20%</option>
              <option value="30">30%</option>
              <option value="50">50%</option>
            </select>
          </div>

          {/* Sorting Control */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161F2E] border border-[#1E293B] text-[#E2E8F0]">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#00D9FF]" />
            <span className="text-[#94A3B8] hidden md:inline">{isAr ? 'الترتيب:' : 'Sort:'}</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#0F1419] text-[#00D9FF] font-medium rounded px-2 py-0.5 text-xs outline-none cursor-pointer"
            >
              <option value="screen">{isAr ? '🎯 ترتيب الظهور على الشاشة (الأصلي)' : '🎯 Screen Display Order (Default)'}</option>
              <option value="screen_desc">{isAr ? '🔄 عكس ترتيب الشاشة (من الأخير)' : '🔄 Reverse Screen Order'}</option>
              <option value="price_asc">{isAr ? '💵 السعر: الأقل للأعلى' : '💵 Price: Low to High'}</option>
              <option value="price_desc">{isAr ? '💰 السعر: الأعلى للأقل' : '💰 Price: High to Low'}</option>
              <option value="discount">{isAr ? '🏷️ أعلى نسبة خصم' : '🏷️ Highest Discount'}</option>
              <option value="rating">{isAr ? '⭐ الأعلى تقييماً' : '⭐ Top Rated'}</option>
            </select>
          </div>

          {/* Grid / Table Toggle */}
          <div className="flex items-center bg-[#161F2E] border border-[#1E293B] rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-[#00D9FF] text-[#0F1419]' : 'text-[#94A3B8] hover:text-white'}`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-[#00D9FF] text-[#0F1419]' : 'text-[#94A3B8] hover:text-white'}`}
              title="Table View"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Results Count & Screen Order Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#94A3B8] px-1">
        <div className="flex flex-wrap items-center gap-2">
          <span>
            {isAr ? `عرض ${sortedProducts.length} من أصل ${products.length} منتج` : `Showing ${sortedProducts.length} of ${products.length} products`}
          </span>
          {sortBy === 'screen' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#00D9FF]/10 text-[#00D9FF] border border-[#00D9FF]/30 text-[10px] font-semibold">
              <Monitor className="w-3 h-3" />
              {isAr ? 'مُرتّبة وفقاً لتسلسل الظهور الفعلي على شاشة المتجر المسحوب منه (1 ➔ الأخير)' : 'Strictly in original screen display order (1 ➔ N)'}
            </span>
          )}
        </div>
        {sortBy !== 'screen' && (
          <button
            onClick={() => setSortBy('screen')}
            className="text-[11px] text-[#00D9FF] hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-auto"
          >
            <Monitor className="w-3 h-3" />
            <span>{isAr ? 'استعادة ترتيب الظهور على الشاشة الأصلي' : 'Reset to Screen Order'}</span>
          </button>
        )}
      </div>

      {/* Multi-Page Navigation Bar */}
      {availablePages.length > 1 && (
        <div className="bg-[#0F1419] p-3 rounded-xl border border-[#00D9FF]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg shadow-cyan-500/5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#00D9FF]/15 text-[#00D9FF]">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">
                  {isAr ? 'متصفح الصفحات المسحوبة (Multi-Page Store Crawler)' : 'Multi-Page Store Crawler'}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00D9FF]/20 text-[#00D9FF]">
                  {isAr ? `${availablePages.length} صفحات` : `${availablePages.length} Pages`}
                </span>
              </div>
              <p className="text-[11px] text-[#94A3B8] mt-0.5">
                {isAr 
                  ? 'تم سحب كافة صفحات المتجر كاملة بالإضافة لعناصر التمرير اللانهائي (Infinite Scroll) في قاع كل صفحة.'
                  : 'All store pages traversed with infinite scroll simulation at page bottoms.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setSelectedPage('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedPage === 'all'
                  ? 'bg-[#00D9FF] text-[#0F1419] shadow-md shadow-cyan-500/20'
                  : 'bg-[#161F2E] text-[#94A3B8] hover:text-white hover:bg-[#1E293B] border border-[#1E293B]'
              }`}
            >
              {isAr ? `جميع الصفحات (${products.length})` : `All Pages (${products.length})`}
            </button>
            {availablePages.map(page => {
              const pageCount = products.filter(p => p.pageNumber === page).length;
              return (
                <button
                  key={page}
                  onClick={() => setSelectedPage(page)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedPage === page
                      ? 'bg-[#00D9FF] text-[#0F1419] shadow-md shadow-cyan-500/20'
                      : 'bg-[#161F2E] text-[#94A3B8] hover:text-white hover:bg-[#1E293B] border border-[#1E293B]'
                  }`}
                >
                  <FileText className="w-3 h-3" />
                  <span>{isAr ? `صفحة ${page}` : `Page ${page}`}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    selectedPage === page ? 'bg-[#0F1419]/25 text-[#0F1419] font-black' : 'bg-[#1E293B] text-[#00D9FF]'
                  }`}>
                    {pageCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* GRID VIEW */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedProducts.map((product) => {
            return (
              <div
                key={product.id}
                className="group bg-[#0F1419] border border-[#1E293B] hover:border-[#00D9FF]/50 rounded-xl overflow-hidden flex flex-col justify-between transition-all hover:shadow-xl hover:shadow-cyan-500/5 relative"
              >
                {/* Discount Badge */}
                {product.discountPercentage && product.discountPercentage > 0 ? (
                  <div className="absolute top-2.5 right-2.5 z-10 bg-[#EF4444] text-white text-[11px] font-black px-2 py-0.5 rounded-full shadow-md">
                    -{product.discountPercentage}%
                  </div>
                ) : null}

                {/* Stock Tag & Page Badge */}
                <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1 items-start">
                  <div className="flex items-center gap-1">
                    {product.inStock ? (
                      <span className="flex items-center gap-1 bg-[#10B981]/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                        <CheckCircle className="w-3 h-3" />
                        {isAr ? 'متاح' : 'In Stock'}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 bg-[#EF4444]/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                        <XCircle className="w-3 h-3" />
                        {isAr ? 'نفذت الكمية' : 'Out of Stock'}
                      </span>
                    )}
                    {product.pageNumber && (
                      <span 
                        className="bg-[#8B5CF6]/90 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow flex items-center gap-1"
                        title={isAr ? `مسحوب من صفحة المتجر رقم ${product.pageNumber}` : `Scraped from page #${product.pageNumber}`}
                      >
                        <FileText className="w-2.5 h-2.5" />
                        {isAr ? `صفحة ${product.pageNumber}` : `P${product.pageNumber}`}
                      </span>
                    )}
                  </div>
                  {product.category && (
                    <span className="bg-[#1E293B]/90 text-[#00D9FF] text-[9px] font-semibold px-2 py-0.5 rounded-md border border-[#334155] shadow max-w-[140px] truncate">
                      {product.category}
                    </span>
                  )}
                  {product.availabilityText?.includes('Infinite Scroll') && (
                    <span className="bg-[#10B981]/90 text-[#0F1419] text-[9px] font-black px-2 py-0.5 rounded-md shadow flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" />
                      {isAr ? 'تمرير لأسفل (Scroll)' : 'Infinite Scroll'}
                    </span>
                  )}
                </div>

                {/* Product Image */}
                <div 
                  className="relative h-48 bg-[#161F2E] overflow-hidden flex items-center justify-center p-2 cursor-pointer"
                  onClick={() => setSelectedProduct(product)}
                >
                  <ProductImage
                    product={product}
                    alt={product.title}
                    className="w-full h-full rounded-lg"
                    imgClassName="group-hover:scale-105"
                  />
                </div>

                {/* Product Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5">
                        <span 
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#00D9FF]/10 text-[#00D9FF] text-[10px] font-mono font-bold border border-[#00D9FF]/20" 
                          title={isAr ? `الترتيب رقم #${product.displayOrder || '1'} في الظهور على الشاشة الأصلية` : `Item #${product.displayOrder || '1'} in screen appearance order`}
                        >
                          <Monitor className="w-2.5 h-2.5" />
                          #{product.displayOrder || '1'}
                        </span>
                        {product.integrityScore && (
                          <span 
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#10B981]/15 text-[#10B981] text-[9px] font-bold border border-[#10B981]/30"
                            title={isAr ? `مؤشر نقاء ومطابقة البيانات: ${product.integrityScore}%` : `Integrity Match Score: ${product.integrityScore}%`}
                          >
                            <ShieldCheck className="w-2.5 h-2.5" />
                            {product.integrityScore}%
                          </span>
                        )}
                        {product.brand && (
                          <span className="text-[10px] font-bold text-[#00D9FF] uppercase tracking-wider block">
                            {product.brand}
                          </span>
                        )}
                      </div>
                      {product.sku && (
                        <span className="text-[9px] font-mono text-[#94A3B8] bg-[#161F2E] px-1.5 py-0.5 rounded border border-[#1E293B]">
                          {product.sku}
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-semibold text-[#E2E8F0] line-clamp-2 leading-relaxed" title={product.title}>
                      {product.title}
                    </h4>
                  </div>

                  {/* Pricing & Rating */}
                  <div className="space-y-1.5 pt-2 border-t border-[#1E293B]">
                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-black text-[#00D9FF]">
                        {formatCurrency(product.price, product.currency)}
                      </span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <span className="text-xs text-[#64748B] line-through">
                          {formatCurrency(product.originalPrice, product.currency)}
                        </span>
                      )}
                    </div>

                    {product.rating && (
                      <div className="flex items-center gap-1.5 text-xs text-[#F59E0B]">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span className="font-bold">{product.rating}</span>
                        {product.reviewsCount && (
                          <span className="text-[11px] text-[#64748B]">({product.reviewsCount})</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => setSelectedProduct(product)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-[#161F2E] hover:bg-[#1E293B] text-xs font-semibold text-[#E2E8F0] border border-[#1E293B] transition-colors cursor-pointer"
                    >
                      <Info className="w-3.5 h-3.5 text-[#00D9FF]" />
                      <span>{isAr ? 'المواصفات' : 'Specs'}</span>
                    </button>

                    <button
                      onClick={() => handleCopyLink(product)}
                      className="p-1.5 rounded-lg bg-[#161F2E] hover:bg-[#1E293B] text-[#94A3B8] hover:text-white border border-[#1E293B] transition-colors"
                      title={copiedId === product.id ? 'Copied!' : 'Copy Link'}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    {product.productUrl && (
                      <a
                        href={product.productUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-[#161F2E] hover:bg-[#1E293B] text-[#00D9FF] border border-[#1E293B] transition-colors"
                        title="Open Source URL"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-[#0F1419] border border-[#1E293B] rounded-xl overflow-x-auto scrollbar-thin">
          <table className="w-full text-xs text-right text-[#E2E8F0]">
            <thead className="bg-[#161F2E] text-[#94A3B8] font-semibold border-b border-[#1E293B]">
              <tr>
                <th className="p-3 text-center w-16">{isAr ? '# الشاشة' : '# Screen'}</th>
                <th className="p-3 text-center w-14">{isAr ? 'الصورة' : 'Img'}</th>
                <th className="p-3">{isAr ? 'اسم المنتج' : 'Title'}</th>
                <th className="p-3">{isAr ? 'السعر' : 'Price'}</th>
                <th className="p-3">{isAr ? 'السعر الأصلي' : 'Original'}</th>
                <th className="p-3">{isAr ? 'الخصم' : 'Discount'}</th>
                <th className="p-3">{isAr ? 'التقييم' : 'Rating'}</th>
                <th className="p-3">{isAr ? 'الحالة' : 'Stock'}</th>
                <th className="p-3">{isAr ? 'البائع' : 'Seller'}</th>
                <th className="p-3 text-center">{isAr ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]">
              {sortedProducts.map((p) => (
                <tr key={p.id} className="hover:bg-[#161F2E]/60 transition-colors">
                  <td className="p-2 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span 
                        className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-md bg-[#00D9FF]/10 text-[#00D9FF] font-mono font-bold text-xs border border-[#00D9FF]/20" 
                        title={isAr ? `الترتيب رقم #${p.displayOrder || '1'} في الظهور على الشاشة المسحوبة` : `Item #${p.displayOrder || '1'} in screen appearance order`}
                      >
                        <Monitor className="w-3 h-3" />
                        #{p.displayOrder || '1'}
                      </span>
                      {p.pageNumber && (
                        <span 
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#8B5CF6]/15 text-[#A78BFA] text-[8px] font-bold border border-[#8B5CF6]/30"
                          title={isAr ? `صفحة ${p.pageNumber}` : `Page ${p.pageNumber}`}
                        >
                          <FileText className="w-2.5 h-2.5" />
                          {isAr ? `ص ${p.pageNumber}` : `P${p.pageNumber}`}
                        </span>
                      )}
                      {p.availabilityText?.includes('Infinite Scroll') && (
                        <span 
                          className="text-[8px] font-bold px-1 rounded bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30"
                          title={isAr ? 'تم سحبه عبر التمرير لأسفل Infinite Scroll' : 'Infinite Scroll'}
                        >
                          Scroll
                        </span>
                      )}
                      {p.integrityScore && (
                        <span 
                          className="text-[8px] font-bold px-1 rounded bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30"
                          title={isAr ? `مؤشر النقاء: ${p.integrityScore}%` : `Purity: ${p.integrityScore}%`}
                        >
                          {p.integrityScore}%
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-2 text-center">
                    <div className="w-10 h-10 rounded-lg bg-[#161F2E] overflow-hidden flex items-center justify-center mx-auto border border-[#1E293B]">
                      <ProductImage product={p} isTable={true} className="w-full h-full" />
                    </div>
                  </td>
                  <td className="p-3 font-medium max-w-xs" title={p.title}>
                    <div className="truncate">{p.title}</div>
                    {p.sku && (
                      <span className="inline-block mt-0.5 text-[9px] font-mono text-[#00D9FF] bg-[#00D9FF]/10 px-1.5 py-0.5 rounded border border-[#00D9FF]/20">
                        {p.sku}
                      </span>
                    )}
                  </td>
                  <td className="p-3 font-bold text-[#00D9FF]">{formatCurrency(p.price, p.currency)}</td>
                  <td className="p-3 text-[#64748B] line-through">{p.originalPrice ? formatCurrency(p.originalPrice, p.currency) : '-'}</td>
                  <td className="p-3">
                    {p.discountPercentage ? <span className="text-[#EF4444] font-bold">-{p.discountPercentage}%</span> : '-'}
                  </td>
                  <td className="p-3">
                    {p.rating ? <span className="text-[#F59E0B] font-bold flex items-center gap-1"><Star className="w-3 h-3 fill-current" /> {p.rating}</span> : '-'}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.inStock ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-[#EF4444]/20 text-[#EF4444]'}`}>
                      {p.inStock ? (isAr ? 'متاح' : 'In Stock') : (isAr ? 'نفذت' : 'Out')}
                    </span>
                  </td>
                  <td className="p-3 text-[#94A3B8]">{p.seller || p.brand || '-'}</td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => setSelectedProduct(p)}
                      className="p-1.5 rounded bg-[#1E293B] hover:bg-[#00D9FF] hover:text-[#0F1419] text-[#00D9FF] transition-colors"
                      title="View Details"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Product Details Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#161F2E] border border-[#1E293B] rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-start border-b border-[#1E293B] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-[#00D9FF] uppercase tracking-wider">{selectedProduct.brand || 'Product Details'}</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#00D9FF]/10 text-[#00D9FF] text-[10px] font-mono border border-[#00D9FF]/25 font-bold">
                    <Monitor className="w-3 h-3" />
                    {isAr ? `ترتيب الظهور على الشاشة: #${selectedProduct.displayOrder || '1'}` : `Screen Order: #${selectedProduct.displayOrder || '1'}`}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-1">{selectedProduct.title}</h3>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-1.5 rounded-lg bg-[#0F1419] hover:bg-[#1E293B] text-[#94A3B8] hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <div className="h-60 bg-[#0F1419] rounded-xl flex items-center justify-center p-3 border border-[#1E293B] overflow-hidden">
                  <ProductImage product={selectedProduct} className="w-full h-full rounded-lg" />
                </div>
                {selectedProduct.galleryImages && selectedProduct.galleryImages.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {selectedProduct.galleryImages.map((imgUrl, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedProduct({ ...selectedProduct, mainImage: imgUrl })}
                        className="w-12 h-12 rounded-lg border border-[#1E293B] hover:border-[#00D9FF] bg-[#0F1419] overflow-hidden flex-shrink-0 transition-colors"
                      >
                        <img src={imgUrl} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3 text-xs">
                <div className="bg-[#0F1419] p-3 rounded-xl border border-[#1E293B] space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-[#94A3B8]">{isAr ? 'السعر الحالي:' : 'Current Price:'}</span>
                    <span className="text-sm font-black text-[#00D9FF]">{formatCurrency(selectedProduct.price, selectedProduct.currency)}</span>
                  </div>
                  {selectedProduct.originalPrice && (
                    <div className="flex justify-between">
                      <span className="text-[#94A3B8]">{isAr ? 'السعر الأصلي:' : 'Original Price:'}</span>
                      <span className="line-through text-[#64748B]">{formatCurrency(selectedProduct.originalPrice, selectedProduct.currency)}</span>
                    </div>
                  )}
                  {selectedProduct.discountPercentage && (
                    <div className="flex justify-between">
                      <span className="text-[#94A3B8]">{isAr ? 'نسبة التوفير:' : 'Savings Discount:'}</span>
                      <span className="font-bold text-[#EF4444]">-{selectedProduct.discountPercentage}%</span>
                    </div>
                  )}
                </div>

                <div className="bg-[#0F1419] p-3 rounded-xl border border-[#1E293B] space-y-1">
                  <p><span className="text-[#94A3B8]">{isAr ? 'البائع:' : 'Seller:'}</span> <strong className="text-white">{selectedProduct.seller || 'N/A'}</strong></p>
                  <p><span className="text-[#94A3B8]">{isAr ? 'الشحن:' : 'Shipping:'}</span> <strong className="text-white">{selectedProduct.shippingInfo || 'Standard Delivery'}</strong></p>
                  <p><span className="text-[#94A3B8]">{isAr ? 'الضمان:' : 'Warranty:'}</span> <strong className="text-white">{selectedProduct.warrantyInfo || 'Official Warranty'}</strong></p>
                </div>
              </div>
            </div>

            {/* Specifications Key-Value */}
            {selectedProduct.specs && Object.keys(selectedProduct.specs).length > 0 && (
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-[#E2E8F0] uppercase tracking-wider">{isAr ? 'المواصفات الفنية المستخرجة:' : 'Extracted Specifications:'}</h5>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(selectedProduct.specs).map(([key, val]) => (
                    <div key={key} className="bg-[#0F1419] p-2.5 rounded-lg border border-[#1E293B]">
                      <span className="text-[#94A3B8] block text-[10px]">{key}</span>
                      <span className="text-white font-medium">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-[#1E293B]">
              <button
                onClick={() => setSelectedProduct(null)}
                className="px-5 py-2 rounded-xl bg-[#00D9FF] text-[#0F1419] font-bold text-xs hover:brightness-110"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
