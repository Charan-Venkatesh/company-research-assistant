"use client";

import { useState } from "react";
import { Download, Send, Globe, Phone, MapPin, Loader2 } from "lucide-react";
import type { ResearchResult } from "@/lib/types";
import { readDiscordConfig, readApplicantInfo } from "@/lib/clientConfig";

export default function Dossier({ result }: { result: ResearchResult }) {
  const [downloading, setDownloading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<"idle" | "ok" | "error">("idle");
  const [sendMessage, setSendMessage] = useState("");

  const { company, competitors } = result;
  const discordConfig = readDiscordConfig();

  async function downloadPdf() {
    setDownloading(true);
    try {
      const res = await fetch("/api/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      });
      if (!res.ok) throw new Error("PDF generation failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${company.name.replace(/[^a-z0-9]+/gi, "_")}_report.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setSendMessage("Could not generate the PDF. Check your server logs.");
    } finally {
      setDownloading(false);
    }
  }

  async function sendToDiscord() {
    setSending(true);
    setSendStatus("idle");
    try {
      const discord = readDiscordConfig();
      const applicant = readApplicantInfo();
      const res = await fetch("/api/discord", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result, applicant, discord }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Send failed");
      setSendStatus("ok");
      setSendMessage("Sent to Discord.");
    } catch (err) {
      setSendStatus("error");
      setSendMessage(err instanceof Error ? err.message : "Send failed.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="stamp-enter relative rounded-xl border border-hairline bg-paper text-ink-950 shadow-[0_1px_0_rgba(255,255,255,0.04)]">
      {/* stamp */}
      <div className="pointer-events-none absolute -top-4 right-5 rotate-[-8deg] rounded border-[3px] border-signal/70 px-2.5 py-1 font-data text-[10px] font-medium uppercase tracking-[0.15em] text-signal/80 sm:right-8">
        Report complete
      </div>

      <div className="border-b border-paper-dim px-6 py-5 sm:px-8">
        <p className="font-data text-[10px] uppercase tracking-[0.18em] text-ink-950/50">
          Company dossier
        </p>
        <h2 className="mt-1 font-display text-[26px] font-semibold leading-tight">
          {company.name}
        </h2>
        <a
          href={company.website}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-flex items-center gap-1.5 font-data text-[13px] text-signal hover:underline"
        >
          <Globe size={12} />
          {company.website}
        </a>

        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 font-data text-[12.5px] text-ink-950/70">
          <span className="flex flex-col gap-0.5" title={company.phoneSource ? `Source: ${company.phoneSource}` : undefined}>
            <span className="flex items-center gap-1.5">
              <Phone size={12} /> {company.phone ?? "not available"}
            </span>
            {company.phoneSource && (
              <span className="text-[10px] text-ink-950/40 truncate max-w-[200px]">
                {company.phoneSource === "knowledge_graph" ? "Source: Google Search" : `Source: ${new URL(company.phoneSource).pathname || "Website"}`}
              </span>
            )}
          </span>
          <span className="flex flex-col gap-0.5" title={company.addressSource ? `Source: ${company.addressSource}` : undefined}>
            <span className="flex items-center gap-1.5">
              <MapPin size={12} /> {company.address ?? "not available"}
            </span>
            {company.addressSource && (
              <span className="text-[10px] text-ink-950/40 truncate max-w-[200px]">
                {company.addressSource === "knowledge_graph" ? "Source: Google Search" : `Source: ${new URL(company.addressSource).pathname || "Website"}`}
              </span>
            )}
          </span>
        </div>
      </div>

      <div className="space-y-6 px-6 py-5 sm:px-8">
        <section>
          <h3 className="mb-1.5 font-data text-[10px] uppercase tracking-[0.18em] text-ink-950/50">
            Summary
          </h3>
          <p className="text-[14px] leading-relaxed text-ink-950/90">
            {company.summary}
          </p>
        </section>

        <section>
          <h3 className="mb-2 font-data text-[10px] uppercase tracking-[0.18em] text-ink-950/50">
            Products &amp; services
          </h3>
          {company.productsServices.length ? (
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {company.productsServices.map((p, i) => (
                <li
                  key={i}
                  className="rounded-md border border-paper-dim bg-white/40 px-2.5 py-1.5 text-[13px]"
                >
                  {p}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] text-ink-950/50">Not available.</p>
          )}
        </section>

        <section>
          <h3 className="mb-2 font-data text-[10px] uppercase tracking-[0.18em] text-ink-950/50">
            AI-generated pain points
          </h3>
          {company.painPoints.length ? (
            <ul className="space-y-1.5">
              {company.painPoints.map((p, i) => (
                <li key={i} className="flex gap-2 text-[13.5px] leading-snug">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-signal" />
                  {p}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] text-ink-950/50">Not available.</p>
          )}
        </section>

        <section>
          <h3 className="mb-2 font-data text-[10px] uppercase tracking-[0.18em] text-ink-950/50">
            Target Customers
          </h3>
          {company.targetCustomers && company.targetCustomers.length ? (
            <ul className="space-y-1.5">
              {company.targetCustomers.map((p, i) => (
                <li key={i} className="flex gap-2 text-[13.5px] leading-snug">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-signal" />
                  {p}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] text-ink-950/50">Not available.</p>
          )}
        </section>

        <section>
          <h3 className="mb-2 font-data text-[10px] uppercase tracking-[0.18em] text-ink-950/50">
            Competitors ({competitors.length})
          </h3>
          {competitors.length ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {competitors.map((c, i) => (
                <div
                  key={i}
                  className="rounded-md border border-paper-dim bg-white/40 px-3 py-2"
                >
                  <p className="text-[13.5px] font-medium">{c.name}</p>
                  <a
                    href={c.website}
                    target="_blank"
                    rel="noreferrer"
                    className="font-data text-[11.5px] text-wire-teal hover:underline"
                  >
                    {c.website}
                  </a>
                  <p className="mt-0.5 text-[12px] text-ink-950/60">
                    {c.reason}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-ink-950/50">
              No competitors identified.
            </p>
          )}
        </section>


        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 border-t border-paper-dim pt-6">
          <section>
            <h3 className="mb-2 font-data text-[10px] uppercase tracking-[0.18em] text-ink-950/50">
              AI Confidence
            </h3>
            <p className="text-[13px] font-medium text-ink-950/90">
              {company.confidenceScore || "Unknown"}
            </p>
          </section>

          {result.crawlStats && (
            <section>
              <h3 className="mb-2 font-data text-[10px] uppercase tracking-[0.18em] text-ink-950/50">
                Crawl Statistics
              </h3>
              <div className="text-[12px] text-ink-950/80 space-y-1">
                <p>Pages Crawled: {result.crawlStats.pagesCrawled}</p>
                <p>Pages Ignored: {result.crawlStats.pagesIgnored}</p>
                <p>Words Extracted: {result.crawlStats.wordsExtracted.toLocaleString()}</p>
              </div>
            </section>
          )}

          <section>
            <h3 className="mb-2 font-data text-[10px] uppercase tracking-[0.18em] text-ink-950/50">
              Sources
            </h3>
            <ul className="text-[11px] text-ink-950/70 space-y-1 truncate max-w-[250px]">
              {result.crawledPages.slice(0, 3).map((url, i) => (
                <li key={i}>
                  <a href={url} target="_blank" rel="noreferrer" className="hover:underline text-signal">
                    {new URL(url).pathname || "/"}
                  </a>
                </li>
              ))}
              {result.crawledPages.length > 3 && (
                <li>+ {result.crawledPages.length - 3} more pages</li>
              )}
              {result.sourcesUsed.map((s, i) => (
                <li key={`src-${i}`}>{s.replace('serper:', 'Serper: ').replace('_', ' ')}</li>
              ))}
            </ul>
          </section>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 border-t border-paper-dim pt-4">
          <button
            onClick={downloadPdf}
            disabled={downloading}
            className="inline-flex items-center gap-2 rounded-full bg-ink-950 px-4 py-2 font-data text-[12px] uppercase tracking-wide text-paper transition-opacity hover:opacity-85 disabled:opacity-50"
          >
            {downloading ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Download size={13} />
            )}
            Download PDF
          </button>

          {discordConfig?.botToken && discordConfig?.channelId && (
            <button
              onClick={sendToDiscord}
              disabled={sending}
              className="inline-flex items-center gap-2 rounded-full border border-ink-950/20 px-4 py-2 font-data text-[12px] uppercase tracking-wide text-ink-950/80 transition-colors hover:border-ink-950/40 disabled:opacity-50"
            >
              {sending ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Send size={13} />
              )}
              Send to Discord
            </button>
          )}

          {sendMessage && (
            <span
              className={`font-data text-[11.5px] ${
                sendStatus === "error" ? "text-danger" : "text-wire-teal"
              }`}
            >
              {sendMessage}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
