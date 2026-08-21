import { lazy, Suspense, useEffect, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { TabBar } from "./TabBar";
import { PreviewPanel } from "./PreviewPanel";
import { RightPanel } from "./RightPanel";
import { Dashboard } from "./Dashboard";
import { ProjectHeader } from "./ProjectHeader";
import { VIDEO_STUDIO_FEATURE_FLAGS, useMediaPanelStore } from "@/features/video-studio/stores/media-panel-store";
import { useProjectStore } from "@/features/video-studio/stores/project-store";
import { useLicenseStore } from "@/shared/stores/license-store";
import { hasPlanAccess } from "@/shared/lib/license-client";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/shared/components/ui/resizable";

const ScriptView = lazy(() => import("@/features/video-studio/components/panels/script").then((module) => ({ default: module.ScriptView })));
const DirectorView = lazy(() => import("@/features/video-studio/components/panels/director").then((module) => ({ default: module.DirectorView })));
const CharactersView = lazy(() => import("@/features/video-studio/components/panels/characters").then((module) => ({ default: module.CharactersView })));
const ScenesView = lazy(() => import("@/features/video-studio/components/panels/scenes").then((module) => ({ default: module.ScenesView })));
const MediaView = lazy(() => import("@/features/video-studio/components/panels/media").then((module) => ({ default: module.MediaView })));
const SettingsPanel = lazy(() => import("@/features/video-studio/components/panels/SettingsPanel").then((module) => ({ default: module.SettingsPanel })));
const ExportView = lazy(() => import("@/features/video-studio/components/panels/export").then((module) => ({ default: module.ExportView })));
const AutoVideoView = lazy(() => import("@/features/video-studio/components/panels/auto-video").then((module) => ({ default: module.AutoVideoView })));
const AutopilotPanel = lazy(() => import("@/features/video-studio/components/panels/autopilot/autopilot-panel").then((module) => ({ default: module.AutopilotPanel })));
const OverviewPanel = lazy(() => import("@/features/video-studio/components/panels/overview").then((module) => ({ default: module.OverviewPanel })));
const PromptImportView = lazy(() => import("@/features/video-studio/components/panels/prompt-import").then((module) => ({ default: module.PromptImportView })));

function LazyPanel({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="h-full flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}>
      {children}
    </Suspense>
  );
}

export function Layout() {
  const { activeTab, inProject, setActiveTab } = useMediaPanelStore();
  const activeProject = useProjectStore((state) => state.activeProject);
  const plan = useLicenseStore((state) => state.plan);
  const autoVideoBlocked = inProject && activeTab === "autoVideo" && (
    !VIDEO_STUDIO_FEATURE_FLAGS.autoVideoVisible || !hasPlanAccess(plan, "dev")
  );
  const autopilotBlocked = inProject && activeTab === "autopilot" && !hasPlanAccess(plan, "dev");
  const effectiveTab = autoVideoBlocked || autopilotBlocked ? "overview" : activeTab;

  useEffect(() => {
    if (autoVideoBlocked || autopilotBlocked) setActiveTab("overview");
  }, [autoVideoBlocked, autopilotBlocked, setActiveTab]);

  if (inProject && !activeProject) {
    return (
      <div className="h-full flex bg-background">
        <TabBar />
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex-1 min-h-0">
            <Dashboard />
          </div>
        </div>
      </div>
    );
  }

  // Dashboard mode - show full-screen dashboard or settings
  if (!inProject) {
    return (
      <div className="h-full flex bg-background">
        <TabBar />
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex-1 min-h-0">
            {activeTab === "settings" ? <LazyPanel><SettingsPanel /></LazyPanel> : <Dashboard />}
          </div>
        </div>
      </div>
    );
  }

  // Full-screen views (no resizable panels)
  // These tabs manage their own multi-column layouts and do not need the global preview/properties panels.
  const fullScreenTabs = ["export", "autoVideo", "autopilot", "settings", "overview", "script", "promptImport", "characters", "scenes"];
  if (fullScreenTabs.includes(effectiveTab)) {
    return (
      <div className="h-full flex bg-background">
        <TabBar />
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <ProjectHeader />
          <LazyPanel>
            {effectiveTab === "export" && <ExportView />}
            {effectiveTab === "autoVideo" && <AutoVideoView />}
            {effectiveTab === "autopilot" && <AutopilotPanel />}
            {effectiveTab === "settings" && <SettingsPanel />}
            {effectiveTab === "overview" && <OverviewPanel />}
            {effectiveTab === "script" && <ScriptView />}
            {effectiveTab === "promptImport" && <PromptImportView />}
            {effectiveTab === "characters" && <CharactersView />}
            {effectiveTab === "scenes" && <ScenesView />}
          </LazyPanel>
        </div>
      </div>
    );
  }

  // Left panel content based on active tab
  const renderLeftPanel = () => {
    let panel: ReactNode;
    switch (activeTab) {
      case "script":
        panel = <ScriptView />;
        break;
      case "promptImport":
        panel = <PromptImportView />;
        break;
      case "director":
        // Keep the existing AI Director behavior.
        panel = <DirectorView />;
        break;
      case "characters":
        panel = <CharactersView />;
        break;
      case "scenes":
        panel = <ScenesView />;
        break;
      case "media":
        panel = <MediaView />;
        break;
      case "settings":
        panel = <SettingsPanel />;
        break;
      default:
        panel = <ScriptView />;
    }
    return <LazyPanel>{panel}</LazyPanel>;
  };

  // Right panel content based on active tab
  const renderRightPanel = () => {
    return <RightPanel />;
  };

  return (
    <div className="h-full flex bg-background">
      {/* Left: TabBar - full height */}
      <TabBar />

      {/* Right content area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top: Project Header with save status */}
        <ProjectHeader />
        
        {/* Main content with resizable panels */}
        <div className="flex-1 min-h-0 min-w-0">
          <ResizablePanelGroup direction="horizontal" className="min-h-0 min-w-0">
            {/* Left Panel: Content based on active tab */}
            <ResizablePanel defaultSize={30} minSize={20} maxSize={42} className="min-w-0">
              <div className="h-full min-w-0 overflow-hidden bg-panel border-r border-border/60">
                {renderLeftPanel()}
              </div>
            </ResizablePanel>

            <ResizableHandle />

            {/* Center: Preview */}
            <ResizablePanel defaultSize={45} minSize={24} className="min-w-0">
              <div className="h-full min-w-0 overflow-hidden">
                <PreviewPanel />
              </div>
            </ResizablePanel>

            <ResizableHandle />

            {/* Right: Properties */}
            <ResizablePanel defaultSize={25} minSize={18} maxSize={35} className="min-w-0">
              <div className="h-full min-w-0 overflow-hidden border-l border-border/60 bg-panel">
                {renderRightPanel()}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </div>
  );
}
