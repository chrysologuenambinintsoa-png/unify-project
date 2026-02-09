/**
 * Optimizes Cloudinary image URLs with transformations
 * Falls back to original URL if not a Cloudinary image
 */

export function optimizeAvatarUrl(url: string | null | undefined, size: number = 256): string | undefined {
  if (!url) return undefined;
  
  if (url.includes('cloudinary')) {
    // Format: c_fill (fill entire space, smart crop), g_face (face detection), 
    // h_{size}, w_{size}, q_95 (maximum quality), f_auto (best format auto-select), 
    // ar_1:1 (aspect ratio 1:1 for perfect circle), z_1.2 (zoom to fill completely)
    return url.replace('/upload/', `/upload/c_fill,g_face,h_${size},w_${size},ar_1:1,q_95,z_1.2,f_auto/`);
  }
  
  return url;
}

export function optimizeCoverUrl(url: string | null | undefined, width: number = 1920, height: number = 360): string | undefined {
  if (!url) return undefined;
  
  if (url.includes('cloudinary')) {
    // Format: c_lfill (large fill - maintains aspect ratio, no distortion), 
    // g_auto (auto-detect gravity), h_{height}, w_{width}, 
    // ar_16:3 (aspect ratio for cover 16:3), q_90 (high quality), f_auto (best format)
    return url.replace('/upload/', `/upload/c_lfill,g_auto,h_${height},w_${width},ar_16:3,q_90,f_auto/`);
  }
  
  return url;
}

export function optimizeImageUrl(url: string | null | undefined, width: number = 800, height: number = 600): string | undefined {
  if (!url) return undefined;
  
  if (url.includes('cloudinary')) {
    // Format: c_lfill (large fill - preserves aspect ratio), 
    // g_auto (auto gravity detection), h_{height}, w_{width}, 
    // q_90 (high quality), f_auto (best format auto-select)
    return url.replace('/upload/', `/upload/c_lfill,g_auto,h_${height},w_${width},q_90,f_auto/`);
  }
  
  return url;
}
