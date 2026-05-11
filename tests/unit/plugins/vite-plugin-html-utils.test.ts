import { describe, expect, it } from "vitest";
import {
  isExternalOrSpecialUrl,
  normalizeBasePath,
  rewriteHtmlAssetUrls,
} from "../../../vite-plugin-html-utils";

describe("vite-plugin-html-utils", () => {
  describe("isExternalOrSpecialUrl", () => {
    it("returns true for external and special-protocol urls", () => {
      expect(isExternalOrSpecialUrl("https://example.com/app.js")).toBe(true);
      expect(isExternalOrSpecialUrl("//cdn.example.com/lib.js")).toBe(true);
      expect(isExternalOrSpecialUrl("data:text/plain;base64,QQ==")).toBe(true);
      expect(isExternalOrSpecialUrl("blob:https://example.com/id")).toBe(true);
      expect(isExternalOrSpecialUrl("mailto:test@example.com")).toBe(true);
      expect(isExternalOrSpecialUrl("tel:+123456")).toBe(true);
      expect(isExternalOrSpecialUrl("#timeline")).toBe(true);
    });

    it("returns false for local relative and root urls", () => {
      expect(isExternalOrSpecialUrl("/assets/index-abc.js")).toBe(false);
      expect(isExternalOrSpecialUrl("assets/index-abc.js")).toBe(false);
      expect(isExternalOrSpecialUrl("./chunk.js")).toBe(false);
    });
  });

  describe("normalizeBasePath", () => {
    it("normalizes trailing slash and keeps leading slash", () => {
      expect(normalizeBasePath("/historical-europe-map/")).toEqual({
        basePath: "/historical-europe-map",
        basePathNoSlash: "historical-europe-map",
      });
    });

    it("handles root base path", () => {
      expect(normalizeBasePath("/")).toEqual({
        basePath: "",
        basePathNoSlash: "",
      });
    });
  });

  describe("rewriteHtmlAssetUrls", () => {
    it("rewrites src/href attributes for mapped local urls only", () => {
      const html = [
        '<link rel="stylesheet" href="/assets/app.css">',
        '<script type="module" src="/assets/index-abc.js"></script>',
        '<img src="https://example.com/logo.png" alt="logo">',
        '<a href="#legend">Legend</a>',
      ].join("\n");

      const rewritten = rewriteHtmlAssetUrls(html, url =>
        url.startsWith("/") ? `/historical-europe-map${url}` : url
      );

      expect(rewritten).toContain('href="/historical-europe-map/assets/app.css"');
      expect(rewritten).toContain('src="/historical-europe-map/assets/index-abc.js"');
      expect(rewritten).toContain('src="https://example.com/logo.png"');
      expect(rewritten).toContain('href="#legend"');
    });

    it("keeps original quoting style when mapper does not change url", () => {
      const html = "<script src='/assets/index-abc.js'></script>";
      const rewritten = rewriteHtmlAssetUrls(html, url => url);
      expect(rewritten).toBe(html);
    });
  });
});
