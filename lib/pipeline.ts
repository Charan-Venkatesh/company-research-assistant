import {
  findOfficialWebsite,
  gatherCompanyFacts,
  searchCompetitors,
  hostnameOf,
} from "./serper";
import { crawlWebsite } from "./crawler";
import { analyzeCompany, identifyCompetitors } from "./openrouter";
import type { ResearchResult } from "./types";

const URL_PATTERN = /^https?:\/\//i;

function looksLikeUrl(input: string): boolean {
  return URL_PATTERN.test(input.trim()) || /\.[a-z]{2,}\/?$/i.test(input.trim());
}

function normalizeToUrl(input: string): string {
  const trimmed = input.trim();
  return URL_PATTERN.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function guessNameFromUrl(url: string): string {
  const host = hostnameOf(url);
  const label = host.split(".")[0] ?? host;
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export interface PipelineCallbacks {
  onProgress?: (step: string, status: "active" | "done" | "error", detail?: string) => void;
}

export async function runResearchPipeline(
  rawInput: string,
  model: string,
  callbacks: PipelineCallbacks = {}
): Promise<ResearchResult> {
  const { onProgress } = callbacks;
  const emit = (
    step: string,
    status: "active" | "done" | "error",
    detail?: string
  ) => onProgress?.(step, status, detail);

  // --- 1. Resolve input to a company name + website ---
  emit("resolve", "active");
  let website: string;
  let companyName: string;
  const sourcesUsed: string[] = [];

  if (looksLikeUrl(rawInput)) {
    website = normalizeToUrl(rawInput);
    companyName = guessNameFromUrl(website);
  } else {
    companyName = rawInput.trim();
    const resolved = await findOfficialWebsite(companyName);
    if (!resolved) {
      emit("resolve", "error", "Could not resolve an official website.");
      throw new Error(
        `Could not find an official website for "${companyName}". Try providing the URL directly.`
      );
    }
    website = resolved.website;
    sourcesUsed.push(`serper:${resolved.source}`);
  }
  emit("resolve", "done", website);

  // --- 2. Search + Crawl in parallel ---
  emit("search", "active");
  emit("crawl", "active");
  const [facts, crawl] = await Promise.all([
    gatherCompanyFacts(companyName, website).catch(() => null),
    crawlWebsite(website),
  ]);
  emit("search", "done", facts ? "gathered supporting facts" : "no facts found");
  emit(
    "crawl",
    crawl.pages.length ? "done" : "error",
    crawl.pages.length ? `${crawl.pages.length} pages crawled` : "crawl failed"
  );
  if (facts) sourcesUsed.push("serper:knowledge_graph", "serper:contact_search");

  const crawledText = crawl.pages
    .map((p) => `--- ${p.title} (${p.url}) ---\n${p.text}`)
    .join("\n\n")
    .slice(0, 18000); // keep prompt size sane

  const supportingFacts = facts
    ? JSON.stringify(
        {
          knowledgeGraph: facts.general.knowledgeGraph,
          organicSnippets: facts.general.organic?.slice(0, 5),
          contactSnippets: facts.contact.organic?.slice(0, 5),
        },
        null,
        2
      )
    : "No supporting search data available.";

  // --- 3. AI analysis ---
  emit("analyze", "active");
  const analysis = await analyzeCompany(
    companyName,
    crawledText || "No crawlable content found on the website.",
    supportingFacts,
    model
  );
  emit("analyze", "done");

  const phone = crawl.phone ?? facts?.contact.knowledgeGraph?.attributes?.["Phone"] ?? null;
  const address =
    crawl.address ?? facts?.contact.knowledgeGraph?.attributes?.["Address"] ?? null;

  // --- 4. Competitor analysis ---
  emit("competitors", "active");
  const competitorResults = await searchCompetitors(
    companyName,
    analysis.industry
  ).catch(() => []);
  const competitorSnippets = competitorResults
    .slice(0, 8)
    .map((r) => `${r.title} — ${r.link} — ${r.snippet ?? ""}`)
    .join("\n");

  const competitors = competitorSnippets
    ? await identifyCompetitors(
        companyName,
        analysis.industry,
        analysis.country,
        competitorSnippets,
        model
      ).catch(() => [])
    : [];
  emit("competitors", "done", `${competitors.length} competitors found`);
  if (competitorResults.length) sourcesUsed.push("serper:competitor_search");

  emit("done", "done");

  return {
    company: {
      name: companyName,
      website,
      phone,
      address,
      productsServices: analysis.productsServices,
      summary: analysis.summary,
      painPoints: analysis.painPoints,
    },
    competitors: competitors.map((c) => ({
      name: c.name,
      website: c.website,
      reason: c.reason,
    })),
    sourcesUsed: [...new Set(sourcesUsed)],
    crawledPages: crawl.pages.map((p) => p.url),
    model,
    generatedAt: new Date().toISOString(),
  };
}
