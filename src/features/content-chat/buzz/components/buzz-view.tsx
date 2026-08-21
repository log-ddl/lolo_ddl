import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bot,
  Copy,
  FolderOpen,
  History,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Radar,
  Trash2,
  Workflow,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { FeatureHeaderIcon } from "@/shared/components/FeatureHeaderIcon";
import { Button } from "@/shared/components/ui/button";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { cn } from "@/shared/lib/utils";
import { getCliRuntimeStatus, type CliRuntimeStatus } from "@/features/video-studio/lib/cli-runtime";
import { useBuzzStore } from "../buzz-store";
import { abortRun, isRunnerBusy, startRun } from "../runner";
import { AgentManagerDialog } from "./agent-manager";
import { PipelineEditor } from "./pipeline-editor";
import { RunView } from "./run-view";
import type { BuzzPipeline } from "../types";

export function BuzzView({ onOpenFile }: { onOpenFile: (workspacePath: string | null, filePath: string) => void }) {
  const {
    agents,
    pipelines,
    runs,
    activePipelineId,
    activeRunId,
    hydrated,
    createPipeline,
    deletePipeline,
    duplicatePipeline,
    selectPipeline,
    selectRun,
    updatePipeline,
    deleteRun,
  } = useBuzzStore();

  const [agentsOpen, setAgentsOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [runPanelOpen, setRunPanelOpen] = useState(false);
  const [runningPipelineSnapshot, setRunningPipelineSnapshot] = useState<BuzzPipeline | null>(null);
  const [runningNodeId, setRunningNodeId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [liveOutput, setLiveOutput] = useState<{ stepId: string; text: string } | null>(null);
  const [workspaceInfo, setWorkspaceInfo] = useState<{ path: string; memory: string } | null>(null);
  const [status, setStatus] = useState<CliRuntimeStatus | null>(null);

  const pipeline = pipelines.find((item) => item.id === activePipelineId) ?? pipelines[0] ?? null;
  const run = runs.find((item) => item.id === activeRunId) ?? null;
  const pipelineRuns = useMemo(
    () => runs.filter((item) => item.pipelineId === pipeline?.id),
    [runs, pipeline?.id],
  );

  useEffect(() => {
    void getCliRuntimeStatus().then(setStatus);
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!window.contentWorkspace) return;
    void window.contentWorkspace.ensure(pipeline?.workspacePath ?? null)
      .then((workspace) => { if (!cancelled) setWorkspaceInfo(workspace); })
      .catch((error) => { if (!cancelled) toast.error(error instanceof Error ? error.message : String(error)); });
    return () => { cancelled = true; };
  }, [pipeline?.id, pipeline?.workspacePath]);

  /** Các agent trong pipeline có thể dùng CLI khác nhau — phải kiểm tra đủ bộ. */
  const missingAdapters = useMemo(() => {
    if (!pipeline || !status) return [];
    const used = new Set(
      pipeline.steps
        .flatMap((step) => [
          agents.find((agent) => agent.id === step.agentId)?.adapter,
          step.gate.kind === "agent" ? agents.find((agent) => agent.id === step.gate.judgeAgentId)?.adapter : undefined,
        ])
        .filter((adapter): adapter is NonNullable<typeof adapter> => Boolean(adapter)),
    );
    return [...used].filter((adapter) => !status[adapter]?.available);
  }, [agents, pipeline, status]);

  const chooseWorkspace = useCallback(async () => {
    if (!window.contentWorkspace || !pipeline || busy) return;
    try {
      const result = await window.contentWorkspace.chooseDirectory(workspaceInfo?.path);
      if (result.canceled || !result.path) return;
      updatePipeline(pipeline.id, { workspacePath: result.path });
      setWorkspaceInfo({ path: result.path, memory: result.memory ?? "" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    }
  }, [busy, pipeline, updatePipeline, workspaceInfo?.path]);

  async function handleRun(targetStepId?: string) {
    if (!pipeline || busy || isRunnerBusy()) return;
    const emptyTextInput = (pipeline.inputNodes ?? []).find((node) => node.kind === "text"
      && !node.value.trim()
      && (pipeline.connections ?? []).some((connection) => connection.source === node.id));
    if (emptyTextInput) {
      toast.error(`Input "${emptyTextInput.name}" chưa có nội dung.`);
      return;
    }
    const emptyPathInput = (pipeline.inputNodes ?? []).find((node) => node.kind !== "text"
      && !node.path.trim()
      && (pipeline.connections ?? []).some((connection) => connection.source === node.id));
    if (emptyPathInput) {
      toast.error(`Input "${emptyPathInput.name}" chưa chọn ${emptyPathInput.kind === "file" ? "file" : "folder"}.`);
      return;
    }
    // Chạy thử một node Function thì không có agent step đích — bỏ các kiểm tra theo step.
    const targetFunction = targetStepId
      ? (pipeline.functionNodes ?? []).find((node) => node.id === targetStepId)
      : undefined;
    const executableSteps = targetFunction ? [] : pipeline.steps.filter((step) => !targetStepId || step.id === targetStepId);
    if (!targetFunction && executableSteps.length === 0) {
      toast.error(targetStepId ? "Node này không còn tồn tại." : "Pipeline chưa có bước nào.");
      return;
    }
    const unassigned = executableSteps.find((step) => !step.agentId);
    if (unassigned) {
      toast.error(`Bước "${unassigned.name}" chưa gán agent.`);
      return;
    }
    const missingOutputPath = executableSteps.find((step) => (step.outputKind === "file" || step.outputKind === "folder") && !step.outputFile.trim());
    if (missingOutputPath) {
      toast.error(`Agent "${missingOutputPath.name}" chưa đặt tên đầu ra.`);
      return;
    }
    if (missingAdapters.length > 0) {
      toast.error(`CLI chưa sẵn sàng: ${missingAdapters.join(", ")}`);
      return;
    }

    let workspacePath: string | null = null;
    try {
      const workspace = await window.contentWorkspace!.ensure(pipeline.workspacePath ?? null);
      setWorkspaceInfo(workspace);
      workspacePath = workspace.path;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
      return;
    }

    const graphSnapshot: BuzzPipeline = {
      ...pipeline,
      steps: pipeline.steps.map((step) => ({ ...step, position: step.position ? { ...step.position } : undefined, gate: { ...step.gate } })),
      inputNodes: (pipeline.inputNodes ?? []).map((node) => ({ ...node, position: { ...node.position } })),
      functionNodes: (pipeline.functionNodes ?? []).map((node) => ({ ...node, position: { ...node.position } })),
      connections: (pipeline.connections ?? []).map((connection) => ({ ...connection })),
    };
    setRunningPipelineSnapshot(graphSnapshot);
    setRunningNodeId(targetStepId ?? null);
    setBusy(true);
    setLiveOutput(null);
    try {
      const runId = await startRun({
        pipeline: graphSnapshot,
        topic: "",
        workspacePath,
        targetStepId,
        onStepChunk: (stepId, text) => setLiveOutput({ stepId, text }),
      });
      if (runId) setRunPanelOpen(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      // Runner chỉ ghi lịch sử chạy và không sửa graph thiết kế, vì vậy không ghi
      // ngược snapshot vào store ở đây. Việc đó tạo một lần hydrate/render thừa.
      setRunningPipelineSnapshot(null);
      setRunningNodeId(null);
      setBusy(false);
      setLiveOutput(null);
    }
  }

  // Chưa đọc xong dữ liệu đã lưu thì chưa được vẽ gì — vẽ sớm sẽ hiện nhầm là
  // "chưa có pipeline nào", và mọi thao tác tạo/sửa trong khoảng đó sẽ bị hydrate đè.
  if (!hydrated) {
    return (
      <main className="flex min-w-0 flex-1 items-center justify-center bg-background" aria-label="Buzz">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </main>
    );
  }

  return (
    <>
      <aside className={cn(
        "shrink-0 overflow-hidden border-r border-border/70 bg-sidebar/60 transition-[width,border-color] duration-200 ease-out",
        sidebarCollapsed ? "w-0 border-transparent" : "w-64",
      )}>
        <div className="flex h-full w-64 flex-col">
        <div className="flex gap-2 border-b border-border/60 p-3">
          <Button className="min-w-0 flex-1 justify-start" onClick={() => createPipeline()} disabled={busy}>
            <Plus className="size-4" />
            <span className="truncate">Pipeline mới</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            title="Thu gọn sidebar"
            aria-label="Thu gọn sidebar"
            onClick={() => setSidebarCollapsed(true)}
          >
            <PanelLeftClose className="size-4" />
          </Button>
        </div>

        <ScrollArea className="min-h-0 flex-1 p-2">
          {pipelines.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs leading-5 text-muted-foreground">
              Chưa có pipeline nào.
            </p>
          ) : pipelines.map((item) => (
            <div
              key={item.id}
              className={cn(
                "group mb-1 flex items-center gap-1 rounded-lg border border-transparent px-1.5 py-1 transition-colors",
                item.id === pipeline?.id ? "border-border bg-background shadow-xs" : "hover:bg-sidebar-accent/60",
              )}
            >
              <button
                type="button"
                onClick={() => selectPipeline(item.id)}
                className="min-w-0 flex-1 px-2 py-1.5 text-left"
              >
                <span className="block truncate text-sm font-medium">{item.name}</span>
                <span className="mt-0.5 block text-[10px] text-muted-foreground">
                  {item.steps.length} bước
                </span>
              </button>
              <button
                type="button"
                title="Nhân bản"
                onClick={() => duplicatePipeline(item.id)}
                className="rounded-md p-1.5 text-muted-foreground opacity-0 transition hover:bg-sidebar-accent hover:text-foreground group-hover:opacity-100"
              >
                <Copy className="size-3.5" />
              </button>
              <button
                type="button"
                title="Xoá"
                disabled={busy}
                onClick={() => deletePipeline(item.id)}
                className="rounded-md p-1.5 text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </ScrollArea>

        <div className="border-t border-border/60 p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs font-normal text-muted-foreground"
            onClick={() => setHistoryOpen((open) => !open)}
          >
            <History className="size-4" />
            Lịch sử chạy ({pipelineRuns.length})
          </Button>
          {historyOpen && (
            <div className="mt-1 max-h-52 overflow-y-auto">
              {pipelineRuns.length === 0 ? (
                <p className="px-2 py-3 text-center text-[11px] text-muted-foreground">Chưa có lần chạy nào.</p>
              ) : pipelineRuns.map((item) => (
                <div key={item.id} className="group flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => { selectRun(item.id); setRunPanelOpen(true); }}
                    className={cn(
                      "min-w-0 flex-1 rounded-md px-2 py-1.5 text-left text-[11px] transition-colors",
                      item.id === activeRunId ? "bg-background shadow-xs" : "hover:bg-sidebar-accent/60",
                    )}
                  >
                    <span className="block truncate">{item.pipelineName}</span>
                    <span className="block text-[9px] text-muted-foreground">
                      {new Date(item.startedAt).toLocaleString()}
                    </span>
                  </button>
                  <button
                    type="button"
                    disabled={busy && item.id === activeRunId}
                    onClick={() => deleteRun(item.id)}
                    className="rounded p-1 text-muted-foreground opacity-0 transition hover:text-destructive group-hover:opacity-100"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border/70 px-5">
          {sidebarCollapsed && (
            <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={() => setSidebarCollapsed(false)} title="Mở sidebar" aria-label="Mở sidebar">
              <PanelLeftOpen className="size-4" />
            </Button>
          )}
          <FeatureHeaderIcon icon={Radar} />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-semibold">{pipeline?.name ?? "Buzz"}</h1>
            <p className="truncate text-[11px] text-muted-foreground">
              {pipeline?.description || "Workflow kết nối Input, Function và Agent trên canvas."}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 rounded-lg bg-muted/55 hover:bg-muted"
            title="Quản lý agent"
            aria-label="Quản lý agent"
            onClick={() => setAgentsOpen(true)}
          >
            <Bot className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 max-w-56 justify-start rounded-lg bg-muted/55 px-2 text-xs font-normal hover:bg-muted"
            disabled={busy}
            onClick={() => void chooseWorkspace()}
            title={workspaceInfo?.path || "Workspace mặc định"}
          >
            <FolderOpen className="size-3.5" />
            <span className="truncate">
              {workspaceInfo?.path.split(/[\\/]/).filter(Boolean).pop() || "Workspace"}
            </span>
          </Button>
        </header>

        {missingAdapters.length > 0 && (
          <div className="shrink-0 border-b border-border/70 px-5 py-2 text-[11px] text-destructive">
            CLI chưa sẵn sàng: {missingAdapters.join(", ")}
          </div>
        )}

        {!pipeline ? (
          <div className="flex flex-1 items-center justify-center px-6 text-center">
            <div className="max-w-sm">
              <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Workflow className="size-5" />
              </div>
              <h2 className="text-lg font-semibold">Chưa có pipeline</h2>
              <p className="mt-1.5 text-sm leading-5 text-muted-foreground">
                Tạo agent trước (mỗi agent là một vai trò do bạn tự định nghĩa), rồi tạo pipeline,
                thêm các bước và gán agent cho từng bước.
              </p>
              <div className="mt-4 flex justify-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setAgentsOpen(true)}>
                  <Bot className="size-4" />
                  Tạo agent
                </Button>
                <Button size="sm" onClick={() => createPipeline()}>
                  <Plus className="size-4" />
                  Tạo pipeline
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 overflow-hidden">
            <div className="min-w-0 flex-1">
              <PipelineEditor
                pipeline={runningPipelineSnapshot?.id === pipeline.id ? runningPipelineSnapshot : pipeline}
                run={run?.pipelineId === pipeline.id ? run : null}
                busy={busy}
                runningNodeId={runningNodeId}
                resultPanelOpen={runPanelOpen}
                onExecute={() => void handleRun()}
                onExecuteNode={(stepId) => void handleRun(stepId)}
                onStop={abortRun}
              />
            </div>
            {runPanelOpen && (
              <aside className="relative z-40 flex w-[min(520px,48vw)] shrink-0 flex-col border-l border-border bg-background shadow-[-12px_0_36px_rgba(0,0,0,0.12)]">
                <div className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4">
                  <div className="flex items-center gap-2 text-xs font-semibold"><History className="size-4" /> Kết quả chạy</div>
                  <Button variant="ghost" size="icon" className="size-7" onClick={() => setRunPanelOpen(false)}><X className="size-4" /></Button>
                </div>
              <RunView
                run={run}
                liveOutput={liveOutput}
                onOpenFile={(filePath) => onOpenFile(run?.workspacePath ?? pipeline.workspacePath ?? null, filePath)}
              />
              </aside>
            )}
          </div>
        )}
      </main>

      <AgentManagerDialog open={agentsOpen} onOpenChange={setAgentsOpen} />
    </>
  );
}
