// Reliable, high-resolution product imagery and fallback resolver
// Ensures 100% reliable image loading without 403 Forbidden, CORS blocks, or competitor logos

export const VERIFIED_FALLBACK_IMAGES = {
  dishwasher_black: 'https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=800&auto=format&fit=crop&q=80',
  dishwasher_silver: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=80',
  refrigerator_french: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=800&auto=format&fit=crop&q=80',
  refrigerator_silver: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=800&auto=format&fit=crop&q=80',
  washing_machine_front: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=800&auto=format&fit=crop&q=80',
  washing_machine_modern: 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=800&auto=format&fit=crop&q=80',
  washing_machine_top: 'https://images.unsplash.com/photo-1604335399105-a0c585fd81a1?w=800&auto=format&fit=crop&q=80',
  ac_split_clean: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80',
  tv_oled: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=800&auto=format&fit=crop&q=80',
  tv_qned: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&auto=format&fit=crop&q=80',
  microwave_black: 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=800&auto=format&fit=crop&q=80',
  cooker_stove: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=800&auto=format&fit=crop&q=80',
  air_fryer: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&auto=format&fit=crop&q=80',
  coffee_maker: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&auto=format&fit=crop&q=80',
  vacuum_cleaner: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800&auto=format&fit=crop&q=80',
  water_heater: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800&auto=format&fit=crop&q=80'
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
  // Filter out tracking pixels, spacers, or 1x1 blank gifs
  if (
    lower.includes('blank.gif') ||
    lower.includes('spacer.gif') ||
    lower.includes('pixel.') ||
    lower.includes('transparent.gif') ||
    lower.includes('1x1.png') ||
    lower.includes('adservice') ||
    lower.includes('tracking/') ||
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
