"use client";

import { Check, Loader2, X } from "lucide-react";

export interface ProgressItem {
  step: string;
  status: "pending" | "active" | "done" | "error";
  detail?: string;
}

const STEP_LABELS: Record<string, string> = {
  resolve: "Resolving official website",
  search: "Searching public sources",
  crawl: "Crawling site pages",
  analyze: "Running AI analysis",
  competitors: "Mapping competitors",
  done: "Report assembled",
};

function StatusIcon({ status }: { status: ProgressItem["status"] }) {
  if (status === "done")
    return (
      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-wire-teal/20 text-wire-teal">
        <Check size={11} strokeWidth={3} />
      </span>
    );
  if (status === "active")
    return (
      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-signal/20 text-signal">
        <Loader2 size={11} strokeWidth={3} className="animate-spin" />
      </span>
    );
  if (status === "error")
    return (
      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-danger/20 text-danger">
        <X size={11} strokeWidth={3} />
      </span>
    );
  return (
    <span className="h-4 w-4 rounded-full border border-hairline" />
  );
}

export default function ProgressLog({ items }: { items: ProgressItem[] }) {
  if (!items.length) return null;
  return (
    <div className="rounded-lg border border-hairline bg-panel-800/60 p-3.5">
      <p className="mb-2.5 font-data text-[10px] uppercase tracking-[0.18em] text-muted">
        Case log
      </p>
      <ul className="space-y-2.5">
        {items.map((item) => (
          <li key={item.step} className="flex items-start gap-2.5">
            <StatusIcon status={item.status} />
            <div className="min-w-0 flex-1">
              <p
                className={`text-[13px] leading-tight ${
                  item.status === "pending" ? "text-muted" : "text-ink-text"
                }`}
              >
                {STEP_LABELS[item.step] ?? item.step}
              </p>
              {item.detail && (
                <p className="truncate font-data text-[11px] text-muted">
                  {item.detail}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
