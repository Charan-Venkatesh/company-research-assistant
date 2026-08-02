"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { NVIDIA_DEFAULT_MODELS } from "@/lib/types";

export default function ModelSelect({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (model: string) => void;
  disabled?: boolean;
}) {
  const [models, setModels] = useState<string[]>([...NVIDIA_DEFAULT_MODELS]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/models")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data.models) && data.models.length) {
          setModels(data.models);
        }
      })
      .catch(() => {
        /* fall back to defaults, already set */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="relative">
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-md border border-hairline bg-panel-700 py-2 pl-3 pr-8 font-data text-[12px] text-ink-text outline-none transition-colors focus:border-signal disabled:opacity-50"
      >
        {models.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted"
      />
    </div>
  );
}
