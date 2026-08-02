"use client";

import { useState } from "react";
import { Save, ShieldCheck } from "lucide-react";
import TopNav from "@/components/TopNav";
import {
  readApplicantInfo,
  readDiscordConfig,
  writeApplicantInfo,
  writeDiscordConfig,
} from "@/lib/clientConfig";

export default function SettingsPage() {
  const [botToken, setBotToken] = useState(
    () => readDiscordConfig()?.botToken ?? ""
  );
  const [channelId, setChannelId] = useState(
    () => readDiscordConfig()?.channelId ?? ""
  );
  const [name, setName] = useState(() => readApplicantInfo().name ?? "");
  const [email, setEmail] = useState(() => readApplicantInfo().email ?? "");
  const [saved, setSaved] = useState(false);

  function save() {
    writeDiscordConfig({ botToken, channelId });
    writeApplicantInfo({ name, email });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="min-h-screen bg-ink-950">
      <TopNav active="settings" />

      <div className="mx-auto max-w-xl px-4 py-10 sm:px-8">
        <h1 className="font-display text-2xl font-semibold text-ink-text">
          Discord integration
        </h1>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">
          After a report is generated, it can be posted automatically to a
          Discord channel along with applicant details. Nothing here is sent
          anywhere until you click{" "}
          <span className="text-ink-text">Send to Discord</span> on a
          finished dossier — this just stores the config in your browser.
        </p>

        <div className="mt-6 space-y-4 rounded-xl border border-hairline bg-panel-800/50 p-5">
          <div>
            <label className="mb-1.5 block font-data text-[10px] uppercase tracking-[0.18em] text-muted">
              Discord bot token
            </label>
            <input
              type="password"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              placeholder="•••••••••••••••••••••••"
              className="w-full rounded-md border border-hairline bg-panel-700 px-3 py-2 font-data text-[13px] text-ink-text outline-none placeholder:text-muted focus:border-signal"
            />
          </div>

          <div>
            <label className="mb-1.5 block font-data text-[10px] uppercase tracking-[0.18em] text-muted">
              Discord channel ID
            </label>
            <input
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              placeholder="1234567890123456789"
              className="w-full rounded-md border border-hairline bg-panel-700 px-3 py-2 font-data text-[13px] text-ink-text outline-none placeholder:text-muted focus:border-signal"
            />
          </div>

          <div className="grid gap-4 border-t border-hairline pt-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block font-data text-[10px] uppercase tracking-[0.18em] text-muted">
                Applicant name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full rounded-md border border-hairline bg-panel-700 px-3 py-2 text-[13.5px] text-ink-text outline-none placeholder:text-muted focus:border-signal"
              />
            </div>
            <div>
              <label className="mb-1.5 block font-data text-[10px] uppercase tracking-[0.18em] text-muted">
                Applicant email
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-md border border-hairline bg-panel-700 px-3 py-2 text-[13.5px] text-ink-text outline-none placeholder:text-muted focus:border-signal"
              />
            </div>
          </div>

          <button
            onClick={save}
            className="inline-flex items-center gap-2 rounded-full bg-signal px-4 py-2 font-data text-[12px] uppercase tracking-wide text-ink-950 transition-opacity hover:opacity-90"
          >
            <Save size={13} />
            Save configuration
          </button>
          {saved && (
            <span className="ml-3 inline-flex items-center gap-1.5 font-data text-[11.5px] text-wire-teal">
              <ShieldCheck size={13} /> Saved locally
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
