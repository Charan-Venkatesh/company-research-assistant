export interface CompanyInfo {
  name: string;
  website: string;
  phone: string | null;
  address: string | null;
  productsServices: string[];
  summary: string;
  painPoints: string[];
  targetCustomers?: string[];
  confidenceScore?: "High" | "Medium" | "Low" | string;
  phoneSource?: string | null;
  addressSource?: string | null;
}

export interface Competitor {
  name: string;
  website: string;
  reason: string;
}

export type AiProvider = "openrouter" | "nvidia";

export interface ResearchResult {
  company: CompanyInfo;
  competitors: Competitor[];
  sourcesUsed: string[];
  crawledPages: string[];
  model: string;
  provider: AiProvider;
  generatedAt: string;
  crawlStats?: CrawlStats;
}

export interface CrawledPage {
  url: string;
  title: string;
  text: string;
}

export interface ProgressEvent {
  step: ResearchStep;
  status: "pending" | "active" | "done" | "error";
  detail?: string;
}

export type ResearchStep =
  | "resolve"
  | "search"
  | "crawl"
  | "analyze"
  | "competitors"
  | "done";

export interface DiscordConfig {
  botToken: string;
  channelId: string;
}

export interface ApplicantInfo {
  name: string;
  email: string;
}

export const OPENROUTER_DEFAULT_MODELS = [
  "openai/gpt-4o-mini",
  "anthropic/claude-3.5-sonnet",
  "google/gemini-2.0-flash-001",
  "meta-llama/llama-3.3-70b-instruct",
  "deepseek/deepseek-chat",
] as const;

export interface CrawlStats {
  pagesCrawled: number;
  pagesIgnored: number;
  usefulPages: number;
  wordsExtracted: number;
}
