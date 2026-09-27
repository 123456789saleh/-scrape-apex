export class ErrorHandler {
  private maxRetries = 3;
  private retryDelay = 1000;

  constructor(maxRetries: number = 3, retryDelay: number = 1000) {
    this.maxRetries = maxRetries;
    this.retryDelay = retryDelay;
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: { sessionId: string; pageNumber?: number; email?: string }
  ): Promise<T | null> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`[ErrorHandler] 🔄 محاولة ${attempt}/${this.maxRetries} - بريد: ${context.email || 'N/A'} | صفحة: ${context.pageNumber || 'N/A'}`);
        const result = await operation();
        return result;
      } catch (error: any) {
        lastError = error as Error;
        console.warn(`[ErrorHandler] ⚠️ فشل المحاولة ${attempt}/${this.maxRetries}:`, lastError.message);

        if (attempt < this.maxRetries) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1);
          console.log(`[ErrorHandler] ⏳ انتظار ${delay}ms قبل إعادة المحاولة...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    console.error(`[ErrorHandler] ❌ فشلت جميع المحاولات (${this.maxRetries}):`, lastError?.message);
    return null;
  }
}
