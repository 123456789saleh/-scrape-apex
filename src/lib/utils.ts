import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { resolvePrimaryProductImage, getCategoryFallbackImage } from './productImages';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  try {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: currency === 'EGP' ? 'EGP' : currency === 'SAR' ? 'SAR' : currency === 'AED' ? 'AED' : 'USD',
      maximumFractionDigits: 2
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function copyToClipboard(text: string): Promise<boolean> {
  return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
}

// High-fidelity Scraped Product Image Resolver
export function getAccurateProductImage(product: {
  title?: string;
  category?: string;
  brand?: string;
  mainImage?: string;
  image?: string;
  galleryImages?: string[];
}): string {
  const primary = resolvePrimaryProductImage(product);
  if (primary) return primary;
  return getCategoryFallbackImage(product);
}

export function downloadFile(blob: Blob, filename: string) {
  try {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      if (document.body.contains(a)) {
        document.body.removeChild(a);
      }
      window.URL.revokeObjectURL(url);
    }, 20000);
  } catch (err) {
    console.error('Download error:', err);
  }
}
