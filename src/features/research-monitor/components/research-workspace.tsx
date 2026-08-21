import { lazy, Suspense, useState } from "react";
import { Loader2 } from "lucide-react";
import type { ResearchView } from "../types";
import { DiscoverView } from "./discover/discover-view";
import { MonitorView } from "./monitor/monitor-view";
import { CommentsView } from "./comments/comments-view";
import { ResearchHeader } from "./research-header";
import { ResearchSidebar } from "./research-sidebar";
import { ResearchSettings } from "./settings/research-settings";
import { useResearchScanner } from "../hooks/use-research-scanner";

const MediaToolkit = lazy(() => import("@/features/media-toolkit/entry"));

export function ResearchWorkspace() {
  const [activeView, setActiveView] = useState<ResearchView>("discover");
  useResearchScanner();

  return (
    <div className="flex h-full min-h-0 bg-background text-foreground">
      <ResearchSidebar activeView={activeView} onViewChange={setActiveView} />
      <div className="flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden">
        {activeView !== "tools" && <ResearchHeader activeView={activeView} />}
        {activeView === "discover" && <DiscoverView />}
        {activeView === "monitor" && <MonitorView />}
        {activeView === "comments" && <CommentsView />}
        {activeView === "tools" && (
          <Suspense fallback={<div className="flex h-full items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>}>
            <MediaToolkit embedded />
          </Suspense>
        )}
        {activeView === "settings" && <ResearchSettings />}
      </div>
    </div>
  );
}
