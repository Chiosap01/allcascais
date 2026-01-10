const CDN_BASE =
  import.meta.env.VITE_CDN_BASE_URL || "https://img.allcascais.com";

export function toCdnUrl(
  input?: string | null,
  defaultBucket?: string
): string | undefined {
  if (!input) return undefined;
  const raw = input.trim();
  if (!raw) return undefined;

  // full URL?
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    try {
      const u = new URL(raw);
      const marker = "/storage/v1/object/public/";
      const idx = u.pathname.indexOf(marker);
      if (idx !== -1) {
        const rest = u.pathname.slice(idx + marker.length); // <bucket>/<path>
        return `${CDN_BASE}/${rest}`;
      }
      return raw; // already CDN or external
    } catch {
      return raw;
    }
  }

  // only filename
  if (!raw.includes("/") && defaultBucket) {
    return `${CDN_BASE}/${defaultBucket}/${raw}`;
  }

  // already bucket/path
  return `${CDN_BASE}/${raw.replace(/^\/+/, "")}`;
}
