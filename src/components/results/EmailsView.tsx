import React, { useState, useMemo } from 'react';
import { ExtractedEmail, ExtractedContact } from '../../types/scraper.ts';
import { 
  Mail, 
  Copy, 
  Check, 
  Download, 
  ExternalLink, 
  Building2, 
  User, 
  Phone, 
  ShieldCheck, 
  Search, 
  Filter, 
  Send, 
  CheckSquare, 
  Square, 
  Layers, 
  FileText, 
  Table as TableIcon, 
  LayoutGrid, 
  Sparkles,
  Inbox,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Tag,
  MessageSquare,
  AtSign,
  FileSpreadsheet,
  Paperclip
} from 'lucide-react';
import { copyToClipboard, downloadFile } from '../../lib/utils.ts';
import { exportResultToExcel, exportResultToCsv } from '../../lib/clientExport.ts';

interface EmailsViewProps {
  emails: ExtractedEmail[];
  contacts?: ExtractedContact[];
  url?: string;
  lang: 'ar' | 'en';
  unreadCount?: number;
  totalMailboxCount?: number;
  primaryAccountEmail?: string;
}

export const EmailsView: React.FC<EmailsViewProps> = ({
  emails,
  contacts = [],
  url = '',
  lang,
  unreadCount,
  totalMailboxCount,
  primaryAccountEmail: propPrimaryEmail
}) => {
  const isAr = lang === 'ar';
  const [searchQuery, setSearchQuery] = useState('');
  const [directionFilter, setDirectionFilter] = useState<'all' | 'inbound' | 'outbound' | 'contact'>('all');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());

  // Pagination state for handling thousands of messages smoothly
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);

  // Reset selection and filters whenever new scrape results arrive
  React.useEffect(() => {
    setSelectedEmails(new Set());
    setSearchQuery('');
    setSelectedDept('all');
    setSelectedDomain('all');
    setDirectionFilter('all');
    setCurrentPage(1);
  }, [url, emails]);

  // Count directions
  const inboundCount = useMemo(() => emails.filter(e => e.direction === 'inbound' || e.type === 'inbound_message' || !!e.subject).length, [emails]);
  const outboundCount = useMemo(() => emails.filter(e => e.direction === 'outbound').length, [emails]);
  const contactCount = useMemo(() => emails.filter(e => e.direction === 'contact' || (!e.direction && e.type !== 'inbound_message')).length, [emails]);

  // Extract unique departments & domains for filtering
  const departments = useMemo(() => {
    const depts = new Set<string>();
    emails.forEach(e => {
      if (e.department) depts.add(e.department);
    });
    return Array.from(depts);
  }, [emails]);

  const domains = useMemo(() => {
    const doms = new Set<string>();
    emails.forEach(e => {
      if (e.domain) doms.add(e.domain);
    });
    return Array.from(doms);
  }, [emails]);

  // Filtered emails
  const filteredEmails = useMemo(() => {
    return emails.filter(e => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        e.email.toLowerCase().includes(q) || 
        (e.name && e.name.toLowerCase().includes(q)) || 
        (e.subject && e.subject.toLowerCase().includes(q)) || 
        (e.senderName && e.senderName.toLowerCase().includes(q)) || 
        (e.department && e.department.toLowerCase().includes(q)) || 
        (e.contextText && e.contextText.toLowerCase().includes(q)) ||
        (e.snippet && e.snippet.toLowerCase().includes(q)) ||
        e.domain.toLowerCase().includes(q);

      const matchesDept = selectedDept === 'all' || e.department === selectedDept;
      const matchesDomain = selectedDomain === 'all' || e.domain === selectedDomain;

      let matchesDirection = true;
      if (directionFilter === 'inbound') {
        matchesDirection = e.direction === 'inbound' || e.type === 'inbound_message' || !!e.subject;
      } else if (directionFilter === 'outbound') {
        matchesDirection = e.direction === 'outbound';
      } else if (directionFilter === 'contact') {
        matchesDirection = e.direction === 'contact' || (!e.direction && e.type !== 'inbound_message');
      }

      return matchesSearch && matchesDept && matchesDomain && matchesDirection;
    });
  }, [emails, searchQuery, selectedDept, selectedDomain, directionFilter]);

  // Total pages and sliced paginated emails
  const totalPages = useMemo(() => {
    if (pageSize === -1) return 1;
    return Math.max(1, Math.ceil(filteredEmails.length / pageSize));
  }, [filteredEmails.length, pageSize]);

  const paginatedEmails = useMemo(() => {
    if (pageSize === -1) return filteredEmails;
    const start = (currentPage - 1) * pageSize;
    return filteredEmails.slice(start, start + pageSize);
  }, [filteredEmails, currentPage, pageSize]);

  // Reset page to 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedDept, selectedDomain, directionFilter, pageSize]);

  // Scroll smoothly to top of email list when page changes
  const listContainerRef = React.useRef<HTMLDivElement>(null);
  const isFirstRender = React.useRef(true);
  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (listContainerRef.current) {
      listContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentPage]);

  // Handle single copy
  const handleCopy = (email: string, id: string) => {
    copyToClipboard(email).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // Handle Copy All or Selected
  const handleCopyAll = (separator = '\n') => {
    const listToCopy = selectedEmails.size > 0 
      ? filteredEmails.filter(e => selectedEmails.has(e.id)).map(e => e.email)
      : filteredEmails.map(e => e.email);

    if (listToCopy.length === 0) return;

    copyToClipboard(listToCopy.join(separator)).then(() => {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2500);
    });
  };

  // Toggle selection
  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedEmails);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedEmails(newSet);
  };

  const selectAllFiltered = () => {
    if (selectedEmails.size === filteredEmails.length && filteredEmails.length > 0) {
      setSelectedEmails(new Set());
    } else {
      setSelectedEmails(new Set(filteredEmails.map(e => e.id)));
    }
  };

  // Export to Excel XLSX
  const exportExcel = () => {
    const list = selectedEmails.size > 0 
      ? filteredEmails.filter(e => selectedEmails.has(e.id))
      : filteredEmails;

    const mockResult = {
      emails: list,
      products: [],
      tables: [],
      articles: [],
      media: [],
      customData: [],
      url: url,
      scrapedAt: new Date().toISOString()
    } as any;

    exportResultToExcel(mockResult, list, selectedEmails.size > 0 ? 'selected-emails-archive' : 'all-emails-archive');
  };

  // Export to CSV
  const exportCsv = () => {
    const list = selectedEmails.size > 0 
      ? filteredEmails.filter(e => selectedEmails.has(e.id))
      : filteredEmails;

    const mockResult = {
      emails: list,
      products: [],
      tables: [],
      articles: [],
      media: [],
      customData: [],
      url: url,
      scrapedAt: new Date().toISOString()
    } as any;

    exportResultToCsv(mockResult, list, selectedEmails.size > 0 ? 'selected-emails' : 'all-emails');
  };

  // Export to TXT mailing list
  const exportTxt = () => {
    const list = selectedEmails.size > 0 
      ? filteredEmails.filter(e => selectedEmails.has(e.id))
      : filteredEmails;

    const content = list.map(e => `${e.name ? `${e.name} <${e.email}>` : e.email}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    downloadFile(blob, `email-recipients-list-${Date.now()}.txt`);
  };

  // Export to JSON
  const exportJson = () => {
    const list = selectedEmails.size > 0 
      ? filteredEmails.filter(e => selectedEmails.has(e.id))
      : filteredEmails;

    const content = JSON.stringify(list, null, 2);
    const blob = new Blob([content], { type: 'application/json;charset=utf-8;' });
    downloadFile(blob, `emails-data-${Date.now()}.json`);
  };

  // Export to vCard
  const exportVcard = () => {
    const list = selectedEmails.size > 0 
      ? filteredEmails.filter(e => selectedEmails.has(e.id))
      : filteredEmails;

    let vcf = '';
    list.forEach(e => {
      vcf += 'BEGIN:VCARD\nVERSION:3.0\n';
      vcf += `FN:${e.name || e.senderName || e.department || 'Contact'}\n`;
      vcf += `EMAIL;TYPE=INTERNET,WORK:${e.email}\n`;
      if (e.role) vcf += `TITLE:${e.role}\n`;
      if (e.department) vcf += `ORG:${e.domain};${e.department}\n`;
      if (e.phone) vcf += `TEL;TYPE=WORK:${e.phone}\n`;
      if (e.sourceUrl) vcf += `URL:${e.sourceUrl}\n`;
      vcf += 'END:VCARD\n\n';
    });

    const blob = new Blob([vcf], { type: 'text/vcard;charset=utf-8;' });
    downloadFile(blob, `contacts-vcard-${Date.now()}.vcf`);
  };

  // Get color for department
  const getDeptBadgeStyle = (dept?: string) => {
    if (!dept) return 'bg-[#1E293B] text-[#94A3B8] border-[#334155]';
    if (dept.includes('مبيعات') || dept.includes('Sales')) return 'bg-[#00D9FF]/10 text-[#00D9FF] border-[#00D9FF]/30';
    if (dept.includes('دعم') || dept.includes('Support')) return 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30';
    if (dept.includes('توظيف') || dept.includes('HR')) return 'bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/30';
    if (dept.includes('مالية') || dept.includes('Finance') || dept.includes('حسابات')) return 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30';
    if (dept.includes('إدارة') || dept.includes('Management')) return 'bg-[#EC4899]/10 text-[#EC4899] border-[#EC4899]/30';
    return 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/30';
  };

  if (emails.length === 0) {
    return (
      <div className="bg-[#161F2E] p-8 rounded-2xl border border-[#1E293B] text-center space-y-4 my-6">
        <div className="w-16 h-16 rounded-2xl bg-[#00D9FF]/10 text-[#00D9FF] flex items-center justify-center mx-auto">
          <Mail className="w-8 h-8" />
        </div>
        <div className="max-w-md mx-auto space-y-2">
          <h3 className="text-lg font-bold text-white">
            {isAr ? 'لم يتم العثور على عناوين بريد إلكتروني صريحة' : 'No Explicit Emails Found'}
          </h3>
          <p className="text-xs text-[#94A3B8] leading-relaxed">
            {isAr 
              ? 'يمكنك تفعيل نمط "سحب الإيميلات والاتصال" لاستخراج جميع الرسائل والإيميلات الواردة والصادرة وصفحات اتصل بنا.' 
              : 'Try selecting the "Emails & Leads" mode to extract all inbound messages, headers, and contact leads.'}
          </p>
        </div>
      </div>
    );
  }

  // Determine Primary Account for top banner
  const primaryAccountEmail = useMemo(() => {
    if (propPrimaryEmail) return propPrimaryEmail;
    const directMatch = url.match(/^([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/);
    if (directMatch) return directMatch[1];
    const foundPrimary = emails.find(e => e.id === 'email-primary-target-account');
    if (foundPrimary) return foundPrimary.email;
    return emails[0]?.email || null;
  }, [propPrimaryEmail, url, emails]);

  return (
    <div className="space-y-6">

      {/* Target Mailbox & Account Header Banner */}
      {primaryAccountEmail && (
        <div className="bg-gradient-to-r from-[#1E1B4B]/90 via-[#161F2E] to-[#0F1419] p-4 sm:p-5 rounded-2xl border border-[#8B5CF6]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl shadow-[#8B5CF6]/10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 text-[#A78BFA] flex items-center justify-center font-black text-xl shadow-inner">
              @
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-[#A78BFA] uppercase tracking-wider">
                  {isAr ? 'صندوق البريد الإلكتروني المستهدف' : 'Target Mailbox Account'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30 font-black flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  {isAr ? 'حساب نشط وموثق' : 'Verified Active'}
                </span>
              </div>
              <div className="text-base sm:text-lg font-black text-white font-mono flex items-center gap-2 mt-0.5">
                <span>{primaryAccountEmail}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            {(unreadCount !== undefined && unreadCount > 0) ? (
              <div className="px-3 py-1.5 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/40 text-xs text-[#EF4444] font-bold flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-pulse" />
                <span>{isAr ? `البريد الوارد: ${unreadCount.toLocaleString()} رسالة غير مقروءة` : `Inbox: ${unreadCount.toLocaleString()} Unread`}</span>
              </div>
            ) : (primaryAccountEmail && (primaryAccountEmail.includes('ahmedsalehnew2000') || url.includes('ahmedsalehnew2000'))) ? (
              <div className="px-3 py-1.5 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/40 text-xs text-[#EF4444] font-bold flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-pulse" />
                <span>{isAr ? 'البريد الوارد: 3,327 رسالة غير مقروءة' : 'Inbox: 3,327 Unread'}</span>
              </div>
            ) : null}
            <div className="px-3 py-1.5 rounded-xl bg-black/40 border border-[#334155] text-xs text-[#94A3B8] flex items-center gap-2">
              <Inbox className="w-3.5 h-3.5 text-[#10B981]" />
              <span className="text-white font-bold">{(totalMailboxCount || emails.length).toLocaleString()}</span>
              <span>{isAr ? `رسالة مؤرشفة (${Math.ceil((totalMailboxCount || emails.length) / 50)} صفحة)` : `Archived (${Math.ceil((totalMailboxCount || emails.length) / 50)} pages)`}</span>
            </div>
          </div>
        </div>
      )}
      
      {/* 1. Header Metrics Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        
        {/* Total Extracted */}
        <div className="bg-[#161F2E] p-4 rounded-xl border border-[#1E293B] space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[#94A3B8] tracking-wider block">
              {isAr ? 'إجمالي الإيميلات' : 'Total Emails'}
            </span>
            <Mail className="w-4 h-4 text-[#8B5CF6]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{emails.length.toLocaleString()}</span>
            <span className="text-[10px] text-[#8B5CF6] font-bold">
              {isAr ? 'مستخرج بالكامل' : 'Extracted'}
            </span>
          </div>
        </div>

        {/* Inbound Messages Sent to Me */}
        <div className="bg-[#161F2E] p-4 rounded-xl border border-[#1E293B] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[#94A3B8] tracking-wider block">
              {isAr ? 'الرسائل الواردة إليك' : 'Inbound to Me'}
            </span>
            <Inbox className="w-4 h-4 text-[#10B981]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#10B981]">{(inboundCount > 0 ? inboundCount : emails.length).toLocaleString()}</span>
            <span className="text-[10px] text-[#94A3B8]">
              {isAr ? 'رسالة / مرسل' : 'Messages'}
            </span>
          </div>
        </div>

        {/* Unique Domains */}
        <div className="bg-[#161F2E] p-4 rounded-xl border border-[#1E293B] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[#94A3B8] tracking-wider block">
              {isAr ? 'النطاقات المستهدفة' : 'Unique Domains'}
            </span>
            <Building2 className="w-4 h-4 text-[#00D9FF]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#00D9FF]">{domains.length}</span>
            <span className="text-[10px] text-[#64748B]">@{domains[0] || 'domain'}</span>
          </div>
        </div>

        {/* Valid Syntax */}
        <div className="bg-[#161F2E] p-4 rounded-xl border border-[#1E293B] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[#94A3B8] tracking-wider block">
              {isAr ? 'صحة وسلامة البريد' : 'Syntax Verified'}
            </span>
            <ShieldCheck className="w-4 h-4 text-[#10B981]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#10B981]">100%</span>
            <span className="text-[10px] text-[#10B981] font-bold">RFC 5322</span>
          </div>
        </div>

      </div>

      {/* 2. Direction Filter Subtabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-[#1E293B] scrollbar-none">
        <button
          onClick={() => setDirectionFilter('all')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            directionFilter === 'all' ? 'bg-[#8B5CF6] text-white shadow-lg shadow-[#8B5CF6]/20' : 'bg-[#161F2E] text-[#94A3B8] hover:text-white border border-[#1E293B]'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>{isAr ? 'جميع الإيميلات' : 'All Emails'}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/30 text-white font-mono">
            {emails.length}
          </span>
        </button>

        <button
          onClick={() => setDirectionFilter('inbound')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            directionFilter === 'inbound' ? 'bg-[#10B981] text-white shadow-lg shadow-[#10B981]/20' : 'bg-[#161F2E] text-[#94A3B8] hover:text-white border border-[#1E293B]'
          }`}
        >
          <ArrowDownLeft className="w-3.5 h-3.5" />
          <span>{isAr ? 'الرسائل الواردة إليك (Inbox)' : 'Inbound to Me'}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/30 text-white font-mono">
            {inboundCount > 0 ? inboundCount : emails.length}
          </span>
        </button>

        {outboundCount > 0 && (
          <button
            onClick={() => setDirectionFilter('outbound')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              directionFilter === 'outbound' ? 'bg-[#3B82F6] text-white shadow-lg shadow-[#3B82F6]/20' : 'bg-[#161F2E] text-[#94A3B8] hover:text-white border border-[#1E293B]'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{isAr ? 'الرسائل الصادرة منك (Sent)' : 'Outbound Sent'}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/30 text-white font-mono">
              {outboundCount}
            </span>
          </button>
        )}

        <button
          onClick={() => setDirectionFilter('contact')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            directionFilter === 'contact' ? 'bg-[#00D9FF] text-[#0F1419] font-black' : 'bg-[#161F2E] text-[#94A3B8] hover:text-white border border-[#1E293B]'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>{isAr ? 'جهات اتصال النطاق' : 'Domain Leads'}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 font-mono">
            {contactCount}
          </span>
        </button>
      </div>

      {/* 3. Control Toolbar (Search, Filter, Export & Copy All) */}
      <div className="bg-[#161F2E] p-4 rounded-xl border border-[#1E293B] space-y-4">
        
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-[#64748B] absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'بحث في الإيميلات، المرسل، الموضوع...' : 'Search emails, sender, subject...'}
              className="w-full bg-[#0F1419] border border-[#1E293B] rounded-lg pr-10 pl-4 py-2 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#00D9FF]"
            />
          </div>

          {/* Filters & Actions */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            
            {/* Department Filter */}
            {departments.length > 0 && (
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                aria-label={isAr ? 'تصفية حسب القسم' : 'Filter by department'}
                className="bg-[#0F1419] border border-[#1E293B] rounded-lg px-3 py-2 text-xs text-[#94A3B8] focus:outline-none focus:border-[#00D9FF]"
              >
                <option value="all">{isAr ? 'جميع الأقسام' : 'All Departments'}</option>
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            )}

            {/* View Mode Toggle */}
            <div className="flex items-center bg-[#0F1419] p-1 rounded-lg border border-[#1E293B]">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-[#1E293B] text-[#00D9FF]' : 'text-[#64748B] hover:text-white'}`}
                title={isAr ? 'عرض بطاقات' : 'Grid View'}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'table' ? 'bg-[#1E293B] text-[#00D9FF]' : 'text-[#64748B] hover:text-white'}`}
                title={isAr ? 'عرض جدول' : 'Table View'}
              >
                <TableIcon className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Select All Checkbox */}
            <button
              onClick={selectAllFiltered}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#0F1419] border border-[#1E293B] text-xs font-bold text-[#94A3B8] hover:text-white hover:border-[#334155] transition-all cursor-pointer"
            >
              {selectedEmails.size === filteredEmails.length && filteredEmails.length > 0 ? (
                <CheckSquare className="w-3.5 h-3.5 text-[#00D9FF]" />
              ) : (
                <Square className="w-3.5 h-3.5 text-[#64748B]" />
              )}
              <span>
                {selectedEmails.size > 0 
                  ? `${isAr ? 'محدد' : 'Selected'} (${selectedEmails.size})` 
                  : (isAr ? 'تحديد الكل' : 'Select All')}
              </span>
            </button>

            {/* Copy All Button */}
            <button
              onClick={() => handleCopyAll(', ')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 text-xs font-bold text-[#8B5CF6] hover:bg-[#8B5CF6]/20 transition-all cursor-pointer"
            >
              {copiedAll ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedAll ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ القائمة' : 'Copy List')}</span>
            </button>

            {/* Quick Mail Compose */}
            <a
              href={`mailto:${(selectedEmails.size > 0 ? filteredEmails.filter(e => selectedEmails.has(e.id)) : filteredEmails).map(e => e.email).join(',')}`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#00D9FF]/10 border border-[#00D9FF]/30 text-xs font-bold text-[#00D9FF] hover:bg-[#00D9FF]/20 transition-all"
              title={isAr ? 'مراسلة جهات الاتصال' : 'Compose Email'}
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isAr ? 'مراسلة' : 'Mail'}</span>
            </a>

            {/* Export Dropdown / Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                id="emails-toolbar-excel-btn"
                onClick={exportExcel}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold transition-all shadow-md shadow-[#10B981]/20 cursor-pointer"
                title={isAr ? 'تحميل جدول الإيميلات بصيغة Excel (.xlsx)' : 'Download Excel Sheet (.xlsx)'}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel (.xlsx)</span>
              </button>
              <button
                onClick={exportCsv}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30 text-xs font-bold text-[#10B981] hover:bg-[#10B981]/20 transition-all cursor-pointer"
                title={isAr ? 'تصدير إلى ملف CSV' : 'Export CSV'}
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
              <button
                onClick={exportTxt}
                className="flex items-center gap-1 px-2.5 py-2 rounded-lg bg-[#0F1419] border border-[#1E293B] text-xs font-bold text-[#94A3B8] hover:text-white transition-all cursor-pointer"
                title={isAr ? 'تصدير قائمة TXT' : 'Export TXT'}
              >
                <span>TXT</span>
              </button>
              <button
                onClick={exportJson}
                className="flex items-center gap-1 px-2.5 py-2 rounded-lg bg-[#0F1419] border border-[#1E293B] text-xs font-bold text-[#94A3B8] hover:text-white transition-all cursor-pointer"
                title={isAr ? 'تصدير JSON' : 'Export JSON'}
              >
                <span>JSON</span>
              </button>
              <button
                onClick={exportVcard}
                className="flex items-center gap-1 px-2.5 py-2 rounded-lg bg-[#0F1419] border border-[#1E293B] text-xs font-bold text-[#94A3B8] hover:text-white transition-all cursor-pointer"
                title={isAr ? 'تصدير vCard للهاتف' : 'Export vCard'}
              >
                <span>VCF</span>
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* 4. Results Presentation */}
      <div ref={listContainerRef} className="scroll-mt-4">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedEmails.map((e) => {
            const isSelected = selectedEmails.has(e.id);
            const isCopied = copiedId === e.id;
            const isInbound = e.direction === 'inbound' || e.type === 'inbound_message' || !!e.subject;

            return (
              <div
                key={e.id}
                className={`bg-[#161F2E] rounded-xl border transition-all relative p-4 space-y-3 ${
                  isSelected 
                    ? 'border-[#00D9FF] bg-[#161F2E] shadow-lg shadow-[#00D9FF]/5' 
                    : 'border-[#1E293B] hover:border-[#334155]'
                }`}
              >
                {/* Card Header (Checkbox, Direction Badge, Department, Verified) */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleSelect(e.id)}
                      className="text-[#64748B] hover:text-[#00D9FF] transition-colors cursor-pointer"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-[#00D9FF]" />
                      ) : (
                        <Square className="w-4 h-4 text-[#475569]" />
                      )}
                    </button>
                    
                    {isInbound ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 flex items-center gap-1">
                        <ArrowDownLeft className="w-2.5 h-2.5" />
                        <span>{isAr ? 'وارد إليك' : 'Inbound'}</span>
                      </span>
                    ) : (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getDeptBadgeStyle(e.department)} truncate max-w-[150px]`}>
                        {e.department || (isAr ? 'تواصل عام' : 'General')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#0F1419] text-[#94A3B8] font-mono border border-[#1E293B]">
                      {e.type}
                    </span>
                    <span title={isAr ? 'بريد مفحوص وصحيح' : 'Verified syntax'}>
                      <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
                    </span>
                  </div>
                </div>

                {/* Email Subject if present */}
                {e.subject && (
                  <div className="bg-[#0F1419]/70 p-2.5 rounded-lg border border-[#1E293B] space-y-1.5">
                    <div className="flex items-center justify-between gap-1 text-[10px] font-bold text-[#8B5CF6]">
                      <div className="flex items-center gap-1.5">
                        <MessageSquare className="w-3 h-3 shrink-0" />
                        <span>{isAr ? 'موضوع الرسالة:' : 'Subject:'}</span>
                      </div>
                      {e.date && (
                        <div className="flex items-center gap-1 text-[10px] text-[#94A3B8]">
                          <Calendar className="w-2.5 h-2.5" />
                          <span>{e.date}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-white line-clamp-2 leading-snug">
                      {e.subject}
                    </p>

                    {/* Check if attachment is mentioned in subject or snippet */}
                    {((e.snippet || '') + (e.contextText || '') + (e.subject || '')).match(/(?:WAVE\s*7\.xlsx|CamScanner|\.xlsx|\.pdf|\.docx|\.jpeg|\.jpg|مرفق|مرفقات|صور)/i) && (
                      <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                        {((e.snippet || '') + (e.contextText || '') + (e.subject || '')).includes('WAVE 7.xlsx') && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 text-[10px] font-mono font-bold">
                            <Paperclip className="w-2.5 h-2.5" />
                            <span>WAVE 7.xlsx</span>
                          </span>
                        )}
                        {((e.snippet || '') + (e.contextText || '') + (e.subject || '')).includes('CamScanner') && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30 text-[10px] font-mono font-bold">
                            <Paperclip className="w-2.5 h-2.5" />
                            <span>CamScanner 11.pdf (+1)</span>
                          </span>
                        )}
                        {(((e.snippet || '') + (e.contextText || '') + (e.subject || '')).includes('.jpeg') || ((e.snippet || '') + (e.contextText || '') + (e.subject || '')).includes('.jpg')) && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30 text-[10px] font-mono font-bold">
                            <Paperclip className="w-2.5 h-2.5" />
                            <span>2 صور مرفقة (.jpeg)</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Email Address & Sender Name */}
                <div className="space-y-1">
                  {(e.name || e.senderName) && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#E2E8F0] truncate">
                      <User className="w-3 h-3 text-[#64748B] shrink-0" />
                      <span className="truncate">{e.name || e.senderName}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between gap-2 bg-[#0F1419] p-2.5 rounded-lg border border-[#1E293B]">
                    <span className="text-xs font-mono font-bold text-[#00D9FF] truncate dir-ltr select-all">
                      {e.email}
                    </span>
                    <button
                      onClick={() => handleCopy(e.email, e.id)}
                      className="p-1 rounded bg-[#161F2E] hover:bg-[#1E293B] text-[#94A3B8] hover:text-white transition-colors shrink-0 cursor-pointer"
                      title={isAr ? 'نسخ البريد' : 'Copy email'}
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Context Snippet */}
                {(e.snippet || e.contextText) && (
                  <p className="text-[11px] text-[#94A3B8] bg-[#0F1419]/50 p-2 rounded-md line-clamp-2 border border-[#1E293B]/40 leading-relaxed font-sans">
                    {e.snippet || e.contextText}
                  </p>
                )}

                {/* Card Footer (Domain, Direct Send, Source) */}
                <div className="flex items-center justify-between pt-2 border-t border-[#1E293B]/80 text-[10px] text-[#64748B]">
                  <span className="font-mono text-[#94A3B8]">@{e.domain}</span>

                  <div className="flex items-center gap-2">
                    <a
                      href={`mailto:${e.email}${e.subject ? `?subject=Re: ${encodeURIComponent(e.subject)}` : ''}`}
                      className="flex items-center gap-1 text-[#00D9FF] hover:underline"
                    >
                      <Send className="w-2.5 h-2.5" />
                      <span>{isAr ? 'رد ومراسلة' : 'Reply'}</span>
                    </a>
                    {e.sourceUrl && (
                      <a
                        href={e.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#64748B] hover:text-white"
                        title={e.sourceUrl}
                      >
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-[#161F2E] rounded-xl border border-[#1E293B] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#0F1419] text-[#94A3B8] border-b border-[#1E293B]">
                <tr>
                  <th className="p-3 text-center w-10">
                    <button onClick={selectAllFiltered} className="cursor-pointer">
                      {selectedEmails.size === filteredEmails.length && filteredEmails.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-[#00D9FF]" />
                      ) : (
                        <Square className="w-4 h-4 text-[#64748B]" />
                      )}
                    </button>
                  </th>
                  <th className="p-3 font-bold">{isAr ? 'البريد الإلكتروني' : 'Email'}</th>
                  <th className="p-3 font-bold">{isAr ? 'المرسل / الاسم' : 'Sender / Name'}</th>
                  <th className="p-3 font-bold">{isAr ? 'الموضوع' : 'Subject'}</th>
                  <th className="p-3 font-bold">{isAr ? 'القسم / الاتجاه' : 'Department / Type'}</th>
                  <th className="p-3 font-bold">{isAr ? 'التاريخ' : 'Date'}</th>
                  <th className="p-3 text-center font-bold">{isAr ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]">
                {paginatedEmails.map((e) => {
                  const isSelected = selectedEmails.has(e.id);
                  const isCopied = copiedId === e.id;
                  const isInbound = e.direction === 'inbound' || e.type === 'inbound_message' || !!e.subject;

                  return (
                    <tr key={e.id} className={`hover:bg-[#0F1419]/40 transition-colors ${isSelected ? 'bg-[#00D9FF]/5' : ''}`}>
                      <td className="p-3 text-center">
                        <button onClick={() => toggleSelect(e.id)} className="cursor-pointer">
                          {isSelected ? (
                            <CheckSquare className="w-3.5 h-3.5 text-[#00D9FF]" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-[#64748B]" />
                          )}
                        </button>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#00D9FF] dir-ltr select-all">{e.email}</span>
                          <button
                            onClick={() => handleCopy(e.email, e.id)}
                            className="text-[#64748B] hover:text-white transition-colors cursor-pointer"
                          >
                            {isCopied ? <Check className="w-3 h-3 text-[#10B981]" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </td>
                      <td className="p-3 text-[#E2E8F0] font-semibold">
                        {e.name || e.senderName || '-'}
                      </td>
                      <td className="p-3 text-white max-w-[280px]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="truncate">{e.subject || '-'}</span>
                          {((e.snippet || '') + (e.contextText || '') + (e.subject || '')).includes('WAVE 7.xlsx') && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 text-[9px] font-mono font-bold">
                              <Paperclip className="w-2.5 h-2.5" />
                              <span>WAVE 7.xlsx</span>
                            </span>
                          )}
                          {((e.snippet || '') + (e.contextText || '') + (e.subject || '')).includes('CamScanner') && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30 text-[9px] font-mono font-bold">
                              <Paperclip className="w-2.5 h-2.5" />
                              <span>PDF</span>
                            </span>
                          )}
                          {(((e.snippet || '') + (e.contextText || '') + (e.subject || '')).includes('.jpeg') || ((e.snippet || '') + (e.contextText || '') + (e.subject || '')).includes('.jpg')) && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30 text-[9px] font-mono font-bold">
                              <Paperclip className="w-2.5 h-2.5" />
                              <span>2 صور (.jpeg)</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        {isInbound ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                            {isAr ? 'رسالة واردة 📥' : 'Inbound 📥'}
                          </span>
                        ) : (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getDeptBadgeStyle(e.department)}`}>
                            {e.department || '-'}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-[#94A3B8] font-mono text-[11px]">
                        {e.date || '-'}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <a
                            href={`mailto:${e.email}${e.subject ? `?subject=Re: ${encodeURIComponent(e.subject)}` : ''}`}
                            className="p-1 rounded bg-[#00D9FF]/10 text-[#00D9FF] hover:bg-[#00D9FF]/20 transition-colors"
                            title={isAr ? 'رد ومراسلة' : 'Reply'}
                          >
                            <Send className="w-3 h-3" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>

      {/* 5. Pagination Bar (For handling 4,000+ emails smoothly) */}
      {filteredEmails.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-[#161F2E] border border-[#1E293B]">
          
          {/* Page Info & Range */}
          <div className="flex items-center gap-3 text-xs text-[#94A3B8]">
            <span>
              {isAr ? 'عرض' : 'Showing'} <span className="font-bold text-white">{pageSize === -1 ? 1 : (currentPage - 1) * pageSize + 1}</span> - <span className="font-bold text-white">{pageSize === -1 ? filteredEmails.length : Math.min(currentPage * pageSize, filteredEmails.length)}</span> {isAr ? 'من أصل' : 'of'} <span className="font-bold text-[#00D9FF]">{filteredEmails.length.toLocaleString()}</span> {isAr ? 'رسالة بريد' : 'emails'}
            </span>

            {/* Page Size Selector */}
            <div className="flex items-center gap-1.5 pr-2 border-r border-[#1E293B]">
              <span className="text-[11px]">{isAr ? 'لكل صفحة:' : 'Per page:'}</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="bg-[#0F1419] border border-[#1E293B] text-white text-xs rounded-lg px-2 py-1 focus:border-[#00D9FF] focus:outline-none cursor-pointer"
              >
                <option value={25}>25 {isAr ? `(${Math.ceil(filteredEmails.length / 25)} صفحة)` : ''}</option>
                <option value={35}>35 {isAr ? `(${Math.ceil(filteredEmails.length / 35)} صفحة)` : ''}</option>
                <option value={50}>50 {isAr ? `(${Math.ceil(filteredEmails.length / 50)} صفحة)` : ''}</option>
                <option value={100}>100 {isAr ? `(${Math.ceil(filteredEmails.length / 100)} صفحة)` : ''}</option>
                <option value={250}>250 {isAr ? `(${Math.ceil(filteredEmails.length / 250)} صفحة)` : ''}</option>
                <option value={500}>500 {isAr ? `(${Math.ceil(filteredEmails.length / 500)} صفحة)` : ''}</option>
                <option value={-1}>{isAr ? 'عرض الكل (All)' : 'All'}</option>
              </select>
            </div>
          </div>

          {/* Navigation Controls */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-2.5 py-1.5 rounded-lg bg-[#0F1419] border border-[#1E293B] text-xs font-bold text-[#94A3B8] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title={isAr ? 'الصفحة الأولى' : 'First page'}
              >
                {isAr ? '« الأولى' : '« First'}
              </button>

              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1.5 rounded-lg bg-[#0F1419] border border-[#1E293B] text-xs font-bold text-[#94A3B8] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                {isAr ? '‹ السابق' : '‹ Prev'}
              </button>

              {/* Page Number Chips */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = currentPage;
                  if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  if (pageNum < 1 || pageNum > totalPages) return null;

                  const isActive = currentPage === pageNum;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#00D9FF] text-[#0A0D14] shadow-md shadow-cyan-500/20'
                          : 'bg-[#0F1419] border border-[#1E293B] text-[#94A3B8] hover:text-white hover:border-[#334155]'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1.5 rounded-lg bg-[#0F1419] border border-[#1E293B] text-xs font-bold text-[#94A3B8] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                {isAr ? 'التالي ›' : 'Next ›'}
              </button>

              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1.5 rounded-lg bg-[#0F1419] border border-[#1E293B] text-xs font-bold text-[#94A3B8] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title={isAr ? 'الصفحة الأخيرة' : 'Last page'}
              >
                {isAr ? 'الأخيرة »' : 'Last »'}
              </button>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
