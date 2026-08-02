/**
 * Serper.dev integration.
 *
 * Serper wraps Google Search results (organic, knowledge graph, places) behind
 * a simple POST API. We use it for three things:
 *   1. Resolving a bare company name -> official website
 *   2. Pulling supporting facts (phone/address/summary) from the knowledge graph
 *   3. Finding competitor candidates
 */

const SERPER_URL = "https://google.serper.dev/search";

export interface SerperOrganicResult {
  title: string;
  link: string;
  snippet?: string;
}

export interface SerperResponse {
  organic?: SerperOrganicResult[];
  knowledgeGraph?: {
    title?: string;
    type?: string;
    website?: string;
    description?: string;
    attributes?: Record<string, string>;
  };
  answerBox?: {
    answer?: string;
    snippet?: string;
  };
}

async function serperSearch(query: string): Promise<SerperResponse> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    throw new Error(
      "SERPER_API_KEY is not set. Add it to your environment variables."
    );
  }

  const res = await fetch(SERPER_URL, {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ q: query, num: 10 }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Serper request failed (${res.status}): ${body}`);
  }

  return res.json();
}

const BLOCKED_DOMAINS = [
  "wikipedia.org",
  "linkedin.com",
  "facebook.com",
  "twitter.com",
  "x.com",
  "instagram.com",
  "youtube.com",
  "crunchbase.com",
  "glassdoor.com",
  "indeed.com",
  "bloomberg.com",
  "reddit.com",
];

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/** Resolve a plain company name to its most likely official website. */
export async function findOfficialWebsite(
  companyName: string
): Promise<{ website: string; source: string } | null> {
  const data = await serperSearch(`${companyName} official website`);

  if (data.knowledgeGraph?.website) {
    return { website: data.knowledgeGraph.website, source: "knowledge_graph" };
  }

  const candidate = (data.organic ?? []).find((r) => {
    const host = hostnameOf(r.link);
    return host && !BLOCKED_DOMAINS.some((b) => host.includes(b));
  });

  if (candidate) {
    return { website: candidate.link, source: "organic_search" };
  }

  return null;
}

/** Pull supporting company facts (phone, address, description) from search. */
export async function gatherCompanyFacts(
  companyName: string,
  website: string
) {
  const domain = hostnameOf(website);
  const [general, contact] = await Promise.all([
    serperSearch(`${companyName} company overview`),
    serperSearch(`${companyName} contact phone address ${domain}`),
  ]);

  return { general, contact };
}

/** Search for likely competitors given an industry/product description. */
export async function searchCompetitors(
  companyName: string,
  industryHint: string
): Promise<SerperOrganicResult[]> {
  const data = await serperSearch(
    `${companyName} competitors alternatives ${industryHint}`.trim()
  );
  return data.organic ?? [];
}

export { serperSearch, hostnameOf, BLOCKED_DOMAINS };
