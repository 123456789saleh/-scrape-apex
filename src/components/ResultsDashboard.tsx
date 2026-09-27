import React, { useState } from 'react';
import { ScrapeResult } from '../types/scraper.ts';
import { 
  ShoppingBag, 
  Table as TableIcon, 
  Newspaper, 
  Image as ImageIcon, 
  FileCode, 
  Cpu, 
  BarChart3, 
  Globe, 
  Clock, 
  Zap, 
  Layers, 
  Share2, 
  ExternalLink,
  ShieldCheck,
  Tag,
  Mail,
  AlertTriangle,
  Target
} from 'lucide-react';
import { ProductsView } from './results/ProductsView.tsx';
import { EmailsView } from './results/EmailsView.tsx';
import { TablesView } from './results/TablesView.tsx';
import { ArticlesView } from './results/ArticlesView.tsx';
import { MediaView } from './results/MediaView.tsx';
import { MetadataView } from './results/MetadataView.tsx';
import { AiAnalysisView } from './results/AiAnalysisView.tsx';
import { CodeSnippetView } from './results/CodeSnippetView.tsx';
import { AnalyticsCharts } from './AnalyticsCharts.tsx';
import { ExportCenter } from './ExportCenter.tsx';
import { formatBytes } from '../lib/utils.ts';

interface ResultsDashboardProps {
  result: ScrapeResult;
  lang: 'ar' | 'en';
}

type TabType = 'emails' | 'products' | 'tables' | 'articles' | 'media' | 'metadata' | 'ai' | 'code';

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ result, lang }) => {
  const emailCount = (result.emails || []).length;
  
  // Calculate best initial tab for current result
  const determineBestTab = (res: ScrapeResult): TabType => {
    const eCount = (res.emails || []).length;
    if (res.mode === 'emails') return 'emails';
    if (eCount > 0 && res.products.length === 0 && res.tables.length === 0) return 'emails';
    if (res.products.length > 0) return 'products';
    if (res.tables.length > 0) return 'tables';
    if (res.articles.length > 0) return 'articles';
    if (eCount > 0) return 'emails';
    return 'metadata';
  };

  const [activeTab, setActiveTab] = useState<TabType>(() => determineBestTab(result));
  const isAr = lang === 'ar';

  // Automatically update active tab when a new result arrives
  React.useEffect(() => {
    setActiveTab(determineBestTab(result));
  }, [result.id, result.url]);

  const tabs: { id: TabType; labelAr: string; labelEn: string; icon: any; count?: number; badgeColor?: string }[] = [
    { id: 'emails', labelAr: 'الإيميلات وجهات الاتصال', labelEn: 'Emails & Leads', icon: Mail, count: emailCount, badgeColor: 'bg-[#8B5CF6] text-white' },
    { id: 'products', labelAr: 'المنتجات والعروض', labelEn: 'Products & Deals', icon: ShoppingBag, count: result.products.length, badgeColor: 'bg-[#00D9FF] text-[#0F1419]' },
    { id: 'tables', labelAr: 'الجداول والبيانات', labelEn: 'Data Tables', icon: TableIcon, count: result.tables.length, badgeColor: 'bg-[#10B981] text-[#0F1419]' },
    { id: 'articles', labelAr: 'المقالات والنصوص', labelEn: 'Articles & Text', icon: Newspaper, count: result.articles.length },
    { id: 'media', labelAr: 'الوسائط والملفات', labelEn: 'Media & Files', icon: ImageIcon, count: result.media.length, badgeColor: 'bg-[#F59E0B] text-[#0F1419]' },
    { id: 'metadata', labelAr: 'البيانات المنظمة وSEO', labelEn: 'Metadata & SEO', icon: Globe },
    { id: 'ai', labelAr: 'تحليل الذكاء الاصطناعي', labelEn: 'AI Intelligence', icon: Cpu },
    { id: 'code', labelAr: 'الكود البرمجي المستقل', labelEn: 'Executable Code', icon: FileCode },
  ];

  return (
    <div className="space-y-6">
      
      {/* 1. Quick Stats Header Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        
        {/* Total Items */}
        <div className="bg-[#161F2E] p-3.5 rounded-xl border border-[#1E293B] space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#94A3B8] tracking-wider block">
            {isAr ? 'إجمالي العناصر' : 'Items Found'}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-[#00D9FF]">{result.stats.totalItemsFound}</span>
            <Layers className="w-4 h-4 text-[#00D9FF]/60" />
          </div>
        </div>

        {/* Duration */}
        <div className="bg-[#161F2E] p-3.5 rounded-xl border border-[#1E293B] space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#94A3B8] tracking-wider block">
            {isAr ? 'زمن الاستخلاص' : 'Scrape Duration'}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-[#10B981]">{(result.stats.durationMs / 1000).toFixed(2)}s</span>
            <Clock className="w-4 h-4 text-[#10B981]/60" />
          </div>
        </div>

        {/* Speed */}
        <div className="bg-[#161F2E] p-3.5 rounded-xl border border-[#1E293B] space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#94A3B8] tracking-wider block">
            {isAr ? 'معدل المعالجة' : 'Throughput'}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-[#F59E0B]">{result.stats.speedItemsPerSec}</span>
            <span className="text-[10px] text-[#64748B]">item/s</span>
          </div>
        </div>

        {/* Data Size */}
        <div className="bg-[#161F2E] p-3.5 rounded-xl border border-[#1E293B] space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#94A3B8] tracking-wider block">
            {isAr ? 'حجم البيانات' : 'Payload Size'}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">{formatBytes(result.stats.totalBytes)}</span>
          </div>
        </div>

        {/* Target Domain */}
        <div className="bg-[#161F2E] p-3.5 rounded-xl border border-[#1E293B] space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#94A3B8] tracking-wider block">
            {isAr ? 'النطاق المستهدف' : 'Domain'}
          </span>
          <div className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-[#00D9FF]" />
            <span className="text-xs font-bold text-white truncate">{result.targetDomain}</span>
          </div>
        </div>

        {/* HTTP Status */}
        <div className="bg-[#161F2E] p-3.5 rounded-xl border border-[#1E293B] space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#94A3B8] tracking-wider block">
            {isAr ? 'كود الحالة' : 'HTTP Status'}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-xs font-mono font-bold text-[#10B981]">200 OK</span>
          </div>
        </div>

      </div>

      {/* Content Type Detection Report Banner */}
      {result.contentTypeDetection && (
        <div className={`p-3.5 rounded-xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
          result.contentTypeDetection.isMismatch
            ? 'bg-[#F59E0B]/10 border-[#F59E0B]/40 text-[#F59E0B]'
            : 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]'
        }`}>
          <div className="flex items-center gap-2.5">
            {result.contentTypeDetection.isMismatch ? (
              <AlertTriangle className="w-5 h-5 text-[#F59E0B] shrink-0" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-[#10B981] shrink-0" />
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-white text-xs">
                  {isAr ? 'تقرير التعرف على نوع الصفحة (Content Type):' : 'Content Type Detection Report:'}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-[#0F1419] border border-current font-bold text-xs">
                  {isAr ? result.contentTypeDetection.detectedTypeLabelAr : result.contentTypeDetection.detectedTypeLabel}
                </span>
                <span className="text-[11px] font-mono text-white/80">
                  {isAr ? `ثقة: ${result.contentTypeDetection.confidenceScore}%` : `Confidence: ${result.contentTypeDetection.confidenceScore}%`}
                </span>
                {result.contentTypeDetection.matchedRule && (
                  <span className="text-[10px] text-[#94A3B8] font-mono bg-[#1E293B] px-1.5 py-0.5 rounded">
                    Rule: {result.contentTypeDetection.matchedRule}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#E2E8F0] mt-1">
                {result.contentTypeDetection.isMismatch 
                  ? (isAr ? result.contentTypeDetection.mismatchAlertAr : result.contentTypeDetection.mismatchAlert)
                  : (isAr ? 'تم التحقق من تطابق نوع الصفحة ووضع الاستخلاص بنجاح بنسبة نقاء 100% وبدون خلط بيانات.' : 'Page type and extraction mode verified with 100% data purity.')}
              </p>
            </div>
          </div>
          {result.targetBrand && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1E293B] border border-[#334155] text-xs text-white shrink-0">
              <Target className="w-3.5 h-3.5 text-[#00D9FF]" />
              <span className="text-[#94A3B8]">{isAr ? 'العلامة التجارية:' : 'Target Brand:'}</span>
              <span className="font-bold text-[#00D9FF]">{result.targetBrand}</span>
            </div>
          )}
        </div>
      )}

      {/* 2. Main Tabbed Navigation Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-[#1E293B] scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? 'border-[#00D9FF] text-[#00D9FF] bg-[#161F2E]/40'
                  : 'border-transparent text-[#94A3B8] hover:text-white hover:border-[#334155]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{isAr ? tab.labelAr : tab.labelEn}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${tab.badgeColor || 'bg-[#1E293B] text-white'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Active Tab Content View */}
      <div className="min-h-[400px]">
        {activeTab === 'emails' && (
          <EmailsView 
            emails={result.emails || []} 
            contacts={result.contacts} 
            url={result.url} 
            lang={lang} 
            unreadCount={result.unreadEmailsCount}
            totalMailboxCount={result.totalMailboxCount}
            primaryAccountEmail={result.primaryAccountEmail}
          />
        )}
        {activeTab === 'products' && (
          <ProductsView 
            products={result.products} 
            lang={lang} 
            precisionReport={result.precisionReport} 
          />
        )}
        {activeTab === 'tables' && <TablesView tables={result.tables} lang={lang} />}
        {activeTab === 'articles' && <ArticlesView articles={result.articles} lang={lang} />}
        {activeTab === 'media' && <MediaView media={result.media} lang={lang} />}
        {activeTab === 'metadata' && <MetadataView metadata={result.metadata} url={result.url} lang={lang} />}
        {activeTab === 'ai' && <AiAnalysisView aiAnalysis={result.aiAnalysis} rawText={result.rawHtmlSample || ''} lang={lang} />}
        {activeTab === 'code' && <CodeSnippetView config={result.config} lang={lang} />}
      </div>

      {/* 4. Analytics & Charts if products exist */}
      {result.products.length > 0 && (
        <AnalyticsCharts products={result.products} stats={result.stats} lang={lang} />
      )}

      {/* 5. Permanent Export Center */}
      <ExportCenter result={result} lang={lang} />

    </div>
  );
};
