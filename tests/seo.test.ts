// Indexability and link-preview invariants, checked against the built site.
// Run `npm run build` first; CI runs these between build and deploy.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { parse, type ElementNode } from "ultrahtml";
import { querySelector, querySelectorAll } from "ultrahtml/selector";
import { describe, expect, it } from "vitest";
import { siteConfig } from "../src/config/site";

const dist = path.resolve("dist");
if (!existsSync(dist)) throw new Error("dist/ is missing: run `npm run build`");

const site = new URL("/", import.meta.env.SITE).href;

const htmlFiles = (readdirSync(dist, { recursive: true }) as string[])
  .filter((file) => file.endsWith(".html"))
  .sort();

const pages = htmlFiles.map((file) => {
  const doc = parse(readFileSync(path.join(dist, file), "utf8"));
  const urlPath =
    file === "index.html" ? "/" : `/${file.replace(/index\.html$/, "")}`;
  const metas = querySelectorAll(doc, "meta") as ElementNode[];
  // Open Graph uses property=, everything else name=.
  const meta = (key: string) =>
    metas.find(({ attributes: a }) => a.property === key || a.name === key)
      ?.attributes.content;
  const jsonLd = querySelectorAll(
    doc,
    'script[type="application/ld+json"]',
  ).map((node) =>
    JSON.parse((node as ElementNode).children.map((c) => c.value).join("")),
  );
  return { file, urlPath, doc, meta, jsonLd };
});

const indexable = pages.filter((page) => page.file !== "404.html");
const notFound = pages.find((page) => page.file === "404.html")!;

// Resolve a site URL to the file GitHub Pages would serve for it.
const fileFor = (url: string) => {
  const pathname = decodeURIComponent(new URL(url, site).pathname);
  const target = path.join(dist, pathname);
  return pathname.endsWith("/") ? path.join(target, "index.html") : target;
};

const types = (jsonLd: Record<string, unknown>[]) =>
  jsonLd
    .flatMap((data) => (data["@graph"] as typeof jsonLd) ?? [data])
    .map((d) => d["@type"]);

describe.each(indexable)("$urlPath", ({ urlPath, doc, meta, jsonLd }) => {
  it("has one self-referencing, absolute canonical", () => {
    const canonicals = querySelectorAll(
      doc,
      'link[rel="canonical"]',
    ) as ElementNode[];
    expect(canonicals).toHaveLength(1);
    expect(canonicals[0].attributes.href).toBe(new URL(urlPath, site).href);
    expect(meta("og:url")).toBe(canonicals[0].attributes.href);
  });

  it("is not noindex", () => {
    expect(meta("robots") ?? "").not.toMatch(/noindex/);
  });

  it("has a title, description and exactly one h1", () => {
    expect(querySelector(doc, "title")).toBeTruthy();
    expect(meta("description")).toBeTruthy();
    expect(querySelectorAll(doc, "h1")).toHaveLength(1);
  });

  it("has an absolute og:image of the declared size", async () => {
    const image = meta("og:image")!;
    expect(image.startsWith(site)).toBe(true);
    const { width, height } = await sharp(fileFor(image)).metadata();
    expect([width, height]).toEqual([
      siteConfig.ogImage.width,
      siteConfig.ogImage.height,
    ]);
    expect(meta("og:image:width")).toBe(String(width));
    expect(meta("og:image:height")).toBe(String(height));
    expect(meta("og:image:alt")).toBeTruthy();
    expect(meta("twitter:card")).toBe("summary_large_image");
  });

  it("marks up the site on the homepage only, and each event as an Event", () => {
    const found = types(jsonLd);
    if (urlPath === "/") expect(found).toEqual(["WebSite", "Organization"]);
    else expect(found).not.toContain("WebSite");
    if (/^\/events\/[^/]+\/$/.test(urlPath)) expect(found).toEqual(["Event"]);
  });

  it("links internally only to pages that exist, with a trailing slash", () => {
    const hrefs = (querySelectorAll(doc, "a[href]") as ElementNode[])
      .map((a) => a.attributes.href)
      .filter((href) => href.startsWith("/") && !href.startsWith("//"));
    for (const href of hrefs) {
      const { pathname } = new URL(href, site);
      if (!path.extname(pathname)) expect(pathname, href).toMatch(/\/$/);
      expect(existsSync(fileFor(href)), href).toBe(true);
    }
  });
});

describe("404 page", () => {
  it("is noindex and names no canonical", () => {
    expect(notFound.meta("robots")).toBe("noindex");
    expect(querySelector(notFound.doc, 'link[rel="canonical"]')).toBeFalsy();
  });
});

describe("Event structured data", () => {
  const events = indexable.filter((page) =>
    types(page.jsonLd).includes("Event"),
  );

  it.each(events)("$urlPath has what Google requires", async ({ jsonLd }) => {
    const [event] = jsonLd;
    expect(event.name).toBeTruthy();
    expect(event.startDate).toMatch(/T\d\d:\d\d/);
    expect(new Date(event.endDate) > new Date(event.startDate)).toBe(true);
    expect(event.location.name).toBeTruthy();
    for (const field of [
      "streetAddress",
      "addressLocality",
      "addressRegion",
      "postalCode",
      "addressCountry",
    ]) {
      expect(event.location.address[field], field).toBeTruthy();
    }
    // 16:9, 4:3 and 1:1, each at Google's recommended 1920px width.
    const ratios = [];
    for (const image of event.image) {
      const { width, height } = await sharp(fileFor(image)).metadata();
      expect(width, image).toBe(1920);
      ratios.push(width! / height!);
    }
    expect(ratios).toEqual([16 / 9, 4 / 3, 1]);
  });
});

describe("sitemap", () => {
  const sitemap = readFileSync(path.join(dist, "sitemap-0.xml"), "utf8");
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

  it("lists every indexable page and nothing else", () => {
    expect(locs.sort()).toEqual(
      indexable.map((page) => new URL(page.urlPath, site).href).sort(),
    );
  });

  it("is advertised in robots.txt", () => {
    const robots = readFileSync(path.join(dist, "robots.txt"), "utf8");
    expect(robots).toContain(`Sitemap: ${site}sitemap-index.xml`);
  });
});
