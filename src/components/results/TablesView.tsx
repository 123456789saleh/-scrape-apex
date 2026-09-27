import React, { useState } from 'react';
import { ExtractedTable } from '../../types/scraper.ts';
import { 
  Table as TableIcon, 
  Download, 
  Search, 
  ArrowUpDown, 
  Copy, 
  FileSpreadsheet, 
  Layers, 
  Check,
  Edit2
} from 'lucide-react';
import { copyToClipboard } from '../../lib/utils.ts';

interface TablesViewProps {
  tables: ExtractedTable[];
  lang: 'ar' | 'en';
}

export const TablesView: React.FC<TablesViewProps> = ({ tables, lang }) => {
  const [activeTableIdx, setActiveTableIdx] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [copied, setCopied] = useState(false);

  const isAr = lang === 'ar';

  if (tables.length === 0) {
    return (
      <div className="text-center py-16 px-4 text-[#94A3B8] bg-[#0F1419] rounded-xl border border-[#1E293B]">
        <TableIcon className="w-10 h-10 text-[#64748B] mx-auto mb-3" />
        <p className="text-sm font-medium">{isAr ? 'لم يتم العثور على جداول HTML في هذه الصفحة' : 'No HTML data tables found in this page.'}</p>
        <p className="text-xs text-[#64748B] mt-1">{isAr ? 'تأكد من وجود عناصر <table> أو استخدم محددات مخصصة' : 'Ensure target webpage has <table> elements or use custom selectors.'}</p>
      </div>
    );
  }

  const currentTable = tables[activeTableIdx] || tables[0];

  // Sorting and filtering
  let filteredRows = currentTable.rows.filter(row => {
    if (!searchQuery) return true;
    return row.some(cell => String(cell).toLowerCase().includes(searchQuery.toLowerCase()));
  });

  if (sortCol !== null) {
    filteredRows = [...filteredRows].sort((a, b) => {
      const valA = a[sortCol];
      const valB = b[sortCol];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDir === 'asc' ? valA - valB : valB - valA;
      }
      return sortDir === 'asc' 
        ? String(valA).localeCompare(String(valB)) 
        : String(valB).localeCompare(String(valA));
    });
  }

  const handleSort = (idx: number) => {
    if (sortCol === idx) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(idx);
      setSortDir('asc');
    }
  };

  const handleCopyCsv = () => {
    const csv = [
      currentTable.headers.join(','),
      ...currentTable.rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    copyToClipboard(csv);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      
      {/* Table Tabs if multiple */}
      {tables.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {tables.map((t, idx) => (
            <button
              key={t.id}
              onClick={() => {
                setActiveTableIdx(idx);
                setSortCol(null);
                setSearchQuery('');
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                activeTableIdx === idx
                  ? 'bg-[#00D9FF]/15 border-[#00D9FF] text-[#00D9FF]'
                  : 'bg-[#0F1419] border-[#1E293B] text-[#94A3B8] hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{t.title || `${isAr ? 'جدول' : 'Table'} #${idx + 1}`}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#1E293B] text-[#E2E8F0] font-mono">
                {t.rowCount}x{t.columnCount}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0F1419] p-3 rounded-xl border border-[#1E293B]">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder={isAr ? "بحث وتصفية في خلايا الجدول..." : "Search and filter rows..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#161F2E] border border-[#1E293B] focus:border-[#00D9FF] rounded-lg px-3 py-2 pl-9 text-xs text-white placeholder-[#64748B] outline-none"
          />
          <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#161F2E] hover:bg-[#1E293B] text-xs font-semibold text-[#E2E8F0] border border-[#1E293B] transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5 text-[#00D9FF]" />}
            <span>{copied ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ كـ CSV' : 'Copy CSV')}</span>
          </button>
        </div>
      </div>

      {/* Interactive Table Container */}
      <div className="bg-[#0F1419] border border-[#1E293B] rounded-xl overflow-x-auto max-h-[600px] scrollbar-thin">
        <table className="w-full text-xs text-right text-[#E2E8F0]">
          <thead className="bg-[#161F2E] text-[#94A3B8] font-bold sticky top-0 z-10 border-b border-[#1E293B] shadow-sm">
            <tr>
              <th className="p-3 text-center w-12 text-[#64748B]">#</th>
              {currentTable.headers.map((header, idx) => (
                <th
                  key={idx}
                  onClick={() => handleSort(idx)}
                  className="p-3 hover:text-[#00D9FF] cursor-pointer transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span>{header || `Column ${idx + 1}`}</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortCol === idx ? 'text-[#00D9FF]' : 'text-[#64748B]'}`} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1E293B]">
            {filteredRows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-[#161F2E]/60 transition-colors">
                <td className="p-3 text-center text-[#64748B] font-mono text-[10px]">{rIdx + 1}</td>
                {currentTable.headers.map((_, cIdx) => {
                  const val = row[cIdx] !== undefined ? row[cIdx] : '';
                  const isNumber = typeof val === 'number';
                  return (
                    <td
                      key={cIdx}
                      className={`p-3 font-medium ${isNumber ? 'font-mono text-[#00D9FF]' : ''}`}
                    >
                      {String(val)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center text-xs text-[#64748B] px-1">
        <span>{isAr ? `إجمالي الصفوف المعروضة: ${filteredRows.length}` : `Total rows displayed: ${filteredRows.length}`}</span>
        <span>{isAr ? `الأعمدة: ${currentTable.columnCount}` : `Columns: ${currentTable.columnCount}`}</span>
      </div>

    </div>
  );
};
