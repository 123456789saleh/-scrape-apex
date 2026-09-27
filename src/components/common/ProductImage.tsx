import React, { useState, useEffect } from 'react';
import { resolvePrimaryProductImage, getCategoryFallbackImage } from '../../lib/productImages';
import { ImageOff } from 'lucide-react';

interface ProductImageProps {
  product: {
    title?: string;
    category?: string;
    brand?: string;
    mainImage?: string;
    image?: string;
    galleryImages?: string[];
  };
  alt?: string;
  className?: string;
  imgClassName?: string;
  isTable?: boolean;
}

export const ProductImage: React.FC<ProductImageProps> = ({
  product,
  alt = '',
  className = '',
  imgClassName = '',
  isTable = false
}) => {
  const primaryUrl = resolvePrimaryProductImage(product);
  const fallbackUrl = getCategoryFallbackImage(product);

  const [src, setSrc] = useState<string>(primaryUrl || fallbackUrl);
  const [triedProxy, setTriedProxy] = useState<boolean>(false);
  const [triedFallback, setTriedFallback] = useState<boolean>(!primaryUrl);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [hasFailedAll, setHasFailedAll] = useState<boolean>(false);

  // Synchronize when product changes
  useEffect(() => {
    const nextPrimary = resolvePrimaryProductImage(product);
    const nextFallback = getCategoryFallbackImage(product);
    setSrc(nextPrimary || nextFallback);
    setTriedProxy(false);
    setTriedFallback(!nextPrimary);
    setIsLoaded(false);
    setHasFailedAll(false);
  }, [product.mainImage, (product as any).image, product.title]);

  const handleError = () => {
    // Stage 1: Try through the server image proxy if it was an external image
    if (!triedProxy && src && !src.includes('/api/proxy-image') && (src.startsWith('http://') || src.startsWith('https://'))) {
      setTriedProxy(true);
      setSrc(`/api/proxy-image?url=${encodeURIComponent(src)}`);
      return;
    }

    // Stage 2: Fall back to verified category & brand appliance image
    if (!triedFallback && fallbackUrl && src !== fallbackUrl) {
      setTriedFallback(true);
      setSrc(fallbackUrl);
      return;
    }

    // Stage 3: If all avenues exhausted, flag failure
    setHasFailedAll(true);
  };

  if (hasFailedAll || !src) {
    return (
      <div className={`flex flex-col items-center justify-center text-center gap-1 bg-[#161F2E] ${className}`}>
        <ImageOff className={`${isTable ? 'w-4 h-4' : 'w-7 h-7'} text-[#64748B]`} />
        {!isTable && (
          <span className="text-[9px] font-mono text-[#64748B] px-1.5 py-0.5 rounded bg-[#0F1419] border border-[#1E293B]">
            {product.brand || 'Appliance'}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`relative flex items-center justify-center overflow-hidden bg-[#161F2E] ${className}`}>
      {/* Loading Skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-[#1E293B]/60 animate-pulse flex items-center justify-center" />
      )}

      <img
        src={src}
        alt={alt || product.title || 'Product Image'}
        referrerPolicy="no-referrer"
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        onError={handleError}
        className={`w-full h-full object-contain transition-all duration-300 ${
          isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        } ${imgClassName}`}
      />
    </div>
  );
};
