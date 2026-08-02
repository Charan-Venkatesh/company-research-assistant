"use client";

import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import ProgressLog, { type ProgressItem } from "./ProgressLog";
import Dossier from "./Dossier";
import type { ResearchResult, AiProvider } from "@/lib/types";

interface LogEntry {
  id: string;
  role: "user" | "system";
  text: string;
}

const STEP_ORDER = ["resolve", "search", "crawl", "analyze", "competitors", "done"];

function initialProgress(): ProgressItem[] {
  return STEP_ORDER.map((step) => ({ step, status: "pending" as const }));
}

export default function ResearchConsole() {
  const [input, setInput] = useState("");
  const [model] = useState("openai/gpt-4o-mini");
  const [provider] = useState<AiProvider>("openrouter");
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [progress, setProgress] = useState<ProgressItem[]>([]);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function runResearch(forcedInput?: string) {
    const query = forcedInput || input;
    const trimmed = query.trim();
    if (!trimmed || loading) return;

    setEntries((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", text: trimmed },
    ]);
    setInput("");
    setResult(null);
    setError(null);
    setProgress(initialProgress());
    setLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: trimmed, model, provider }),
        signal: controller.signal,
      });

      if (!res.body) throw new Error("No response stream from server.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";

        for (const chunk of chunks) {
          const eventMatch = chunk.match(/^event: (.+)$/m);
          const dataMatch = chunk.match(/^data: (.+)$/m);
          if (!eventMatch || !dataMatch) continue;
          const event = eventMatch[1];
          const data = JSON.parse(dataMatch[1]);

          if (event === "progress") {
            setProgress((prev) =>
              prev.map((p) =>
                p.step === data.step
                  ? { ...p, status: data.status, detail: data.detail }
                  : p
              )
            );
          } else if (event === "result") {
            setResult(data as ResearchResult);
            setEntries((prev) => [
              ...prev,
              {
                id: crypto.randomUUID(),
                role: "system",
                text: `Dossier assembled for ${data.company.name}. ${data.competitors.length} competitor(s) identified.`,
              },
            ]);
          } else if (event === "error") {
            setError(data.message);
            setEntries((prev) => [
              ...prev,
              { id: crypto.randomUUID(), role: "system", text: `Error: ${data.message}` },
            ]);
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      runResearch();
    }
  }

  const isStarted = loading || result || error || entries.length > 0;

  return (
    <>
      {/* Header bar within main content */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-hairline/0">
         <div className="flex items-center gap-3 text-sm">
            <span className="font-semibold text-white">Company Research</span>
            <span className="flex items-center gap-1.5 rounded-full border border-wire-teal/30 bg-wire-teal/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-wire-teal">
              <span className="w-1.5 h-1.5 rounded-full bg-wire-teal animate-pulse"></span>
              LIVE
            </span>
         </div>
      </header>

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto w-full flex flex-col relative px-8 pb-32">
        {!isStarted ? (
          <div className="flex-1 flex flex-col items-center justify-center -mt-20">
             <div className="text-center max-w-2xl mx-auto">
               <p className="text-[11px] font-data uppercase tracking-[0.2em] text-[#e0b466] mb-4">AI-Powered Intelligence</p>
               <h2 className="text-4xl sm:text-5xl font-display font-bold text-white leading-[1.15] mb-6">
                 Know any company<br/>in minutes.
               </h2>
               <p className="text-sm text-muted max-w-md mx-auto mb-10 leading-relaxed">
                 Enter a company name or website URL to get AI-powered insights, competitor analysis, pain points, and a professional PDF report.
               </p>

               <div className="flex items-center justify-center gap-3 mb-10">
                 {["stripe.com", "Tesla", "Microsoft", "OpenAI"].map((c) => (
                   <button
                     key={c}
                     onClick={() => runResearch(c)}
                     className="px-4 py-1.5 rounded-full border border-hairline bg-panel-700/50 hover:bg-panel-700 text-xs font-data text-ink-text/80 transition-colors"
                   >
                     {c}
                   </button>
                 ))}
               </div>

               <div className="flex items-center gap-4 text-muted justify-center opacity-50">
                 <div className="h-px bg-hairline w-12"></div>
                 <span className="text-[10px] uppercase tracking-widest">Configure API keys in the sidebar to get started</span>
                 <div className="h-px bg-hairline w-12"></div>
               </div>
             </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto w-full pt-8">
            <div className="mb-8">
              {loading && <ProgressLog items={progress} />}
              {error && (
                <div className="rounded-xl border border-danger/30 bg-danger/10 p-4 mt-4">
                  <p className="font-data text-[12px] text-danger">Error: {error}</p>
                </div>
              )}
            </div>

            {result && (
              <Dossier result={result} />
            )}
          </div>
        )}
      </div>

      {/* Fixed bottom search bar */}
      <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-ink-950 via-ink-950 to-transparent flex flex-col items-center">
        <div className="w-full max-w-3xl relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder="Enter a company name (e.g. Stripe) or website URL (e.g. https://stripe.com)..."
            className="w-full bg-panel-800 border border-hairline rounded-xl pl-5 pr-32 py-4 text-sm text-white placeholder-muted focus:outline-none focus:border-signal disabled:opacity-60 shadow-lg"
          />
          <button
            onClick={() => runResearch()}
            disabled={loading || !input.trim()}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-[#e0b466] hover:bg-[#d1a557] text-ink-950 font-semibold text-xs px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : "Research →"}
          </button>
        </div>
        <div className="mt-3 text-[10px] font-data text-muted uppercase tracking-widest flex items-center gap-2">
          <span>Enter to research</span>
          <span>·</span>
          <span>Shift+Enter for new line</span>
        </div>
      </div>
    </>
  );
}
