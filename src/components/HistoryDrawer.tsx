import React from 'react';
import { ScrapeResult } from '../types/scraper.ts';
import { 
  History, 
  Trash2, 
  ArrowRight, 
  Clock, 
  Globe, 
  Layers, 
  ShoppingBag, 
  Table, 
  Newspaper,
  CheckCircle,
  Mail
} from 'lucide-react';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: ScrapeResult[];
  onSelectHistory: (item: ScrapeResult) => void;
  onClearHistory: () => void;
  lang: 'ar' | 'en';
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelectHistory,
  onClearHistory,
  lang
}) => {
  if (!isOpen) return null;

  const isAr = lang === 'ar';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#161F2E] border-l border-[#1E293B] p-6 space-y-6 shadow-2xl flex flex-col justify-between">
          
          {/* Drawer Header */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-4">
              <div className="flex items-center gap-2.5">
                <History className="w-5 h-5 text-[#00D9FF]" />
                <h3 className="text-sm font-bold text-white">
                  {isAr ? 'سجل العمليات السابقة (History)' : 'Scraping History & Logs'}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-[#0F1419] text-[#94A3B8] hover:text-white hover:bg-[#1E293B]"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center justify-between text-xs text-[#94A3B8]">
              <span>{history.length} {isAr ? 'عملية محفوظة محلياً' : 'sessions saved'}</span>
              {history.length > 0 && (
                <button
                  onClick={onClearHistory}
                  className="text-[#EF4444] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isAr ? 'مسح السجل' : 'Clear All'}</span>
                </button>
              )}
            </div>
          </div>

          {/* History Item List */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
            {history.length === 0 ? (
              <div className="text-center py-16 text-xs text-[#64748B]">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>{isAr ? 'لا توجد عمليات سابقة بعد.' : 'No scraping history yet.'}</p>
              </div>
            ) : (
              history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectHistory(item);
                    onClose();
                  }}
                  className="group p-3.5 rounded-xl bg-[#0F1419] border border-[#1E293B] hover:border-[#00D9FF] transition-all cursor-pointer space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white truncate max-w-[200px] flex items-center gap-1.5">
                      {item.emails && item.emails.length > 0 ? (
                        <Mail className="w-3.5 h-3.5 text-[#8B5CF6] flex-shrink-0" />
                      ) : (
                        <Globe className="w-3.5 h-3.5 text-[#00D9FF] flex-shrink-0" />
                      )}
                      <span>{item.targetDomain}</span>
                    </span>
                    <span className="text-[10px] font-mono text-[#64748B]">
                      {item.scrapedAt ? new Date(item.scrapedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </span>
                  </div>

                  <p className="text-[11px] font-mono text-[#94A3B8] truncate">
                    {item.url}
                  </p>

                  <div className="flex items-center justify-between text-[10px] pt-2 border-t border-[#1E293B]">
                    <span className="flex items-center gap-1 text-[#00D9FF] font-bold">
                      {item.emails && item.emails.length > 0 ? (
                        <>
                          <span className="text-[#8B5CF6]">📧</span>
                          <span>{item.emails.length.toLocaleString()} {isAr ? 'بريد مستخرج' : 'emails'}</span>
                        </>
                      ) : (
                        <>
                          <Layers className="w-3 h-3" />
                          <span>{item.stats.totalItemsFound} {isAr ? 'عنصر' : 'items'}</span>
                        </>
                      )}
                    </span>
                    <span className="text-[#10B981] font-mono">
                      {(item.stats.durationMs / 1000).toFixed(1)}s
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-[#1E293B]">
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-[#0F1419] hover:bg-[#1E293B] text-xs font-bold text-white transition-colors cursor-pointer"
            >
              {isAr ? 'إغلاق السجل' : 'Close History'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
