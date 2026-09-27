import { PaginationConfig } from '../types/session.ts';

export class PaginationHandler {
  private config: PaginationConfig | null = null;

  // Initialize accurate pagination mapping for the total count of items
  initializeConfig(totalItems: number, itemsPerPage: number = 50): PaginationConfig {
    const validItemsPerPage = Math.max(1, itemsPerPage);
    const totalPages = Math.max(1, Math.ceil(totalItems / validItemsPerPage));

    this.config = {
      totalItems,
      itemsPerPage: validItemsPerPage,
      totalPages,
      currentPage: 1,
      pagesToFetch: Array.from({ length: totalPages }, (_, i) => i + 1),
      fetchedPages: []
    };

    console.log(`[PaginationHandler] تهيئة الصفحات: إجمالي ${totalItems} عنصر عبر ${totalPages} صفحة (بمعدل ${validItemsPerPage} عنصر/صفحة)`);
    return this.config;
  }

  // Mark a page as processed with its items count
  markPageAsFetched(pageNumber: number, itemCount: number): void {
    if (!this.config) return;
    
    if (!this.config.fetchedPages.includes(pageNumber)) {
      this.config.fetchedPages.push(pageNumber);
      this.config.fetchedPages.sort((a, b) => a - b);
      
      const progress = (this.config.fetchedPages.length / this.config.totalPages) * 100;
      console.log(`[PaginationHandler] ✓ صفحة ${pageNumber}/${this.config.totalPages}: ${itemCount} عنصر | الإنجاز: ${progress.toFixed(1)}%`);
    }
  }

  // Calculate real progress percentage (0 - 100)
  getProgress(): number {
    if (!this.config || this.config.totalPages === 0) return 0;
    return Math.min(100, (this.config.fetchedPages.length / this.config.totalPages) * 100);
  }

  // Get remaining un-fetched pages
  getRemainingPages(): number[] {
    if (!this.config) return [];
    return this.config.pagesToFetch.filter(p => !this.config!.fetchedPages.includes(p));
  }

  getConfig(): PaginationConfig | null {
    return this.config;
  }

  reset(): void {
    this.config = null;
  }
}
