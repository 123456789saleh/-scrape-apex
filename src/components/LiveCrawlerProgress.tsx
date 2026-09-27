import React, { useEffect, useState } from 'react';
import { 
  Loader2, 
  Activity, 
  Terminal, 
  ShieldCheck, 
  Database, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Radio
} from 'lucide-react';
import { ScrapeLog } from '../types/scraper.ts';

interface LiveCrawlerProgressProps {
  isScraping: boolean;
  logs: ScrapeLog[];
  url: string;
  lang: 'ar' | 'en';
}

export const LiveCrawlerProgress: React.FC<LiveCrawlerProgressProps> = ({
  isScraping,
  logs,
  url,
  lang
}) => {
  const [elapsed, setElapsed] = useState(0);
  const isAr = lang === 'ar';

  useEffect(() => {
    let timer: any = null;
    if (isScraping) {
      setElapsed(0);
      timer = setInterval(() => {
        setElapsed(prev => prev + 100);
      }, 100);
    }
    return () => clearInterval(timer);
  }, [isScraping]);

  if (!isScraping && logs.length === 0) return null;

  const currentStep = logs.length > 0 ? logs[logs.length - 1].message : (isAr ? 'بدء معالجة الرابط...' : 'Initiating request...');

  return (
    <div className="bg-[#161F2E] border border-[#00D9FF]/30 rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in">
      
      {/* Top Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1E293B] pb-3">
        <div className="flex items-center gap-3">
          {isScraping ? (
            <div className="relative flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-[#00D9FF] animate-spin" />
              <span className="absolute w-2 h-2 rounded-full bg-[#00D9FF]" />
            </div>
          ) : (
            <CheckCircle className="w-5 h-5 text-[#10B981]" />
          )}

          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>{isScraping ? (isAr ? 'محرك الاستخلاص الذكي قيد التشغيل' : 'Active Scraping Pipeline Running') : (isAr ? 'اكتمل الاستخلاص بنجاح' : 'Extraction Pipeline Completed')}</span>
              {isScraping && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00D9FF]/20 text-[#00D9FF] animate-pulse">LIVE</span>}
            </h4>
            <p className="text-xs text-[#94A3B8] font-mono truncate max-w-md">
              {url}
            </p>
          </div>
        </div>

        {/* Speed / Timer Counter */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#0F1419] border border-[#1E293B] text-[#00D9FF]">
            <Clock className="w-3.5 h-3.5" />
            <span>{(elapsed / 1000).toFixed(1)}s</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#0F1419] border border-[#1E293B] text-[#10B981]">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Stream Active</span>
          </div>
        </div>
      </div>

      {/* Progress Bar Animation */}
      {isScraping && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-[#94A3B8]">
            <span className="text-[#00D9FF] font-medium">{currentStep}</span>
            <span>Parsing DOM...</span>
          </div>
          <div className="w-full bg-[#0F1419] rounded-full h-2 overflow-hidden border border-[#1E293B]">
            <div className="bg-gradient-to-r from-[#00D9FF] via-[#0284C7] to-[#10B981] h-full rounded-full animate-pulse transition-all duration-300 w-3/4" />
          </div>
        </div>
      )}

      {/* Live Stream Terminal Logs */}
      <div className="bg-[#0B0F15] border border-[#1E293B] rounded-xl p-3 max-h-36 overflow-y-auto font-mono text-xs space-y-1.5 scrollbar-thin">
        <div className="text-[10px] text-[#64748B] uppercase tracking-wider pb-1 border-b border-[#1E293B]/60 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Terminal className="w-3 h-3 text-[#00D9FF]" />
            Pipeline Engine Logs ({logs.length})
          </span>
          <span>UTF-8 Engine</span>
        </div>

        {logs.map((log) => {
          let color = 'text-[#94A3B8]';
          if (log.level === 'success') color = 'text-[#10B981]';
          if (log.level === 'warn') color = 'text-[#F59E0B]';
          if (log.level === 'error') color = 'text-[#EF4444]';

          return (
            <div key={log.id} className="flex items-start gap-2 leading-relaxed">
              <span className="text-[#64748B] text-[10px] select-none">[{log.timestamp}]</span>
              <span className={`text-[11px] ${color}`}>{log.message}</span>
            </div>
          );
        })}
      </div>

    </div>
  );
};
