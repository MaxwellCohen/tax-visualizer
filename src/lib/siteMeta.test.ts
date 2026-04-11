import { afterEach, describe, expect, it, vi } from "vitest";

describe("siteMeta", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("exports stable site name and page bundles", async () => {
    const m = await import("~/lib/siteMeta");
    expect(m.SITE_NAME.length).toBeGreaterThan(0);
    expect(m.PAGE_META.home.title).toContain("Tax Visualizer");
    expect(m.PAGE_META.about.title).toContain("About");
    expect(m.PAGE_META.notFound.title).toContain("not found");
  });

  it("canonicalUrl is undefined without origin", async () => {
    vi.stubEnv("VITE_SITE_ORIGIN", "");
    vi.resetModules();
    const { canonicalUrl } = await import("~/lib/siteMeta");
    expect(canonicalUrl("/path")).toBeUndefined();
  });

  it("canonicalUrl joins origin and path", async () => {
    vi.stubEnv("VITE_SITE_ORIGIN", "https://example.com/");
    vi.resetModules();
    const { canonicalUrl } = await import("~/lib/siteMeta");
    expect(canonicalUrl("foo")).toBe("https://example.com/foo");
    expect(canonicalUrl("/bar")).toBe("https://example.com/bar");
  });
});
