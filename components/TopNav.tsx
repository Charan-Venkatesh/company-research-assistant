import Link from "next/link";
import { Settings, FileSearch } from "lucide-react";

export default function TopNav({ active }: { active: "chat" | "settings" }) {
  return (
    <header className="flex items-center justify-between border-b border-hairline px-5 py-3 sm:px-8">
      <Link href="/" className="flex items-center gap-2.5 group">
        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-signal/60 text-signal">
          <FileSearch size={15} strokeWidth={2} />
        </span>
        <span className="font-display text-[17px] font-semibold tracking-tight text-ink-text">
          Dossier
        </span>
        <span className="hidden font-data text-[10px] uppercase tracking-[0.18em] text-muted sm:inline">
          / company research
        </span>
      </Link>

      <Link
        href="/settings"
        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-data text-[11px] uppercase tracking-wide transition-colors ${
          active === "settings"
            ? "border-signal text-signal"
            : "border-hairline text-muted hover:text-ink-text hover:border-muted"
        }`}
      >
        <Settings size={13} />
        Integrations
      </Link>
    </header>
  );
}
