/**
 * Optimizes Cloudinary image URLs with transformations
 * Falls back to original URL if not a Cloudinary image
 */

export function optimizeAvatarUrl(url: string | null | undefined, size: number = 128): string | undefined {
  if (!url) return undefined;
  
  if (url.includes('cloudinary')) {
    // Format: c_thumb (crop to face), h_{size}, w_{size}, g_face (gravity), q_85 (quality), f_auto (format)
    return url.replace('/upload/', `/upload/c_thumb,h_${size},w_${size},g_face,q_85,f_auto/`);
  }
  
  return url;
}

export function optimizeCoverUrl(url: string | null | undefined, width: number = 1200, height: number = 200): string | undefined {
  if (!url) return undefined;
  
  if (url.includes('cloudinary')) {
    // Format: c_fill (fill), h_{height}, w_{width}, q_80 (quality), f_auto (format)
    return url.replace('/upload/', `/upload/c_fill,h_${height},w_${width},q_80,f_auto/`);
  }
  
  return url;
}

export function optimizeImageUrl(url: string | null | undefined, width: number = 400, height: number = 400): string | undefined {
  if (!url) return undefined;
  
  if (url.includes('cloudinary')) {
    // Format: c_fill (fill), h_{height}, w_{width}, q_80 (quality), f_auto (format)
    return url.replace('/upload/', `/upload/c_fill,h_${height},w_${width},q_80,f_auto/`);
  }
  
  return url;
}
