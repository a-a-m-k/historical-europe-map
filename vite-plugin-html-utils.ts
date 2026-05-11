export function isExternalOrSpecialUrl(url: string): boolean {
  return (
    /^(https?:)?\/\//i.test(url) || /^(data:|blob:|mailto:|tel:|#)/i.test(url)
  );
}

export function normalizeBasePath(base: string): {
  basePath: string;
  basePathNoSlash: string;
} {
  const basePath = base.replace(/\/$/, "");
  const basePathNoSlash = basePath.replace(/^\//, "");
  return { basePath, basePathNoSlash };
}

export function rewriteHtmlAssetUrls(
  html: string,
  mapper: (url: string) => string
): string {
  return html.replace(
    /(href|src)=["']([^"']+)["']/g,
    (match: string, attr: string, url: string) => {
      if (isExternalOrSpecialUrl(url)) return match;
      const mapped = mapper(url);
      return mapped === url ? match : `${attr}="${mapped}"`;
    }
  );
}
