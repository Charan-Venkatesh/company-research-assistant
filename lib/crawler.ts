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
}

/**
 * Crawl a website starting at `startUrl`, discovering priority pages
 * (home/about/products/services/solutions/contact/pricing), skipping
 * duplicates, login pages, and off-domain / non-HTML links.
 */
export async function crawlWebsite(startUrl: string): Promise<CrawlResult> {
  const startNormalized = normalizeUrl(startUrl, startUrl);
  if (!startNormalized) {
    return { pages: [], phone: null, address: null };
  }
  const baseHost = new URL(startNormalized).hostname.replace(/^www\./, "");

  const visited = new Set<string>();
  const pages: CrawledPage[] = [];
  let phone: string | null = null;
  let address: string | null = null;

  // 1. Fetch homepage, discover candidate links
  const homeHtml = await fetchHtml(startNormalized);
  if (!homeHtml) {
    return { pages: [], phone: null, address: null };
  }

  const $home = cheerio.load(homeHtml);
  const contact = extractContactHints($home);
  phone = contact.phone;
  address = contact.address;

  visited.add(startNormalized);
  pages.push({
    url: startNormalized,
    title: $home("title").text().trim() || "Home",
    text: extractText($home),
  });

  const candidateLinks = new Map<string, number>();
  $home("a[href]").each((_, el) => {
    const href = $home(el).attr("href");
    if (!href || isIgnorable(href)) return;
    const normalized = normalizeUrl(startNormalized, href);
    if (!normalized || visited.has(normalized) || isIgnorable(normalized))
      return;
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

  for (const url of sortedCandidates) {
    if (visited.has(url)) continue;
    visited.add(url);
    const html = await fetchHtml(url);
    if (!html) continue;
    const $page = cheerio.load(html);
    if (!phone || !address) {
      const c = extractContactHints($page);
      phone = phone ?? c.phone;
      address = address ?? c.address;
    }
    pages.push({
      url,
      title: $page("title").text().trim() || url,
      text: extractText($page),
    });
    if (pages.length >= MAX_PAGES) break;
  }

  return { pages, phone, address };
}
