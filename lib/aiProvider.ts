import { OPENROUTER_DEFAULT_MODELS, AiProvider } from "./types";
import OpenAI from "openai";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

async function callAi(
  provider: AiProvider,
  model: string,
  messages: ChatMessage[],
  jsonMode = true
): Promise<string> {
  let client: OpenAI;
  let modelId: string;

  if (provider === "nvidia") {
    // NVIDIA NIM ROUTE
    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
      throw new Error(
        "NVIDIA_API_KEY is not set. Add it to your environment variables."
      );
    }
    client = new OpenAI({
      baseURL: "https://integrate.api.nvidia.com/v1",
      apiKey,
    });
    modelId = "deepseek-ai/deepseek-v4-pro";
  } else {
    // OPENROUTER ROUTE
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error(
        "OPENROUTER_API_KEY is not set. Add it to your environment variables."
      );
    }
    client = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey,
      defaultHeaders: {
        "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
        "X-Title": "Company Research Assistant",
      },
    });
    modelId = model;
  }

  const completion = await client.chat.completions.create({
    model: modelId,
    messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
    temperature: 0.3,
    max_tokens: 4096,
    ...(jsonMode && provider !== "nvidia" ? { response_format: { type: "json_object" } } : {}), // NVIDIA deepseek doesn't always support json_object cleanly
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error(`${provider} returned an empty response.`);
  return content;
}

function safeJsonParse<T>(raw: string, fallback: T): T {
  try {
    const cleaned = raw.replace(/^```json\s*|```$/g, "").trim();
    return JSON.parse(cleaned) as T;
  } catch {
    return fallback;
  }
}

export interface AiCompanyAnalysis {
  summary: string;
  productsServices: string[];
  painPoints: string[];
  industry: string;
  country: string;
}

/** Analyze crawled website content into a structured company profile. */
export async function analyzeCompany(
  companyName: string,
  crawledText: string,
  supportingFacts: string,
  model: string,
  provider: AiProvider = "openrouter"
): Promise<AiCompanyAnalysis> {
  const system = `You are a B2B research analyst. You read raw website text and public search
snippets, then produce a strictly factual, structured company profile.
Only state what is reasonably supported by the provided text. Never invent facts, phone numbers,
or addresses. If something is unknown, omit it rather than guessing.
Respond ONLY with a JSON object matching this shape, no prose, no markdown fences:
{
  "summary": "string (2-4 sentences, what the company does)",
  "productsServices": ["string (concise bullet-style items)"],
  "painPoints": ["string (3-6 plausible business/customer pain points this company's product addresses or that companies like it commonly face - inferred from their positioning, not invented facts)"],
  "industry": "string (short label, e.g. 'cloud payments infrastructure')",
  "country": "string (primary country of operation, best guess from content, or 'unknown')"
}`;

  const user = `Company name: ${companyName}

=== Crawled website content ===
${crawledText}

=== Supporting public search snippets ===
${supportingFacts}`;

  const raw = await callAi(provider, model, [
    { role: "system", content: system },
    { role: "user", content: user },
  ], true);

  return safeJsonParse<AiCompanyAnalysis>(raw, {
    summary: "AI analysis unavailable for this company.",
    productsServices: [],
    painPoints: [],
    industry: "unknown",
    country: "unknown",
  });
}

export interface AiCompetitor {
  name: string;
  website: string;
  reason: string;
}

/** Turn raw competitor search snippets into a clean, deduplicated shortlist. */
export async function identifyCompetitors(
  companyName: string,
  industry: string,
  country: string,
  searchSnippets: string,
  model: string,
  provider: AiProvider = "openrouter"
): Promise<AiCompetitor[]> {
  const system = `You are a market research analyst. Given raw search snippets about a company's
market, identify real, named competitor companies operating in the same country and industry
with similar products or services. Exclude the company itself, exclude generic listicle/aggregator
sites (e.g. G2, Capterra, Wikipedia), and exclude social media profiles.
Respond ONLY with a JSON object: { "competitors": [{ "name": "string", "website": "string", "reason": "string" }] }
Include at most 5 competitors. "reason" is one short sentence on why they compete.`;

  const user = `Company: ${companyName}
Industry: ${industry}
Country: ${country}

=== Raw search snippets ===
${searchSnippets}`;

  const raw = await callAi(provider, model, [
    { role: "system", content: system },
    { role: "user", content: user },
  ], true);

  const parsed = safeJsonParse<{ competitors: AiCompetitor[] }>(raw, {
    competitors: [],
  });
  return parsed.competitors ?? [];
}

/** Fetch the live OpenRouter model catalog, falling back to a curated list. */
export async function listOpenRouterModels(): Promise<string[]> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return [...OPENROUTER_DEFAULT_MODELS];

  try {
    const res = await fetch("https://openrouter.ai/api/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [...OPENROUTER_DEFAULT_MODELS];
    const data = await res.json();
    const ids: string[] = (data?.data ?? [])
      .map((m: { id: string }) => m.id)
      .filter(Boolean);
    return ids.length ? ids : [...OPENROUTER_DEFAULT_MODELS];
  } catch {
    return [...OPENROUTER_DEFAULT_MODELS];
  }
}
