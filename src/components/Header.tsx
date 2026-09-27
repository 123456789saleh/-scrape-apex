import React from 'react';
import { 
  Bot, 
  Terminal, 
  BookOpen, 
  Clock, 
  History, 
  Sparkles, 
  Globe, 
  ShieldCheck, 
  Activity,
  Layers
} from 'lucide-react';

interface HeaderProps {
  lang: 'ar' | 'en';
  setLang: (l: 'ar' | 'en') => void;
  onOpenDocs?: () => void;
  onOpenScheduler?: () => void;
  onOpenHistory: () => void;
  activeHistoryCount?: number;
  historyCount?: number;
  isScraping?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  lang,
  setLang,
  onOpenDocs = () => {},
  onOpenScheduler = () => {},
  onOpenHistory,
  activeHistoryCount,
  historyCount,
  isScraping = false
}) => {
  const isAr = lang === 'ar';
  const effectiveHistoryCount = historyCount ?? activeHistoryCount ?? 0;


  return (
    <header className="bg-[#0F1419]/95 backdrop-blur-md border-b border-[#1E293B] sticky top-0 z-40 px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Logo & Brand */}
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#1E3A8A] via-[#0284C7] to-[#00D9FF] p-0.5 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-[#0F1419] rounded-[10px] flex items-center justify-center">
                <Bot className="w-5 h-5 text-[#00D9FF] animate-pulse" />
              </div>
            </div>
            {isScraping && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00D9FF] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00D9FF]"></span>
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                Apex<span className="text-[#00D9FF]">Scrape</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#1E3A8A] text-[#00D9FF] border border-[#00D9FF]/30 tracking-wider">
                  AI PRO
                </span>
              </span>
            </div>
            <p className="text-xs text-[#94A3B8] hidden sm:block">
              {isAr ? 'محرك استخلاص وهيكلة الويب الذكي بالذكاء الاصطناعي' : 'Autonomous High-Performance Web Scraping & AI Extraction Suite'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Engine Status Pill */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#161F2E] border border-[#1E293B] text-xs text-[#94A3B8]">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
            <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
            <span className="text-[#E2E8F0] font-medium">Rotator Engine Active</span>
          </div>

          {/* History Button */}
          <button
            id="header-btn-history"
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161F2E] hover:bg-[#1E293B] border border-[#1E293B] text-xs font-medium text-[#E2E8F0] transition-colors cursor-pointer"
            title={isAr ? 'سجل العمليات السابقة' : 'Scrape History'}
          >
            <History className="w-3.5 h-3.5 text-[#00D9FF]" />
            <span className="hidden sm:inline">{isAr ? 'السجل' : 'History'}</span>
            {effectiveHistoryCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#00D9FF]/20 text-[#00D9FF] text-[10px] font-bold">
                {effectiveHistoryCount}
              </span>
            )}
          </button>

          {/* Scheduler Button */}
          <button
            id="header-btn-scheduler"
            onClick={onOpenScheduler}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161F2E] hover:bg-[#1E293B] border border-[#1E293B] text-xs font-medium text-[#E2E8F0] transition-colors cursor-pointer"
            title={isAr ? 'جدولة المهام والـ Cron' : 'Task Scheduler'}
          >
            <Clock className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span className="hidden sm:inline">{isAr ? 'الجدولة' : 'Schedule'}</span>
          </button>

          {/* Documentation Button */}
          <button
            id="header-btn-docs"
            onClick={onOpenDocs}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161F2E] hover:bg-[#1E293B] border border-[#1E293B] text-xs font-medium text-[#E2E8F0] transition-colors cursor-pointer"
            title={isAr ? 'دليل الاستخدام والأمثلة' : 'Documentation & Cheatsheet'}
          >
            <BookOpen className="w-3.5 h-3.5 text-[#10B981]" />
            <span className="hidden sm:inline">{isAr ? 'التوثيق' : 'Docs'}</span>
          </button>

          {/* Language Toggle */}
          <button
            id="header-btn-lang"
            onClick={() => setLang(isAr ? 'en' : 'ar')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1E3A8A]/40 hover:bg-[#1E3A8A] border border-[#00D9FF]/30 text-xs font-semibold text-[#00D9FF] transition-all cursor-pointer"
            title="Switch Language"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{isAr ? 'English' : 'عربي'}</span>
          </button>

        </div>
      </div>
    </header>
  );
};
