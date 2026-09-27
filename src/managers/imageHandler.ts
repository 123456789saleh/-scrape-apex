export class ImageHandler {
  private blacklistedPatterns = [
    /spacer\.gif/i,
    /blank\.gif/i,
    /pixel\.png/i,
    /transparent\.gif/i,
    /1x1\.png/i,
    /tracking\//i,
    /analytics/i,
    /ads\//i,
    /banner/i,
    /placeholder/i,
    /default-product/i,
    /icon-/i,
    /star-/i,
    /rating-/i,
    /spinner/i,
    /loading\./i,
  ];

  private categoryIcons: Record<string, string> = {
    'washer': '🧺',
    'washing': '🧺',
    'dryer': '🔄',
    'dishwasher': '🍽️',
    'oven': '🍳',
    'cooker': '🍳',
    'microwave': '🍕',
    'fridge': '❄️',
    'refrigerator': '❄️',
    'freezer': '🧊',
    'air-conditioner': '❄️',
    'air conditioner': '❄️',
    'heater': '🔥',
    'tv': '📺',
    'television': '📺',
    'screen': '📺',
    'phone': '📱',
    'mobile': '📱',
    'laptop': '💻',
    'computer': '💻',
    'coffee': '☕',
    'air fryer': '🍟',
    'blender': '🍹',
    'vacuum': '🧹',
  };

  // Strict image validation - rejects spacers, 1x1 pixels, trackers
  isValidImage(imageUrl: string): boolean {
    if (!imageUrl || typeof imageUrl !== 'string') return false;
    const trimmed = imageUrl.trim();

    // 1. Check blacklist
    for (const pattern of this.blacklistedPatterns) {
      if (pattern.test(trimmed)) {
        return false;
      }
    }

    // 2. Base64 1x1 spacer check
    if (trimmed.toLowerCase().includes('data:image/gif;base64,r0lgodlhaqabaiaaaaaaap///yh5baeaaaaalaaaaaabaaeaaaibraa7')) {
      return false;
    }

    // 3. Format and length validation
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:image/')) {
      return trimmed.length > 25;
    }

    return false;
  }

  // Use crisp, descriptive product emojis instead of guesswork
  getProductIcon(category: string, title?: string): string {
    const term = `${category || ''} ${title || ''}`.toLowerCase();
    
    for (const [key, icon] of Object.entries(this.categoryIcons)) {
      if (term.includes(key)) {
        return icon;
      }
    }
    
    if (term.includes('شاشة') || term.includes('تلفزيون')) return '📺';
    if (term.includes('ثلاجة') || term.includes('ثلاجه')) return '❄️';
    if (term.includes('ديب فريزر') || term.includes('فريزر')) return '🧊';
    if (term.includes('غسالة') || term.includes('غساله')) return '🧺';
    if (term.includes('أطباق') || term.includes('اطباق')) return '🍽️';
    if (term.includes('تكييف') || term.includes('مكيف')) return '❄️';
    if (term.includes('بوتاجاز') || term.includes('فرن')) return '🍳';
    if (term.includes('ميكروويف')) return '🍕';
    if (term.includes('قلاية') || term.includes('قلايه')) return '🍟';
    if (term.includes('قهوة') || term.includes('قهوه') || term.includes('اسبريسو')) return '☕';
    if (term.includes('خلاط') || term.includes('عجان')) return '🍹';
    if (term.includes('مكنسة') || term.includes('مكنسه')) return '🧹';
    if (term.includes('سخان')) return '🔥';
    if (term.includes('هاتف') || term.includes('موبايل')) return '📱';

    return '📦';
  }

  // Handle missing or invalid image gracefully
  handleMissingImage(product: any): any {
    const icon = this.getProductIcon(product.category, product.title);
    return {
      ...product,
      imageIcon: icon,
      mainImage: this.isValidImage(product.mainImage) ? product.mainImage : null,
      imageFallback: !this.isValidImage(product.mainImage)
    };
  }

  // Process all products to ensure high accuracy and zero false images
  processImages(products: any[]): any[] {
    if (!Array.isArray(products)) return [];
    return products.map(p => this.handleMissingImage(p));
  }
}
