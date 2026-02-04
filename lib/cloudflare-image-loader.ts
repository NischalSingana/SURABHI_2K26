/**
 * Custom Cloudflare Image Loader for R2 + Image Transformations
 * 
 * This loader automatically uses Cloudflare's CDN and image optimization
 * when images are hosted on R2 with a custom domain.
 * 
 * Benefits:
 * - Automatic WebP/AVIF conversion
 * - Smart compression
 * - Edge caching
 * - Responsive image resizing
 * 
 * Usage: Set loaderFile in next.config.ts to use this loader
 */

export default function cloudflareImageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  // Check if image is from Cloudflare R2
  const isR2Image = src.includes('.r2.dev') || src.includes('cdn.klusurabhi.in');
  
  if (!isR2Image) {
    // For non-R2 images, return original src
    return src;
  }

  // Parse the URL
  const url = new URL(src);
  
  // If using custom CDN domain, apply Cloudflare Image Transformations
  if (url.hostname.includes('cdn.klusurabhi.in')) {
    const params = new URLSearchParams();
    
    // Width
    params.set('width', width.toString());
    
    // Quality (default to 80 for good balance)
    params.set('quality', (quality || 80).toString());
    
    // Format (auto-select best format: WebP or AVIF)
    params.set('format', 'auto');
    
    // Fit method (scale-down preserves aspect ratio)
    params.set('fit', 'scale-down');
    
    // Build optimized URL
    return `https://${url.hostname}/cdn-cgi/image/${params.toString()}${url.pathname}`;
  }
  
  // For r2.dev domains without custom CDN, return original
  // (Consider migrating to custom domain for better performance)
  return src;
}
