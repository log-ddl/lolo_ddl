import { FeatureRail } from "@/shared/components/FeatureRail";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/shared/components/ui/resizable";
import { useEditorShortcuts } from "../hooks/use-editor-shortcuts";
import { EditorHeader } from "./editor-header";
import { AssetsPanel } from "./panels/assets-panel";
import { PropertiesPanel } from "./panels/properties-panel";
import { PreviewPanel } from "./preview/preview-panel";
import { Timeline } from "./timeline/timeline";

/**
 * The Auto Edit editor shell — opencut-style 4-region layout:
 * assets (left) / preview + timeline (center) / properties (right).
 */
export function EditorShell() {
  useEditorShortcuts();
  return (
    <div className="flex h-full min-w-0 bg-background text-foreground">
      <FeatureRail />

      <div className="flex min-w-0 flex-1 flex-col">
        <EditorHeader />

        <div className="min-h-0 min-w-0 flex-1">
          <ResizablePanelGroup direction="vertical" className="min-h-0 min-w-0">
            {/* Top row: assets / preview / properties */}
            <ResizablePanel defaultSize={62} minSize={30} className="min-h-0 min-w-0">
              <ResizablePanelGroup direction="horizontal" className="min-h-0 min-w-0">
                <ResizablePanel defaultSize={18} minSize={14} maxSize={28} className="min-w-0">
                  <div className="h-full min-w-0 overflow-hidden border-r border-border/60 bg-panel">
                    <AssetsPanel />
                  </div>
                </ResizablePanel>

                <ResizableHandle />

                <ResizablePanel defaultSize={58} minSize={30} className="min-w-0">
                  <PreviewPanel />
                </ResizablePanel>

                <ResizableHandle />

                <ResizablePanel defaultSize={24} minSize={16} maxSize={32} className="min-w-0">
                  <div className="h-full min-w-0 overflow-hidden border-l border-border/60 bg-panel">
                    <PropertiesPanel />
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>

            <ResizableHandle />

            {/* The timeline spans the full window width (DaVinci/Premiere style) rather
                than being boxed into the centre column. */}
            <ResizablePanel defaultSize={38} minSize={20} className="min-h-0 min-w-0">
              <Timeline />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </div>
  );
}
