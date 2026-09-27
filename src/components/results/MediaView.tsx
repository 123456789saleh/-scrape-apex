import React, { useState } from 'react';
import { ExtractedMedia } from '../../types/scraper.ts';
import { 
  Image as ImageIcon, 
  FileText, 
  Download, 
  ExternalLink, 
  Copy, 
  Check, 
  Eye, 
  Maximize2,
  FileArchive
} from 'lucide-react';
import { copyToClipboard } from '../../lib/utils.ts';

interface MediaViewProps {
  media: ExtractedMedia[];
  lang: 'ar' | 'en';
}

export const MediaView: React.FC<MediaViewProps> = ({ media, lang }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'image' | 'document'>('all');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const isAr = lang === 'ar';

  const images = media.filter(m => m.type === 'image');
  const documents = media.filter(m => m.type === 'document');

  const filteredMedia = activeTab === 'all' ? media : media.filter(m => m.type === activeTab);

  const handleCopy = (m: ExtractedMedia) => {
    copyToClipboard(m.url);
    setCopiedId(m.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadDirect = (url: string, filename?: string) => {
    const a = document.createElement('a');
    a.href = `/api/proxy-image?url=${encodeURIComponent(url)}`;
    a.download = filename || 'downloaded-asset';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (media.length === 0) {
    return (
      <div className="text-center py-16 px-4 text-[#94A3B8] bg-[#0F1419] rounded-xl border border-[#1E293B]">
        <ImageIcon className="w-10 h-10 text-[#64748B] mx-auto mb-3" />
        <p className="text-sm font-medium">{isAr ? 'لم يتم العثور على وسائط أو ملفات في الصفحة' : 'No images or downloadable documents found.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Media Type Tabs */}
      <div className="flex items-center justify-between gap-3 bg-[#0F1419] p-3 rounded-xl border border-[#1E293B]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'all' ? 'bg-[#00D9FF] text-[#0F1419]' : 'bg-[#161F2E] text-[#94A3B8] hover:text-white'
            }`}
          >
            {isAr ? 'الكل' : 'All Media'} ({media.length})
          </button>
          <button
            onClick={() => setActiveTab('image')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'image' ? 'bg-[#00D9FF] text-[#0F1419]' : 'bg-[#161F2E] text-[#94A3B8] hover:text-white'
            }`}
          >
            {isAr ? 'الصور' : 'Images'} ({images.length})
          </button>
          <button
            onClick={() => setActiveTab('document')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'document' ? 'bg-[#00D9FF] text-[#0F1419]' : 'bg-[#161F2E] text-[#94A3B8] hover:text-white'
            }`}
          >
            {isAr ? 'المستندات والملفات' : 'Documents'} ({documents.length})
          </button>
        </div>

        <span className="text-xs text-[#64748B] hidden sm:block">
          {isAr ? 'يمكنك التحميل المباشر أو المعاينة' : 'Direct download & inspect enabled'}
        </span>
      </div>

      {/* Documents Section if any */}
      {(activeTab === 'all' || activeTab === 'document') && documents.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-[#E2E8F0] uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#10B981]" />
            <span>{isAr ? 'الملفات والمستندات القابلة للتحميل (PDF / XLSX / ZIP):' : 'Downloadable Documents & Assets:'}</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {documents.map((doc) => (
              <div key={doc.id} className="p-3.5 rounded-xl bg-[#0F1419] border border-[#1E293B] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-9 h-9 rounded-lg bg-[#161F2E] flex items-center justify-center text-[#10B981] flex-shrink-0">
                    <FileArchive className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden">
                    <span className="text-xs font-bold text-white block truncate" title={doc.filename || doc.url}>
                      {doc.filename || 'Document File'}
                    </span>
                    <span className="text-[10px] text-[#64748B] uppercase">{doc.mimeType || 'Download File'}</span>
                  </div>
                </div>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="p-2 rounded-lg bg-[#1E3A8A] text-[#00D9FF] hover:bg-[#00D9FF] hover:text-[#0F1419] transition-all flex-shrink-0"
                  title="Download File"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Images Grid */}
      {(activeTab === 'all' || activeTab === 'image') && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {images.map((img) => (
            <div
              key={img.id}
              className="group bg-[#0F1419] border border-[#1E293B] hover:border-[#00D9FF]/50 rounded-xl overflow-hidden flex flex-col justify-between transition-all relative"
            >
              {/* Image box */}
              <div className="relative h-32 bg-[#161F2E] overflow-hidden flex items-center justify-center p-2">
                <img
                  src={img.url}
                  alt={img.altText || ''}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />

                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => setPreviewImage(img.url)}
                    className="p-1.5 rounded-lg bg-[#0F1419] text-white hover:text-[#00D9FF]"
                    title="Zoom Preview"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDownloadDirect(img.url, `image-${img.id}.jpg`)}
                    className="p-1.5 rounded-lg bg-[#0F1419] text-white hover:text-[#10B981]"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Card Footer info */}
              <div className="p-2 bg-[#0F1419] flex items-center justify-between text-[10px] text-[#94A3B8] border-t border-[#1E293B]">
                <span className="truncate max-w-[80px]" title={img.altText || img.url}>
                  {img.dimensions || 'auto'}
                </span>
                <button
                  onClick={() => handleCopy(img)}
                  className="text-[#64748B] hover:text-[#00D9FF]"
                  title="Copy URL"
                >
                  {copiedId === img.id ? <Check className="w-3 h-3 text-[#10B981]" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Image Preview Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md cursor-pointer animate-in fade-in"
        >
          <div className="relative max-w-4xl max-h-[85vh] bg-[#161F2E] p-2 rounded-2xl border border-[#1E293B] shadow-2xl">
            <img src={previewImage} alt="Preview" className="max-w-full max-h-[80vh] object-contain rounded-xl" />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 bg-black/70 text-white rounded-full p-2 hover:bg-black"
            >
              ✕
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
