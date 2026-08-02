import type { ApplicantInfo, DiscordConfig } from "./types";

/**
 * The assignment explicitly rules out a permanent database. Discord settings
 * and applicant details are therefore kept in the browser's localStorage only
 * — nothing is persisted server-side. Each research request reads this config
 * client-side and sends it along with the API call.
 */

const DISCORD_KEY = "cra:discordConfig";
const APPLICANT_KEY = "cra:applicantInfo";

export function readDiscordConfig(): DiscordConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DISCORD_KEY);
    return raw ? (JSON.parse(raw) as DiscordConfig) : null;
  } catch {
    return null;
  }
}

export function writeDiscordConfig(config: DiscordConfig) {
  window.localStorage.setItem(DISCORD_KEY, JSON.stringify(config));
}

export function readApplicantInfo(): ApplicantInfo {
  if (typeof window === "undefined") return { name: "", email: "" };
  try {
    const raw = window.localStorage.getItem(APPLICANT_KEY);
    return raw ? (JSON.parse(raw) as ApplicantInfo) : { name: "", email: "" };
  } catch {
    return { name: "", email: "" };
  }
}

export function writeApplicantInfo(info: ApplicantInfo) {
  window.localStorage.setItem(APPLICANT_KEY, JSON.stringify(info));
}
