"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { readDiscordConfig, writeDiscordConfig, readApplicantInfo, writeApplicantInfo } from "@/lib/clientConfig";

export default function Sidebar() {
  const [tab, setTab] = useState<"api" | "discord">("discord");

  const [botToken, setBotToken] = useState("");
  const [channelId, setChannelId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const dc = readDiscordConfig();
    if (dc) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBotToken(dc.botToken);
      setChannelId(dc.channelId);
    }
    const ai = readApplicantInfo();
    if (ai) {
      setName(ai.name);
      setEmail(ai.email);
    }
  }, []);

  function handleSave() {
    writeDiscordConfig({ botToken, channelId });
    writeApplicantInfo({ name, email });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <aside className="w-80 border-r border-hairline bg-[#131518] flex flex-col h-screen overflow-y-auto">
      <div className="p-6 border-b border-hairline">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#e0b466] flex items-center justify-center text-ink-950 font-bold">
            O
          </div>
          <div>
            <h1 className="font-display text-white text-[15px] font-semibold">Research AI</h1>
            <p className="text-[10px] text-muted tracking-widest uppercase">Company Intelligence</p>
          </div>
        </div>

        <button onClick={() => window.location.reload()} className="mt-6 w-full flex items-center gap-2 justify-center py-2 px-4 rounded-md border border-hairline text-ink-text/80 text-sm hover:bg-panel-700 transition-colors cursor-pointer">
          <Plus size={14} className="text-[#e0b466]" />
          New Research
        </button>
      </div>

      <div className="p-6 flex-1">
        <div className="flex bg-panel-700 rounded-md p-1 mb-6">
          <button
            onClick={() => setTab("api")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded ${tab === "api" ? "bg-panel-800 text-white shadow-sm" : "text-muted hover:text-white"}`}
          >
            API
          </button>
          <button
            onClick={() => setTab("discord")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded ${tab === "discord" ? "bg-panel-800 text-white shadow-sm" : "text-muted hover:text-white"}`}
          >
            DISCORD
          </button>
        </div>

        {tab === "discord" && (
          <div className="space-y-5">
            <div className="bg-[#1b1c2b] border border-[#2b2d42] rounded-lg p-4">
              <h3 className="text-[#848aff] text-sm font-semibold mb-1">Discord Bot Integration</h3>
              <p className="text-[#6468a3] text-xs">After research completes, the report auto-sends to your configured channel.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-data uppercase tracking-widest text-muted mb-1.5">Bot Token</label>
                <input
                  type="password"
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  placeholder="Bot token..."
                  className="w-full bg-[#0d0e10] border border-[#24272c] rounded-md px-3 py-2 text-sm text-white placeholder-muted focus:outline-none focus:border-signal"
                />
              </div>

              <div>
                <label className="block text-[10px] font-data uppercase tracking-widest text-muted mb-1.5">Channel ID</label>
                <input
                  type="text"
                  value={channelId}
                  onChange={(e) => setChannelId(e.target.value)}
                  placeholder="000000000000000000"
                  className="w-full bg-[#0d0e10] border border-[#24272c] rounded-md px-3 py-2 text-sm text-white placeholder-muted focus:outline-none focus:border-signal"
                />
              </div>
            </div>

            <div className="space-y-4 pt-2 border-t border-hairline">
              <label className="block text-[10px] font-data uppercase tracking-widest text-muted mb-[-4px]">Applicant Details</label>
              <div>
                <label className="block text-xs text-muted mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full bg-[#0d0e10] border border-[#24272c] rounded-md px-3 py-2 text-sm text-white placeholder-muted focus:outline-none focus:border-signal"
                />
              </div>

              <div>
                <label className="block text-xs text-muted mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full bg-[#0d0e10] border border-[#24272c] rounded-md px-3 py-2 text-sm text-white placeholder-muted focus:outline-none focus:border-signal"
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              className="w-full py-2 bg-[#6b72ff] hover:bg-[#5a61e6] text-white rounded-md text-sm font-semibold transition-colors mt-4"
            >
              {saved ? "Saved ✓" : "Save Discord Config"}
            </button>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-hairline text-muted">
         <div className="flex gap-4 text-[10px] font-data uppercase tracking-widest">
            <span>OpenRouter</span>
            <span>·</span>
            <span>Serper</span>
            <span>·</span>
            <span>jsPDF</span>
         </div>
      </div>
    </aside>
  );
}
