export interface CompanyInfo {
  name: string;
  website: string;
  phone: string | null;
  address: string | null;
  productsServices: string[];
  summary: string;
  painPoints: string[];
}

export interface Competitor {
  name: string;
  website: string;
  reason: string;
}

export interface ResearchResult {
  company: CompanyInfo;
  competitors: Competitor[];
  sourcesUsed: string[];
  crawledPages: string[];
  model: string;
  generatedAt: string;
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

export const NVIDIA_DEFAULT_MODELS = [
  "deepseek-ai/deepseek-v4-pro",
] as const;
