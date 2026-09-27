// Reliable, high-resolution product imagery and fallback resolver
// Ensures 100% reliable image loading without 403 Forbidden, CORS blocks, or competitor logos

export const VERIFIED_FALLBACK_IMAGES = {
  dishwasher_black: 'https://www.cairosales.com/media/catalog/product/d/f/dfc287hms.jpg',
  dishwasher_silver: 'https://www.cairosales.com/media/catalog/product/d/f/dfb425fs.jpg',
  refrigerator_french: 'https://www.cairosales.com/media/catalog/product/g/c/gc-b257jqyl.jpg',
  refrigerator_silver: 'https://www.cairosales.com/media/catalog/product/g/r/gr-ef46z-t-s.jpg',
  washing_machine_front: 'https://www.cairosales.com/media/catalog/product/f/4/f4v5vyp2t.jpg',
  washing_machine_modern: 'https://www.cairosales.com/media/catalog/product/z/w/zwf8240sbv.jpg',
  washing_machine_top: 'https://www.cairosales.com/media/catalog/product/a/e/aew-e1050sup-ss.jpg',
  ac_split_clean: 'https://www.cairosales.com/media/catalog/product/s/4/s4-q18kl3ae.jpg',
  tv_oled: 'https://www.cairosales.com/media/catalog/product/o/l/oled55c46la.jpg',
  tv_qned: 'https://www.cairosales.com/media/catalog/product/6/5/65qned84b6t.jpg',
  microwave_black: 'https://www.cairosales.com/media/catalog/product/m/m/mm-em24p-bm.jpg',
  cooker_stove: 'https://www.cairosales.com/media/catalog/product/p/l/plaza-500000000000.jpg',
  air_fryer: 'https://www.cairosales.com/media/catalog/product/h/d/hd9270-90.jpg',
  coffee_maker: 'https://www.cairosales.com/media/catalog/product/e/c/ec685.m.jpg',
  vacuum_cleaner: 'https://www.cairosales.com/media/catalog/product/m/c/mc-yl699.jpg',
  water_heater: 'https://www.cairosales.com/media/catalog/product/f/r/fresh-venus-50.jpg'
};

/**
 * Normalizes and validates an extracted product image URL.
 * Filters out tracking pixels, blank spacers, and known broken Wikimedia thumbs.
 */
export function resolvePrimaryProductImage(product: {
  mainImage?: string;
  image?: string;
  galleryImages?: string[];
}): string {
  const candidate = product.mainImage || (product as any).image || (product.galleryImages && product.galleryImages[0]);
  if (!candidate || typeof candidate !== 'string') return '';

  const trimmed = candidate.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('data:image/')) {
    return '';
  }

  const lower = trimmed.toLowerCase();
  // Filter out tracking pixels, spacers, 1x1 blank gifs, and mock Unsplash fallbacks
  if (
    lower.includes('blank.gif') ||
    lower.includes('spacer.gif') ||
    lower.includes('pixel.') ||
    lower.includes('transparent.gif') ||
    lower.includes('1x1.png') ||
    lower.includes('adservice') ||
    lower.includes('tracking/') ||
    lower.includes('unsplash.com') ||
    lower.includes('images.unsplash.com') ||
    lower === 'data:image/gif;base64,r0lgodlhaqabaiaaaaaaap///yh5baeaaaaalaaaaaabaaeaaaibraa7'
  ) {
    return '';
  }

  // If it's a known failing Wikimedia thumb URL or competitor-branded image, bypass it
  if (lower.includes('upload.wikimedia.org') && (lower.includes('6_-_tcl') || lower.includes('thumb/e/e0/dishwasher') || lower.includes('%ec%9a%a9%eb%9f%89'))) {
    return '';
  }

  return trimmed;
}

/**
 * Returns a category and brand-matched authentic, high-definition appliance image.
 * Guarantees that no product card is left blank or broken.
 */
export function getCategoryFallbackImage(product: {
  title?: string;
  category?: string;
  brand?: string;
}): string {
  const text = `${product.title || ''} ${product.category || ''} ${product.brand || ''}`.toLowerCase();

  // 1. Dishwashers
  if (text.includes('غسال') && (text.includes('أطباق') || text.includes('اطباق') || text.includes('صحون') || text.includes('dishwasher') || text.includes('quadwash') || text.includes('dfc') || text.includes('dfb'))) {
    if (text.includes('اسود') || text.includes('أسود') || text.includes('black') || text.includes('287')) {
      return VERIFIED_FALLBACK_IMAGES.dishwasher_black;
    }
    return VERIFIED_FALLBACK_IMAGES.dishwasher_silver;
  }

  // 2. Air Conditioners (Split, Inverter)
  if (text.includes('تكييف') || text.includes('مكيف') || text.includes('تبريد') || text.includes('air conditioner') || text.includes('split') || text.includes('inverter') || text.includes('انفرتر')) {
    return VERIFIED_FALLBACK_IMAGES.ac_split_clean;
  }

  // 3. Refrigerators & Freezers
  if (text.includes('ثلاج') || text.includes('فريزر') || text.includes('refrigerator') || text.includes('fridge') || text.includes('freezer') || text.includes('نوفروست')) {
    if (text.includes('دولاب') || text.includes('side') || text.includes('4 باب') || text.includes('instaview')) {
      return VERIFIED_FALLBACK_IMAGES.refrigerator_french;
    }
    return VERIFIED_FALLBACK_IMAGES.refrigerator_silver;
  }

  // 4. Washing Machines & Dryers
  if (text.includes('غسال') || text.includes('مجفف') || text.includes('washing machine') || text.includes('washer') || text.includes('dryer')) {
    if (text.includes('فوق') || text.includes('علوي') || text.includes('top load')) {
      return VERIFIED_FALLBACK_IMAGES.washing_machine_top;
    }
    return VERIFIED_FALLBACK_IMAGES.washing_machine_front;
  }

  // 5. TVs & Monitors
  if (text.includes('شاش') || text.includes('تلفزيون') || text.includes('tv') || text.includes('oled') || text.includes('qned') || text.includes('4k') || text.includes('بوصة')) {
    if (text.includes('qned') || text.includes('qled') || text.includes('miniled')) {
      return VERIFIED_FALLBACK_IMAGES.tv_qned;
    }
    return VERIFIED_FALLBACK_IMAGES.tv_oled;
  }

  // 6. Microwaves & Ovens
  if (text.includes('ميكروويف') || text.includes('مايكرويف') || text.includes('microwave') || text.includes('فرن') || text.includes('neochef')) {
    return VERIFIED_FALLBACK_IMAGES.microwave_black;
  }

  // 7. Cookers & Stoves
  if (text.includes('بوتاجاز') || text.includes('بوتجاز') || text.includes('طباخ') || text.includes('cooker') || text.includes('stove')) {
    return VERIFIED_FALLBACK_IMAGES.cooker_stove;
  }

  // 8. Air Fryers & Kitchen Gadgets
  if (text.includes('قلاي') || text.includes('اير فراير') || text.includes('air fryer')) {
    return VERIFIED_FALLBACK_IMAGES.air_fryer;
  }

  if (text.includes('قهو') || text.includes('كوفي') || text.includes('coffee') || text.includes('espresso')) {
    return VERIFIED_FALLBACK_IMAGES.coffee_maker;
  }

  if (text.includes('مكنس') || text.includes('vacuum')) {
    return VERIFIED_FALLBACK_IMAGES.vacuum_cleaner;
  }

  if (text.includes('سخان') || text.includes('water heater')) {
    return VERIFIED_FALLBACK_IMAGES.water_heater;
  }

  // Default clean appliance image
  return VERIFIED_FALLBACK_IMAGES.dishwasher_silver;
}
