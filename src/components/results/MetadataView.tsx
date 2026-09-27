import React, { useState } from 'react';
import { PageMetadata } from '../../types/scraper.ts';
import { 
  Globe, 
  Mail, 
  Phone, 
  Code, 
  Share2, 
  Copy, 
  Check, 
  ExternalLink,
  ShieldCheck,
  Tag
} from 'lucide-react';
import { copyToClipboard } from '../../lib/utils.ts';

interface MetadataViewProps {
  metadata: PageMetadata;
  url: string;
  lang: 'ar' | 'en';
}

export const MetadataView: React.FC<MetadataViewProps> = ({ metadata, url, lang }) => {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const isAr = lang === 'ar';

  const handleCopy = (text: string, id: string) => {
    copyToClipboard(text);
    setCopiedItem(id);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Contact Information Cards */}
      {(metadata.emails.length > 0 || metadata.phoneNumbers.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Emails */}
          {metadata.emails.length > 0 && (
            <div className="bg-[#0F1419] p-4 rounded-xl border border-[#1E293B] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#00D9FF] flex items-center gap-1.5">
                  <Mail className="w-4 h-4" />
                  {isAr ? 'عناوين البريد الإلكتروني المكتشفة:' : 'Discovered Emails:'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#161F2E] text-[#94A3B8]">
                  {metadata.emails.length}
                </span>
              </div>
              <div className="space-y-1.5">
                {metadata.emails.map((email, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-[#161F2E] text-xs font-mono text-white">
                    <span className="truncate">{email}</span>
                    <button
                      onClick={() => handleCopy(email, `email-${idx}`)}
                      className="text-[#64748B] hover:text-[#00D9FF] p-1"
                    >
                      {copiedItem === `email-${idx}` ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Phone Numbers */}
          {metadata.phoneNumbers.length > 0 && (
            <div className="bg-[#0F1419] p-4 rounded-xl border border-[#1E293B] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#10B981] flex items-center gap-1.5">
                  <Phone className="w-4 h-4" />
                  {isAr ? 'أرقام الهواتف والتواصل المكتشفة:' : 'Discovered Phone Numbers:'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#161F2E] text-[#94A3B8]">
                  {metadata.phoneNumbers.length}
                </span>
              </div>
              <div className="space-y-1.5">
                {metadata.phoneNumbers.map((phone, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-[#161F2E] text-xs font-mono text-white">
                    <span className="truncate">{phone}</span>
                    <button
                      onClick={() => handleCopy(phone, `phone-${idx}`)}
                      className="text-[#64748B] hover:text-[#10B981] p-1"
                    >
                      {copiedItem === `phone-${idx}` ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* OpenGraph & Social Preview Card */}
      <div className="bg-[#0F1419] p-5 rounded-xl border border-[#1E293B] space-y-4">
        <h4 className="text-xs font-bold text-[#E2E8F0] uppercase tracking-wider flex items-center gap-2">
          <Share2 className="w-4 h-4 text-[#00D9FF]" />
          <span>{isAr ? 'معاينة بطاقة المشاركة الاجتماعية (OpenGraph / Social Card):' : 'Social OpenGraph Preview:'}</span>
        </h4>

        <div className="max-w-xl rounded-xl border border-[#1E293B] bg-[#161F2E] overflow-hidden shadow-lg">
          {metadata.ogImage && (
            <div className="h-48 bg-[#0B0F15] overflow-hidden">
              <img src={metadata.ogImage} alt="OG Image" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="p-4 space-y-2">
            <span className="text-[10px] font-mono text-[#64748B] uppercase block">
              {new URL(url).hostname}
            </span>
            <h5 className="text-sm font-bold text-white leading-snug">
              {metadata.title || 'Page Title'}
            </h5>
            <p className="text-xs text-[#94A3B8] line-clamp-2 leading-relaxed">
              {metadata.description || 'No description meta tag provided.'}
            </p>
          </div>
        </div>
      </div>

      {/* SEO Raw Meta Tags Table */}
      <div className="bg-[#0F1419] p-5 rounded-xl border border-[#1E293B] space-y-3">
        <h4 className="text-xs font-bold text-[#E2E8F0] uppercase tracking-wider flex items-center gap-2">
          <Globe className="w-4 h-4 text-[#F59E0B]" />
          <span>{isAr ? 'بيانات الـ SEO والـ Meta Tags:' : 'Standard SEO Metadata:'}</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-lg bg-[#161F2E] border border-[#1E293B]">
            <span className="text-[#64748B] block text-[10px]">Title Tag</span>
            <span className="text-white font-medium">{metadata.title || 'N/A'}</span>
          </div>

          <div className="p-2.5 rounded-lg bg-[#161F2E] border border-[#1E293B]">
            <span className="text-[#64748B] block text-[10px]">Canonical URL</span>
            <span className="text-[#00D9FF] font-mono truncate block">{metadata.canonicalUrl || url}</span>
          </div>

          <div className="p-2.5 rounded-lg bg-[#161F2E] border border-[#1E293B]">
            <span className="text-[#64748B] block text-[10px]">Language</span>
            <span className="text-white font-medium">{metadata.language || 'ar/en'}</span>
          </div>

          <div className="p-2.5 rounded-lg bg-[#161F2E] border border-[#1E293B]">
            <span className="text-[#64748B] block text-[10px]">OG Type</span>
            <span className="text-white font-medium">{metadata.ogType || 'website'}</span>
          </div>
        </div>
      </div>

      {/* JSON-LD Schema.org Data */}
      {metadata.jsonLd && metadata.jsonLd.length > 0 && (
        <div className="bg-[#0F1419] p-5 rounded-xl border border-[#1E293B] space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-[#E2E8F0] uppercase tracking-wider flex items-center gap-2">
              <Code className="w-4 h-4 text-[#00D9FF]" />
              <span>{isAr ? 'البيانات المنظمة (Schema.org / JSON-LD):' : 'Structured Data (Schema.org / JSON-LD):'}</span>
            </h4>
            <span className="text-xs text-[#00D9FF] font-mono">
              {metadata.jsonLd.length} Schemas
            </span>
          </div>

          <pre className="bg-[#0B0F15] p-4 rounded-xl border border-[#1E293B] text-[11px] font-mono text-[#00D9FF] max-h-72 overflow-y-auto scrollbar-thin">
            {JSON.stringify(metadata.jsonLd, null, 2)}
          </pre>
        </div>
      )}

    </div>
  );
};
