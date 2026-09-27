import React, { useState } from 'react';
import { ScrapeResult } from '../types/scraper.ts';
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Code, 
  FileCode2, 
  Printer, 
  Check, 
  Loader2,
  Sparkles,
  Share2
} from 'lucide-react';
import { downloadFile } from '../lib/utils.ts';
import { exportResultToExcel, exportResultToCsv } from '../lib/clientExport.ts';

interface ExportCenterProps {
  result: ScrapeResult;
  lang: 'ar' | 'en';
}

export const ExportCenter: React.FC<ExportCenterProps> = ({ result, lang }) => {
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);
  const isAr = lang === 'ar';

  const handleExport = async (format: 'excel' | 'csv' | 'json' | 'xml' | 'html' | 'markdown') => {
    setDownloadingFormat(format);
    try {
      if (format === 'excel') {
        const success = exportResultToExcel(result, undefined, 'comprehensive-export');
        if (success) {
          setDownloadingFormat(null);
          return;
        }
      } else if (format === 'csv') {
        exportResultToCsv(result, undefined, 'comprehensive-export');
        setDownloadingFormat(null);
        return;
      }

      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          result,
          format
        })
      });

      if (!response.ok) {
        throw new Error('Export generation failed');
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `scrape-export-${Date.now()}.${format === 'excel' ? 'xlsx' : format === 'markdown' ? 'md' : format}`;
      if (contentDisposition && contentDisposition.includes('filename=')) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) filename = match[1];
      }

      downloadFile(blob, filename);
    } catch (err) {
      console.error('Export error:', err);
      // Fallback directly to client XLSX
      if (format === 'excel') {
        exportResultToExcel(result, undefined, 'scrape-export');
      } else if (format === 'csv') {
        exportResultToCsv(result, undefined, 'scrape-export');
      }
    } finally {
      setDownloadingFormat(null);
    }
  };

  return (
    <div className="bg-[#161F2E] border border-[#1E293B] rounded-2xl p-5 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1E293B] pb-3">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Download className="w-4 h-4 text-[#00D9FF]" />
            <span>{isAr ? 'مركز التصدير المتقدم وحفظ البيانات:' : 'Export & Data Delivery Center:'}</span>
          </h3>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            {isAr ? 'تصدير فوري بجميع الصيغ المتوافقة مع Excel وقواعد البيانات وأنظمة التحليل' : 'Multi-format instantaneous exports formatted for Excel, Databases & Reports'}
          </p>
        </div>

        <span className="text-xs font-mono text-[#00D9FF] bg-[#0F1419] px-3 py-1 rounded-lg border border-[#1E293B]">
          {result.stats.totalItemsFound} {isAr ? 'عنصر جاهز' : 'items ready'}
        </span>
      </div>

      {/* Export Options Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        
        {/* Excel XLSX */}
        <button
          id="export-excel-btn"
          onClick={() => handleExport('excel')}
          disabled={downloadingFormat !== null}
          className="flex flex-col items-center justify-center p-4 rounded-xl bg-[#0F1419] hover:bg-[#10B981]/15 border border-[#1E293B] hover:border-[#10B981] transition-all group cursor-pointer"
        >
          {downloadingFormat === 'excel' ? (
            <Loader2 className="w-6 h-6 text-[#10B981] animate-spin mb-2" />
          ) : (
            <FileSpreadsheet className="w-6 h-6 text-[#10B981] group-hover:scale-110 transition-transform mb-2" />
          )}
          <span className="text-xs font-bold text-white">Excel (.xlsx)</span>
          <span className="text-[10px] text-[#64748B] mt-0.5">{isAr ? 'جداول مايكروسوفت' : 'Formatted Sheets'}</span>
        </button>

        {/* CSV */}
        <button
          id="export-csv-btn"
          onClick={() => handleExport('csv')}
          disabled={downloadingFormat !== null}
          className="flex flex-col items-center justify-center p-4 rounded-xl bg-[#0F1419] hover:bg-[#00D9FF]/15 border border-[#1E293B] hover:border-[#00D9FF] transition-all group cursor-pointer"
        >
          {downloadingFormat === 'csv' ? (
            <Loader2 className="w-6 h-6 text-[#00D9FF] animate-spin mb-2" />
          ) : (
            <FileText className="w-6 h-6 text-[#00D9FF] group-hover:scale-110 transition-transform mb-2" />
          )}
          <span className="text-xs font-bold text-white">CSV (UTF-8)</span>
          <span className="text-[10px] text-[#64748B] mt-0.5">{isAr ? 'دعم كامل للعربية' : 'Excel Arabic BOM'}</span>
        </button>

        {/* JSON */}
        <button
          id="export-json-btn"
          onClick={() => handleExport('json')}
          disabled={downloadingFormat !== null}
          className="flex flex-col items-center justify-center p-4 rounded-xl bg-[#0F1419] hover:bg-[#F59E0B]/15 border border-[#1E293B] hover:border-[#F59E0B] transition-all group cursor-pointer"
        >
          {downloadingFormat === 'json' ? (
            <Loader2 className="w-6 h-6 text-[#F59E0B] animate-spin mb-2" />
          ) : (
            <Code className="w-6 h-6 text-[#F59E0B] group-hover:scale-110 transition-transform mb-2" />
          )}
          <span className="text-xs font-bold text-white">JSON API</span>
          <span className="text-[10px] text-[#64748B] mt-0.5">{isAr ? 'بيانات مهيكلة' : 'Structured Records'}</span>
        </button>

        {/* XML */}
        <button
          id="export-xml-btn"
          onClick={() => handleExport('xml')}
          disabled={downloadingFormat !== null}
          className="flex flex-col items-center justify-center p-4 rounded-xl bg-[#0F1419] hover:bg-[#8B5CF6]/15 border border-[#1E293B] hover:border-[#8B5CF6] transition-all group cursor-pointer"
        >
          {downloadingFormat === 'xml' ? (
            <Loader2 className="w-6 h-6 text-[#8B5CF6] animate-spin mb-2" />
          ) : (
            <FileCode2 className="w-6 h-6 text-[#8B5CF6] group-hover:scale-110 transition-transform mb-2" />
          )}
          <span className="text-xs font-bold text-white">XML Schema</span>
          <span className="text-[10px] text-[#64748B] mt-0.5">{isAr ? 'تغذية وأنظمة قديمة' : 'Feeds & Enterprise'}</span>
        </button>

        {/* HTML Report */}
        <button
          id="export-html-btn"
          onClick={() => handleExport('html')}
          disabled={downloadingFormat !== null}
          className="flex flex-col items-center justify-center p-4 rounded-xl bg-[#0F1419] hover:bg-[#EC4899]/15 border border-[#1E293B] hover:border-[#EC4899] transition-all group cursor-pointer"
        >
          {downloadingFormat === 'html' ? (
            <Loader2 className="w-6 h-6 text-[#EC4899] animate-spin mb-2" />
          ) : (
            <Printer className="w-6 h-6 text-[#EC4899] group-hover:scale-110 transition-transform mb-2" />
          )}
          <span className="text-xs font-bold text-white">HTML Report</span>
          <span className="text-[10px] text-[#64748B] mt-0.5">{isAr ? 'تقرير قابل للطباعة' : 'Standalone & Print'}</span>
        </button>

        {/* Markdown */}
        <button
          id="export-md-btn"
          onClick={() => handleExport('markdown')}
          disabled={downloadingFormat !== null}
          className="flex flex-col items-center justify-center p-4 rounded-xl bg-[#0F1419] hover:bg-[#06B6D4]/15 border border-[#1E293B] hover:border-[#06B6D4] transition-all group cursor-pointer"
        >
          {downloadingFormat === 'markdown' ? (
            <Loader2 className="w-6 h-6 text-[#06B6D4] animate-spin mb-2" />
          ) : (
            <FileText className="w-6 h-6 text-[#06B6D4] group-hover:scale-110 transition-transform mb-2" />
          )}
          <span className="text-xs font-bold text-white">Markdown</span>
          <span className="text-[10px] text-[#64748B] mt-0.5">{isAr ? 'توثيق وجداول' : 'Docs & GitHub'}</span>
        </button>

      </div>
    </div>
  );
};
