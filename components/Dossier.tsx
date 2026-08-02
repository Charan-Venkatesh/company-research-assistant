"use client";

import { useState } from "react";
import { Download, CheckCircle, Loader2 } from "lucide-react";
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
    <div className="stamp-enter relative rounded-2xl border border-hairline bg-panel-800 p-8 shadow-xl text-ink-text mb-16">
      <div className="flex items-center justify-between border-b border-hairline pb-6">
        <div>
          <h2 className="font-display text-4xl font-bold tracking-tight text-white mb-2">
            {company.name}
          </h2>
          <a
            href={company.website}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 font-data text-sm text-[#e0b466] hover:underline"
          >
            {company.website}
          </a>
        </div>
        <div className="rounded-full border border-wire-teal/30 bg-wire-teal/10 px-3 py-1 font-data text-[10px] uppercase tracking-widest text-wire-teal font-semibold">
          RESEARCH COMPLETE
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4">
        <div className="bg-panel-700/50 rounded-xl p-4 border border-hairline">
           <label className="block text-[10px] font-data uppercase tracking-widest text-muted mb-2">Phone</label>
           <div className="flex flex-col gap-0.5" title={company.phoneSource ? `Source: ${company.phoneSource}` : undefined}>
              <span className="font-medium text-[15px]">
                 {company.phone ?? "Not publicly listed"}
              </span>
           </div>
        </div>
        <div className="bg-panel-700/50 rounded-xl p-4 border border-hairline">
           <label className="block text-[10px] font-data uppercase tracking-widest text-muted mb-2">Address</label>
           <div className="flex flex-col gap-0.5" title={company.addressSource ? `Source: ${company.addressSource}` : undefined}>
              <span className="font-medium text-[15px]">
                 {company.address ?? "Not publicly listed"}
              </span>
           </div>
        </div>
      </div>

      <div className="mt-8 space-y-8">
        <section>
          <h3 className="mb-3 font-data text-[11px] font-semibold uppercase tracking-widest text-muted">
            Products &amp; services
          </h3>
          {company.productsServices.length ? (
            <div className="flex flex-wrap gap-2">
              {company.productsServices.map((p, i) => (
                <span
                  key={i}
                  className="rounded-md border border-[#303348] bg-[#22243a] px-4 py-2 text-[13px] text-white/90"
                >
                  {p}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">Not available.</p>
          )}
        </section>

        <section>
          <h3 className="mb-3 font-data text-[11px] font-semibold uppercase tracking-widest text-[#e0b466]">
            AI-generated pain points
          </h3>
          {company.painPoints.length ? (
            <ul className="space-y-3">
              {company.painPoints.map((p, i) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed text-ink-text/90">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#e0b466]" />
                  {p}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Not available.</p>
          )}
        </section>

        <section>
          <h3 className="mb-4 font-data text-[11px] font-semibold uppercase tracking-widest text-muted">
            Competitors
          </h3>
          {competitors.length ? (
            <div className="grid gap-3 sm:grid-cols-3">
              {competitors.map((c, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-[#2b2d42] bg-[#1b1c2b] px-4 py-4"
                >
                  <p className="text-sm font-semibold text-white mb-1">{c.name}</p>
                  <a
                    href={c.website}
                    target="_blank"
                    rel="noreferrer"
                    className="font-data text-xs text-[#848aff] hover:underline"
                  >
                    {c.website}
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">
              No competitors identified.
            </p>
          )}
        </section>

        <div className="flex flex-wrap items-center gap-4 border-t border-hairline pt-6">
          <button
            onClick={downloadPdf}
            disabled={downloading}
            className="inline-flex items-center gap-2 rounded-lg bg-[#e0b466] hover:bg-[#d1a557] px-6 py-2.5 text-sm font-semibold text-ink-950 transition-colors disabled:opacity-50"
          >
            {downloading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Download size={16} />
            )}
            Download PDF Report
          </button>

          {discordConfig?.botToken && discordConfig?.channelId && (
            <button
              onClick={sendToDiscord}
              disabled={sending || sendStatus === "ok"}
              className={`inline-flex items-center gap-2 rounded-lg border px-6 py-2.5 text-sm font-semibold transition-colors disabled:opacity-80
                ${sendStatus === "ok" ? "bg-wire-teal/20 border-wire-teal text-wire-teal" : "border-hairline bg-panel-700 text-white hover:bg-panel-700/80"}`}
            >
              {sending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : sendStatus === "ok" ? (
                <CheckCircle size={16} />
              ) : null}
              {sendStatus === "ok" ? "Sent to Discord" : "Send to Discord"}
            </button>
          )}

          {sendMessage && sendStatus === "error" && (
            <span className="font-data text-xs text-danger">
              {sendMessage}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
