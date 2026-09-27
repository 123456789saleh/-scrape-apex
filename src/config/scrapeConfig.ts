// Scraper Engine Configuration - ApexScrape Binding Standards
export const SCRAPE_CONFIG = {
  SESSION_TIMEOUT: 30 * 60 * 1000,      // 30 minutes
  MAX_RETRIES: 3,                        // Max retry attempts per page
  RETRY_DELAY: 1000,                     // Retry backoff delay (ms)
  ITEMS_PER_PAGE: 50,                    // Items per page (standard pagination)
  AUTO_SCROLL_DELAY: 500,                // Auto scroll step delay
  CACHE_BUST_INTERVAL: 100,              // Interval between requests
  MAX_CONCURRENT_REQUESTS: 3,            // Concurrent requests limit
  SOCKET_TIMEOUT: 30000,                 // Socket / fetch timeout (ms)
};
