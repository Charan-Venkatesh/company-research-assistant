import * as cheerio from "cheerio";
import type { CrawledPage } from "./types";

const PRIORITY_KEYWORDS = [
  { key: "home", patterns: ["", "/", "/home", "/index"] },
  { key: "about", patterns: ["about", "about-us", "who-we-are", "company"] },
  { key: "products", patterns: ["product", "products"] },
  { key: "services", patterns: ["service", "services"] },
  { key: "solutions", patterns: ["solution", "solutions"] },
  { key: "contact", patterns: ["contact", "contact-us", "get-in-touch"] },
  { key: "pricing", patterns: ["pricing", "plans", "price"] },
];

const IGNORE_PATTERNS = [
  "login",
  "signin",
  "sign-in",
  "signup",
  "sign-up",
  "register",
  "cart",
  "checkout",
  "account",
  "wp-admin",
  "privacy",
  "terms",
  "cookie",
  ".pdf",
  ".jpg",
  ".png",
  ".zip",
  "mailto:",
  "tel:",
  "#",
];

const MAX_PAGES = 8;
const FETCH_TIMEOUT_MS = 8000;

function normalizeUrl(base: string, href: string): string | null {
  try {
    const url = new URL(href, base);
    url.hash = "";
    // strip trailing slash for de-duplication (except root)
    let normalized = url.toString();
    if (normalized.endsWith("/") && normalized !== `${url.origin}/`) {
      normalized = normalized.slice(0, -1);
    }
    return normalized;
  } catch {
    return null;
  }
}

function isIgnorable(url: string): boolean {
  const lower = url.toLowerCase();
  return IGNORE_PATTERNS.some((p) => lower.includes(p));
}

function scoreLink(url: string, baseHost: string): number {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return -1;
  }
  if (u.hostname.replace(/^www\./, "") !== baseHost) return -1; // stay on-domain
  const path = u.pathname.toLowerCase();

  for (let i = 0; i < PRIORITY_KEYWORDS.length; i++) {
    const { patterns } = PRIORITY_KEYWORDS[i];
    if (patterns.some((p) => path === `/${p}` || path.includes(`/${p}`))) {
      return PRIORITY_KEYWORDS.length - i; // earlier keyword => higher score
    }
  }
  return 0;
}

async function fetchHtml(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; CompanyResearchBot/1.0; +https://example.com/bot)",
      },
      redirect: "follow",
    });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function extractText($: cheerio.CheerioAPI): string {
  $("script, style, noscript, svg, header nav, footer nav").remove();
  const text = $("body").text().replace(/\s+/g, " ").trim();
  return text.slice(0, 6000); // cap per-page content sent to the LLM
}

function extractContactHints($: cheerio.CheerioAPI): {
  phone: string | null;
  address: string | null;
} {
  const bodyText = $("body").text();
  const phoneMatch = bodyText.match(
    /(\+?\d{1,3}[\s.-]?)?(\(?\d{2,4}\)?[\s.-]?){2,4}\d{3,4}/
  );
  const addressEl = $('[class*="address" i], [id*="address" i]').first();
  return {
    phone: phoneMatch ? phoneMatch[0].trim() : null,
    address: addressEl.text().trim() || null,
  };
}

export interface CrawlResult {
  pages: CrawledPage[];
  phone: string | null;
  address: string | null;
  phoneSource: string | null;
  addressSource: string | null;
  stats: {
    pagesCrawled: number;
    pagesIgnored: number;
    usefulPages: number;
    wordsExtracted: number;
  };
}

/**
 * Crawl a website starting at `startUrl`, discovering priority pages
 * (home/about/products/services/solutions/contact/pricing), skipping
 * duplicates, login pages, and off-domain / non-HTML links.
 */
export async function crawlWebsite(startUrl: string): Promise<CrawlResult> {
  const startNormalized = normalizeUrl(startUrl, startUrl);
  if (!startNormalized) {
    return { pages: [], phone: null, address: null, phoneSource: null, addressSource: null, stats: { pagesCrawled: 0, pagesIgnored: 0, usefulPages: 0, wordsExtracted: 0 } };
  }
  const baseHost = new URL(startNormalized).hostname.replace(/^www\./, "");

  const visited = new Set<string>();
  const pages: CrawledPage[] = [];
  let phone: string | null = null;
  let address: string | null = null;
  let phoneSource: string | null = null;
  let addressSource: string | null = null;
  let pagesIgnored = 0;
  let wordsExtracted = 0;

  // 1. Fetch homepage, discover candidate links
  const homeHtml = await fetchHtml(startNormalized);
  if (!homeHtml) {
    return { pages: [], phone: null, address: null, phoneSource: null, addressSource: null, stats: { pagesCrawled: 0, pagesIgnored: 0, usefulPages: 0, wordsExtracted: 0 } };
  }

  const $home = cheerio.load(homeHtml);
  const contact = extractContactHints($home);
  phone = contact.phone;
  address = contact.address;
  if (phone) phoneSource = startNormalized;
  if (address) addressSource = startNormalized;

  visited.add(startNormalized);
  pages.push({
    url: startNormalized,
    title: $home("title").text().trim() || "Home",
    text: (() => { const t = extractText($home); wordsExtracted += t.split(/\s+/).length; return t; })(),
  });

  const candidateLinks = new Map<string, number>();
  $home("a[href]").each((_, el) => {
    const href = $home(el).attr("href");
    if (!href || isIgnorable(href)) { pagesIgnored++; return; }
    const normalized = normalizeUrl(startNormalized, href);
    if (!normalized || visited.has(normalized)) return;
    if (isIgnorable(normalized)) { pagesIgnored++; return; }
    const score = scoreLink(normalized, baseHost);
    if (score > 0) {
      candidateLinks.set(
        normalized,
        Math.max(candidateLinks.get(normalized) ?? 0, score)
      );
    }
  });

  const sortedCandidates = [...candidateLinks.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([url]) => url)
    .slice(0, MAX_PAGES - 1);

  // Fetch all candidate pages concurrently
  const fetchPromises = sortedCandidates.map(async (url) => {
    if (visited.has(url)) return null;
    visited.add(url);
    const html = await fetchHtml(url);
    return { url, html };
  });

  const results = await Promise.all(fetchPromises);

  for (const result of results) {
    if (!result || !result.html) continue;
    const { url, html } = result;

    const $page = cheerio.load(html);
    if (!phone || !address) {
      const c = extractContactHints($page);
      if (!phone && c.phone) { phone = c.phone; phoneSource = url; }
      if (!address && c.address) { address = c.address; addressSource = url; }
    }
    pages.push({
      url,
      title: $page("title").text().trim() || url,
      text: (() => { const t = extractText($page); wordsExtracted += t.split(/\s+/).length; return t; })(),
    });
    if (pages.length >= MAX_PAGES) break;
  }

  return {
    pages,
    phone,
    address,
    phoneSource,
    addressSource,
    stats: {
      pagesCrawled: pages.length,
      pagesIgnored,
      usefulPages: pages.length,
      wordsExtracted
    }
  };
}
