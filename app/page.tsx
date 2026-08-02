import TopNav from "@/components/TopNav";
import ResearchConsole from "@/components/ResearchConsole";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-ink-950">
      <TopNav active="chat" />
      <ResearchConsole />
    </div>
  );
}
