import { ScrapeResult, ExtractedEmail, ExtractedProduct } from './scraper.ts';

export interface SessionMetadata {
  totalItemsExpected: number;
  totalItemsFetched: number;
  pagesExpected: number;
  pagesFetched: number[];
  errorLog: string[];
  warnings: string[];
  startTime: number;
  endTime?: number;
}

export interface SessionContext {
  sessionId: string;
  createdAt: number;
  inputEmail: string;
  inputUrl: string;
  targetDomain: string;
  results: any[];
  metadata: SessionMetadata;
  isActive: boolean;
  lastAccessed: number;
}

export interface TenantDataContainer {
  tenantId: string;
  email: string;
  domain: string;
  emailData: ExtractedEmail[];
  siteData: ExtractedProduct[];
  attachments: any[];
  metadata: {
    totalCount: number;
    unreadCount: number;
    archivedCount: number;
    fetchedAt: number;
    lastModified: number;
  };
  history: HistoryEntry[];
}

export interface HistoryEntry {
  operationId: string;
  tenantId: string;
  email: string;
  sessionId: string;
  timestamp: number;
  action: string;
  resultCount: number;
  errorCount: number;
  duration: number;
  status: 'success' | 'failed' | 'partial';
  details: {
    inputUrl?: string;
    targetDomain?: string;
    pagesScraped?: number;
    itemsExtracted?: number;
  };
}

export interface PaginationConfig {
  totalItems: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
  pagesToFetch: number[];
  fetchedPages: number[];
}
