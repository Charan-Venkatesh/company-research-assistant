"use client";

import { useRef, useState } from "react";
import { ArrowUp, FileSearch, Loader2 } from "lucide-react";
import ModelSelect from "./ModelSelect";
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
  const [model, setModel] = useState("openai/gpt-4o-mini");
  const [provider, setProvider] = useState<AiProvider>("openrouter");
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [progress, setProgress] = useState<ProgressItem[]>([]);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function runResearch() {
    const trimmed = input.trim();
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

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      runResearch();
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 gap-6 px-4 py-6 sm:px-8 lg:grid-cols-[420px_1fr]">
      {/* Left: console */}
      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-hairline bg-panel-800/50 p-4">
          <div className="mb-4 flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer font-data text-[12px] text-muted hover:text-ink-text">
              <input
                type="radio"
                name="provider"
                value="openrouter"
                checked={provider === "openrouter"}
                onChange={() => setProvider("openrouter")}
                className="accent-signal"
              />
              OpenRouter
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-data text-[12px] text-muted hover:text-ink-text">
              <input
                type="radio"
                name="provider"
                value="nvidia"
                checked={provider === "nvidia"}
                onChange={() => setProvider("nvidia")}
                className="accent-signal"
              />
              NVIDIA NIM
            </label>
          </div>
          <label className="mb-1.5 block font-data text-[10px] uppercase tracking-[0.18em] text-muted">
            AI model ({provider === "nvidia" ? "NVIDIA" : "OpenRouter"})
          </label>
          {provider === "nvidia" ? (
             <select
               value={model}
               onChange={(e) => setModel(e.target.value)}
               disabled={loading}
               className="w-full rounded-md border border-hairline bg-panel-700 px-3 py-2 text-[13px] text-ink-text outline-none focus:border-signal disabled:opacity-50"
             >
               <option value="deepseek-ai/deepseek-v4-pro">deepseek-ai/deepseek-v4-pro</option>
             </select>
          ) : (
            <ModelSelect value={model} onChange={setModel} disabled={loading} />
          )}
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto rounded-xl border border-hairline bg-panel-800/30 p-4 min-h-[220px] max-h-[420px] lg:max-h-none">
          {entries.length === 0 && (
            <p className="font-data text-[12.5px] leading-relaxed text-muted">
              Enter a company name (e.g. &quot;Stripe&quot;) or a website URL
              (e.g. &quot;https://stripe.com&quot;) below to start a research
              run.
            </p>
          )}
          {entries.map((entry) => (
            <div
              key={entry.id}
              className={`rounded-lg px-3 py-2 text-[13.5px] leading-snug ${
                entry.role === "user"
                  ? "bg-signal/15 text-ink-text"
                  : "bg-panel-700 text-ink-text/90"
              }`}
            >
              {entry.text}
            </div>
          ))}
          {loading && <ProgressLog items={progress} />}
        </div>

        <div className="rounded-xl border border-hairline bg-panel-800/50 p-3">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Company name or website URL…"
              rows={2}
              disabled={loading}
              className="flex-1 resize-none rounded-md border border-hairline bg-panel-700 px-3 py-2 text-[13.5px] text-ink-text outline-none placeholder:text-muted focus:border-signal disabled:opacity-60"
            />
            <button
              onClick={runResearch}
              disabled={loading || !input.trim()}
              aria-label="Start research"
              className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-signal text-ink-950 transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <ArrowUp size={16} strokeWidth={2.5} />
              )}
            </button>
          </div>
          {error && (
            <p className="mt-2 font-data text-[11.5px] text-danger">{error}</p>
          )}
        </div>
      </div>

      {/* Right: dossier */}
      <div className="min-h-[320px]">
        {result ? (
          <Dossier result={result} />
        ) : (
          <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-hairline text-center">
            <FileSearch size={26} className="mb-3 text-muted" />
            <p className="max-w-xs font-data text-[12.5px] text-muted">
              The assembled dossier — company profile, pain points, and
              competitors — will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
