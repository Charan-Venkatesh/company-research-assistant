import Sidebar from "@/components/Sidebar";
import ResearchConsole from "@/components/ResearchConsole";

export default function Home() {
  return (
    <div className="flex min-h-screen bg-ink-950">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden relative h-screen">
        <ResearchConsole />
      </main>
    </div>
  );
}
