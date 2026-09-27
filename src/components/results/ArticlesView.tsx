import React, { useState } from 'react';
import { ExtractedArticle } from '../../types/scraper.ts';
import { 
  Newspaper, 
  Clock, 
  User, 
  Calendar, 
  Tag, 
  Copy, 
  Check, 
  BookOpen, 
  ExternalLink,
  AlignRight
} from 'lucide-react';
import { copyToClipboard } from '../../lib/utils.ts';

interface ArticlesViewProps {
  articles: ExtractedArticle[];
  lang: 'ar' | 'en';
}

export const ArticlesView: React.FC<ArticlesViewProps> = ({ articles, lang }) => {
  const [copied, setCopied] = useState(false);
  const isAr = lang === 'ar';

  if (articles.length === 0) {
    return (
      <div className="text-center py-16 px-4 text-[#94A3B8] bg-[#0F1419] rounded-xl border border-[#1E293B]">
        <Newspaper className="w-10 h-10 text-[#64748B] mx-auto mb-3" />
        <p className="text-sm font-medium">{isAr ? 'لم يتم العثور على مقالات أو نصوص مهيكلة' : 'No structured articles or paragraphs found.'}</p>
      </div>
    );
  }

  const article = articles[0];

  const handleCopyText = () => {
    copyToClipboard(article.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#0F1419] border border-[#1E293B] rounded-2xl p-6 space-y-6 max-w-4xl mx-auto">
      
      {/* Header Info */}
      <div className="space-y-3 border-b border-[#1E293B] pb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-[#1E3A8A] text-[#00D9FF] text-xs font-bold flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              {isAr ? 'مقال مستخرج' : 'Extracted Article'}
            </span>
            <span className="text-xs text-[#94A3B8] font-mono flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#F59E0B]" />
              {article.readingTimeMinutes} {isAr ? 'دقيقة قراءة' : 'min read'}
            </span>
            <span className="text-xs text-[#94A3B8] font-mono">
              ({article.wordCount} {isAr ? 'كلمة' : 'words'})
            </span>
          </div>

          <button
            onClick={handleCopyText}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161F2E] hover:bg-[#1E293B] text-xs font-semibold text-[#E2E8F0] border border-[#1E293B] transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5 text-[#00D9FF]" />}
            <span>{copied ? (isAr ? 'تم نسخ النص!' : 'Copied!') : (isAr ? 'نسخ النص بالكامل' : 'Copy Full Article')}</span>
          </button>
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
          {article.title}
        </h2>

        <div className="flex flex-wrap items-center gap-4 text-xs text-[#94A3B8]">
          {article.author && (
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#00D9FF]" />
              {article.author}
            </span>
          )}
          {article.publishedDate && (
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#10B981]" />
              {article.publishedDate}
            </span>
          )}
        </div>
      </div>

      {/* Banner Image if available */}
      {article.bannerImage && (
        <div className="rounded-xl overflow-hidden max-h-80 bg-[#161F2E] border border-[#1E293B]">
          <img src={article.bannerImage} alt={article.title} className="w-full h-full object-cover" />
        </div>
      )}

      {/* AI Summary Highlight Card */}
      {article.summary && (
        <div className="p-4 rounded-xl bg-[#161F2E] border-r-4 border-r-[#00D9FF] border border-[#1E293B] space-y-1.5">
          <span className="text-[11px] font-bold text-[#00D9FF] uppercase tracking-wider block">
            {isAr ? 'الملخص التنفيذي المستخرج:' : 'Executive Summary:'}
          </span>
          <p className="text-xs text-[#E2E8F0] leading-relaxed">
            {article.summary}
          </p>
        </div>
      )}

      {/* Paragraphs body */}
      <div className="space-y-4 text-sm text-[#E2E8F0] leading-relaxed">
        {article.paragraphs.map((p, idx) => (
          <p key={idx} className="bg-[#161F2E]/40 p-3 rounded-lg border border-[#1E293B]/40 hover:border-[#1E293B] transition-colors">
            {p}
          </p>
        ))}
      </div>

      {/* Tags list */}
      {article.tags && article.tags.length > 0 && (
        <div className="pt-4 border-t border-[#1E293B] flex items-center gap-2 flex-wrap">
          <Tag className="w-3.5 h-3.5 text-[#64748B]" />
          {article.tags.map((tag, idx) => (
            <span key={idx} className="px-2 py-0.5 rounded bg-[#161F2E] text-[11px] text-[#94A3B8] border border-[#1E293B]">
              #{tag}
            </span>
          ))}
        </div>
      )}

    </div>
  );
};
