export const IMG_CDN_BASE = "https://img.allcascais.com";

export function cdnImageUrl(bucket: string, path?: string | null) {
  if (!path) return null;

  // remove leading slash if someone stored "/folder/file.jpg"
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;

  return `${IMG_CDN_BASE}/${bucket}/${cleanPath}`;
}

/**
 * If your DB already stores full supabase public URLs, convert them:
 * https://xxxx.supabase.co/storage/v1/object/public/bucket/path -> https://img.allcascais.com/bucket/path
 */
export function toCdnFromSupabasePublicUrl(url?: string | null) {
  if (!url) return null;

  return url.replace(
    /https:\/\/[^/]+\.supabase\.co\/storage\/v1\/object\/public\//,
    `${IMG_CDN_BASE}/`
  );
}
