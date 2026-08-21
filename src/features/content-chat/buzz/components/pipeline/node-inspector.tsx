"use client";

/**
 * The right-hand inspector: edits whichever node is selected (input, function
 * or agent) and, for agents, loads the model / effort options offered by that
 * adapter's CLI.
 */

import { useEffect, useRef, useState } from "react";
import { Bot, FileText, FolderOpen, GitBranch, GripVertical, Loader2, Merge, Play, Plus, Repeat2, Trash2, Type, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import { useI18n } from "@/shared/i18n";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import { getCliModels } from "@/features/video-studio/lib/cli-runtime";
import { useBuzzStore } from "../../buzz-store";
import { localizedNodeName } from "./types";
import {
  ADAPTER_LABELS,
  type BuzzAdapter,
  type BuzzAgent,
  type BuzzConditionOperator,
  type BuzzFunctionNode,
  type BuzzInputNode,
  type BuzzStep,
} from "../../types";
import { ConditionDataPreview } from "./canvas-nodes";
import type { EditorInputSource } from "./types";

export function NodeInspector({ inputNode, functionNode, agentNode, agents, workspacePath, inputSources, output, busy, running, onExecute, onUpdateInput, onUpdateFunction, onUpdateAgent, onCreateAgent, onUpdateAgentPreset, onDelete, onClose }: {
  inputNode: BuzzInputNode | null;
  functionNode: BuzzFunctionNode | null;
  agentNode: BuzzStep | null;
  agents: ReturnType<typeof useBuzzStore.getState>["agents"];
  workspacePath?: string | null;
  inputSources: EditorInputSource[];
  output: string;
  busy: boolean;
  running: boolean;
  onExecute: () => void;
  onUpdateInput: (id: string, patch: Partial<BuzzInputNode>) => void;
  onUpdateFunction: (id: string, patch: Partial<BuzzFunctionNode>) => void;
  onUpdateAgent: (id: string, patch: Partial<BuzzStep>) => void;
  onCreateAgent: (agent?: Partial<BuzzAgent>) => string;
  onUpdateAgentPreset: (id: string, patch: Partial<BuzzAgent>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const { locale } = useI18n();
  const vietnamese = locale.toLocaleLowerCase().startsWith("vi");
  const [editorTab, setEditorTab] = useState<"parameters" | "settings">("parameters");
  const [agentDraft, setAgentDraft] = useState({
    name: "Agent mới",
    role: "",
    adapter: "claude" as BuzzAdapter,
    model: "",
    effort: "",
    systemPrompt: "",
  });
  const [agentModels, setAgentModels] = useState<string[]>([]);
  const [agentEfforts, setAgentEfforts] = useState<string[]>([]);
  const [loadingAgentOptions, setLoadingAgentOptions] = useState(false);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const nodeId = inputNode?.id ?? functionNode?.id ?? agentNode!.id;
  const rawTitle = inputNode?.name ?? functionNode?.name ?? agentNode?.name ?? "Node";
  const title = localizedNodeName(rawTitle, vietnamese);
  const family = inputNode ? (vietnamese ? "Đầu vào" : "Input") : functionNode ? (vietnamese ? "Hàm" : "Function") : "Agent";
  const agentOutputKind = agentNode?.outputKind ?? (agentNode?.outputFile.trim() ? "file" : "text");
  const selectedAgentPreset = agentNode ? agents.find((agent) => agent.id === agentNode.agentId) ?? null : null;
  useEffect(() => {
    if (!selectedAgentPreset) return;
    setAgentDraft({
      name: selectedAgentPreset.name,
      role: selectedAgentPreset.role,
      adapter: selectedAgentPreset.adapter,
      model: selectedAgentPreset.model,
      effort: selectedAgentPreset.effort,
      systemPrompt: selectedAgentPreset.systemPrompt,
    });
  }, [selectedAgentPreset?.id, selectedAgentPreset?.updatedAt]);
  useEffect(() => {
    if (!agentNode) return;
    let cancelled = false;
    setLoadingAgentOptions(true);
    void getCliModels(agentDraft.adapter)
      .then((result) => {
        if (cancelled) return;
        setAgentModels(result.models);
        setAgentEfforts(result.efforts ?? []);
      })
      .finally(() => {
        if (!cancelled) setLoadingAgentOptions(false);
      });
    return () => { cancelled = true; };
  }, [agentDraft.adapter, agentNode?.id]);
  const saveAgentSettings = () => {
    if (!selectedAgentPreset) return;
    const name = agentDraft.name.trim();
    if (!name) {
      toast.error(vietnamese ? "Hãy đặt tên cho Agent." : "Give the Agent a name.");
      return;
    }
    onUpdateAgentPreset(selectedAgentPreset.id, { ...agentDraft, name });
    toast.success(vietnamese ? `Đã lưu Agent “${name}”.` : `Saved Agent “${name}”.`);
  };
  const chooseInput = async (node: BuzzInputNode) => {
    if (!window.contentWorkspace || node.kind === "text") return;
    try {
      const result = await window.contentWorkspace.pickInput(node.kind, workspacePath, node.path || null);
      if (!result.canceled && result.path) onUpdateInput(node.id, { path: result.path });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    }
  };
  const insertPromptToken = (token: string) => {
    if (!agentNode) return;
    const textarea = promptRef.current;
    const start = textarea?.selectionStart ?? agentNode.prompt.length;
    const end = textarea?.selectionEnd ?? start;
    const before = agentNode.prompt.slice(0, start);
    const after = agentNode.prompt.slice(end);
    const spacer = before && !/\s$/.test(before) ? " " : "";
    const nextPrompt = `${before}${spacer}${token}${after}`;
    onUpdateAgent(agentNode.id, { prompt: nextPrompt });
    requestAnimationFrame(() => {
      const cursor = before.length + spacer.length + token.length;
      promptRef.current?.focus();
      promptRef.current?.setSelectionRange(cursor, cursor);
    });
  };
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/65 p-5 backdrop-blur-[2px]" onMouseDown={onClose}>
    <section className="flex h-[88%] max-h-[820px] w-[92%] max-w-[1500px] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border px-3">
        <span className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">{inputNode ? inputNode.kind === "text" ? <Type className="size-4" /> : inputNode.kind === "file" ? <FileText className="size-4" /> : <FolderOpen className="size-4" /> : functionNode ? functionNode.kind === "condition" ? <GitBranch className="size-4" /> : functionNode.kind === "loop" ? <Repeat2 className="size-4" /> : <Merge className="size-4" /> : <Bot className="size-4" />}</span>
        <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{title}</p><p className="text-[9px] uppercase tracking-wider text-muted-foreground">{family}</p></div>
        <Button variant="ghost" size="icon" className="size-7" onClick={onClose}><X className="size-4" /></Button>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_360px_minmax(0,1fr)]">
        <section className="flex min-w-0 flex-col border-r border-border bg-muted/10">
          <h3 className="border-b border-border px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{vietnamese ? "Đầu vào" : "Input"}</h3>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {inputSources.length > 0 ? <div className="mx-auto w-full max-w-md space-y-3"><div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"><div className="flex items-center justify-between border-b border-border bg-muted/25 px-3 py-2"><span className="text-xs font-semibold">Input</span><span className="text-[9px] uppercase text-muted-foreground">{inputSources.length} {vietnamese ? "mục" : "items"}</span></div>{inputSources.map((source) => {
              const SourceIcon = source.kind === "text" ? Type : source.kind === "file" ? FileText : source.kind === "folder" ? FolderOpen : Bot;
              const label = source.kind === "text" ? (vietnamese ? "Văn bản" : "Text") : source.kind === "file" ? (vietnamese ? "Tệp" : "File") : source.kind === "folder" ? (vietnamese ? "Thư mục" : "Folder") : (vietnamese ? "Kết quả bước trước" : "Previous result");
              return <button key={source.id} type="button" draggable onDragStart={(event) => { event.dataTransfer.effectAllowed = "copy"; event.dataTransfer.setData("text/plain", source.token); }} onDoubleClick={() => insertPromptToken(source.token)} className="group flex w-full cursor-grab items-center gap-2 border-b border-border/60 px-3 py-2.5 text-left last:border-b-0 hover:bg-muted/25 active:cursor-grabbing"><GripVertical className="size-3.5 shrink-0 text-muted-foreground/50" /><SourceIcon className="size-3.5 shrink-0 text-muted-foreground" /><span className="min-w-0 flex-1"><span className="block text-[11px] font-medium">{label}</span><span className="block text-[9px] text-muted-foreground">{source.field}</span></span><span className="max-w-[48%] truncate rounded-md bg-muted px-2 py-1 text-[10px] text-muted-foreground" title={source.value}>{source.value || (vietnamese ? "Chưa có dữ liệu" : "No data")}</span><span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[8px] text-primary">{source.dataType}</span></button>;
            })}</div><p className="px-1 text-[10px] leading-4 text-muted-foreground">{vietnamese ? "Kéo một mục sang ô Chỉ dẫn, hoặc nhấp đúp để chèn." : "Drag an item into Prompt, or double-click to insert it."}</p></div> : <div className="flex h-full items-center justify-center text-center"><div><p className="text-xs font-medium">{vietnamese ? "Không có dữ liệu đầu vào" : "No input data"}</p><p className="mt-1 text-[10px] text-muted-foreground">{vietnamese ? "Đóng cửa sổ và kéo dây từ node Input vào Agent." : "Close this window and connect an Input node to the Agent."}</p></div></div>}
          </div>
        </section>

        <section className="flex min-w-0 flex-col bg-card">
          <div className="flex h-12 shrink-0 items-end justify-between border-b border-border px-3">
            <div className="flex h-full items-end">
              <button type="button" onClick={() => setEditorTab("parameters")} className={cn("h-full border-b-2 px-3 text-xs font-medium", editorTab === "parameters" ? "border-primary text-primary" : "border-transparent text-muted-foreground")}>{vietnamese ? "Tham số" : "Parameters"}</button>
              <button type="button" onClick={() => setEditorTab("settings")} className={cn("h-full border-b-2 px-3 text-xs font-medium", editorTab === "settings" ? "border-primary text-primary" : "border-transparent text-muted-foreground")}>{vietnamese ? "Cài đặt" : "Settings"}</button>
            </div>
            {(agentNode || functionNode) && <Button size="sm" className="mb-2 h-7 bg-primary text-[10px] text-primary-foreground hover:bg-primary/90" onClick={onExecute} disabled={busy}>{running ? <Loader2 className="size-3 animate-spin" /> : <Play className="size-3 fill-current" />} {running ? (vietnamese ? "Đang chạy…" : "Running…") : (vietnamese ? "Chạy node" : "Execute node")}</Button>}
          </div>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
            {editorTab === "settings" ? <>
              <div className="space-y-1.5"><Label className="text-xs">Tên node</Label><Input value={title} onChange={(event) => inputNode ? onUpdateInput(inputNode.id, { name: event.target.value }) : functionNode ? onUpdateFunction(functionNode.id, { name: event.target.value }) : onUpdateAgent(agentNode!.id, { name: event.target.value })} /></div>
              {agentNode && selectedAgentPreset && <>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1"><Label className="text-[10px]">{vietnamese ? "Tên Agent" : "Agent name"}</Label><Input value={agentDraft.name} maxLength={60} onChange={(event) => setAgentDraft((draft) => ({ ...draft, name: event.target.value }))} /></div>
                  <div className="space-y-1"><Label className="text-[10px]">{vietnamese ? "Vai trò" : "Role"}</Label><Input value={agentDraft.role} maxLength={120} placeholder={vietnamese ? "Ví dụ: nghiên cứu" : "Example: researcher"} onChange={(event) => setAgentDraft((draft) => ({ ...draft, role: event.target.value }))} /></div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1"><Label className="text-[10px]">CLI</Label><Select value={agentDraft.adapter} onValueChange={(value) => setAgentDraft((draft) => ({ ...draft, adapter: value as BuzzAdapter, model: "", effort: "" }))}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent>{(Object.keys(ADAPTER_LABELS) as BuzzAdapter[]).map((adapter) => <SelectItem key={adapter} value={adapter}>{ADAPTER_LABELS[adapter]}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-1"><Label className="text-[10px]">Model</Label><Select value={agentDraft.model || "__default"} onValueChange={(value) => setAgentDraft((draft) => ({ ...draft, model: value === "__default" ? "" : value }))} disabled={loadingAgentOptions}><SelectTrigger className="h-8 text-xs">{loadingAgentOptions ? <Loader2 className="size-3 animate-spin" /> : <SelectValue />}</SelectTrigger><SelectContent><SelectItem value="__default">{vietnamese ? "Mặc định" : "Default"}</SelectItem>{agentModels.map((model) => <SelectItem key={model} value={model}>{model}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-1"><Label className="text-[10px]">{vietnamese ? "Suy luận" : "Reasoning"}</Label><Select value={agentDraft.effort || "__default"} onValueChange={(value) => setAgentDraft((draft) => ({ ...draft, effort: value === "__default" ? "" : value }))} disabled={loadingAgentOptions || agentEfforts.length === 0}><SelectTrigger className="h-8 text-xs">{loadingAgentOptions ? <Loader2 className="size-3 animate-spin" /> : <SelectValue />}</SelectTrigger><SelectContent><SelectItem value="__default">{vietnamese ? "Mặc định" : "Default"}</SelectItem>{agentEfforts.map((effort) => <SelectItem key={effort} value={effort}>{effort}</SelectItem>)}</SelectContent></Select></div>
                </div>
                <div className="space-y-1"><Label className="text-[10px]">System prompt</Label><Textarea value={agentDraft.systemPrompt} onChange={(event) => setAgentDraft((draft) => ({ ...draft, systemPrompt: event.target.value }))} placeholder={vietnamese ? "Agent này là ai, làm gì, và không được làm gì?" : "Who is this Agent, what does it do, and what must it avoid?"} className="min-h-36 resize-y font-mono text-[10px] leading-4" /></div>
                <Button type="button" size="sm" className="w-full bg-primary text-primary-foreground" onClick={saveAgentSettings}>{vietnamese ? "Lưu cài đặt Agent" : "Save Agent settings"}</Button>
              </>}
              {agentNode && !selectedAgentPreset && <Button type="button" variant="outline" className="w-full" onClick={() => { const id = onCreateAgent(); onUpdateAgent(agentNode.id, { agentId: id }); }}>{vietnamese ? "Tạo Agent cho node này" : "Create an Agent for this node"}</Button>}
              <Button variant="outline" size="sm" className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => onDelete(nodeId)}><Trash2 className="size-4" /> Xóa node</Button>
            </> : <>
              {inputNode && (inputNode.kind === "text" ? <div className="space-y-1.5"><Label className="text-xs">Nội dung</Label><Textarea value={inputNode.value} onChange={(event) => onUpdateInput(inputNode.id, { value: event.target.value })} placeholder="Nhập nội dung đầu vào…" className="min-h-56 resize-y" /></div> : <div className="space-y-2"><Label className="text-xs">{inputNode.kind === "file" ? "File đầu vào" : "Folder đầu vào"}</Label><button type="button" onClick={() => void chooseInput(inputNode)} className="flex w-full items-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 p-3 text-left transition hover:border-primary hover:bg-primary/5"><span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">{inputNode.kind === "file" ? <FileText className="size-4" /> : <FolderOpen className="size-4" />}</span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium">{inputNode.path.split(/[\\/]/).filter(Boolean).pop() || (inputNode.kind === "file" ? "Chọn file" : "Chọn folder")}</span><span className="mt-0.5 block text-[10px] text-muted-foreground">{inputNode.path ? "Nhấn để chọn lại" : "Mở trình chọn trên máy"}</span></span></button>{inputNode.path && <Button type="button" variant="ghost" size="sm" className="h-7 w-full text-xs text-muted-foreground" onClick={() => onUpdateInput(inputNode.id, { path: "" })}>Bỏ lựa chọn</Button>}</div>)}
              {functionNode?.kind === "merge" && <div className="rounded-xl border border-border bg-muted/25 p-3 text-[11px] leading-5 text-muted-foreground"><Merge className="mr-1 inline size-3.5" />{vietnamese ? "Node Gộp nhận nhiều kết nối và chuyển toàn bộ dữ liệu sang node tiếp theo." : "Merge accepts multiple connections and passes all data to the next node."}</div>}
              {functionNode?.kind === "condition" && <>
                <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-3 text-[11px] leading-5 text-muted-foreground"><GitBranch className="mr-1 inline size-3.5 text-violet-500" />Đọc dữ liệu đầu vào rồi chỉ kích hoạt một cổng Đúng hoặc Sai.</div>
                <ConditionDataPreview node={functionNode} inputSources={inputSources} onPickField={(path) => onUpdateFunction(functionNode.id, { field: path })} />
                <div className="space-y-1.5"><Label className="text-xs">Trường JSON <span className="font-normal text-muted-foreground">(không bắt buộc)</span></Label><Input value={functionNode.field ?? ""} onChange={(event) => onUpdateFunction(functionNode.id, { field: event.target.value })} placeholder="Ví dụ: result.passed hoặc score" /><p className="text-[9px] text-muted-foreground">Để trống để so sánh toàn bộ text đầu vào.</p></div>
                <div className="space-y-1.5"><Label className="text-xs">Điều kiện</Label><Select value={functionNode.operator ?? "truthy"} onValueChange={(value) => onUpdateFunction(functionNode.id, { operator: value as BuzzConditionOperator })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="truthy">Có giá trị / true</SelectItem><SelectItem value="exists">Trường tồn tại</SelectItem><SelectItem value="equals">Bằng</SelectItem><SelectItem value="notEquals">Không bằng</SelectItem><SelectItem value="contains">Có chứa</SelectItem><SelectItem value="notContains">Không chứa</SelectItem><SelectItem value="regex">Khớp Regex</SelectItem><SelectItem value="gt">Lớn hơn</SelectItem><SelectItem value="gte">Lớn hơn hoặc bằng</SelectItem><SelectItem value="lt">Nhỏ hơn</SelectItem><SelectItem value="lte">Nhỏ hơn hoặc bằng</SelectItem></SelectContent></Select></div>
                {functionNode.operator !== "truthy" && functionNode.operator !== "exists" && <div className="space-y-1.5"><Label className="text-xs">Giá trị so sánh</Label><Input value={functionNode.compareValue ?? ""} onChange={(event) => onUpdateFunction(functionNode.id, { compareValue: event.target.value })} placeholder={functionNode.operator === "regex" ? "^PASS$" : "true"} /></div>}
                <div className="space-y-1.5"><Label className="text-xs">Giới hạn số lần đánh giá</Label><Input type="number" min={1} max={60} value={functionNode.maxIterations ?? 10} onChange={(event) => onUpdateFunction(functionNode.id, { maxIterations: Math.max(1, Math.min(60, Number(event.target.value) || 1)) })} /><p className="text-[9px] text-muted-foreground">Chặn dây quay ngược lặp vô hạn khi điều kiện không bao giờ đổi.</p></div>
              </>}
              {functionNode?.kind === "loop" && <>
                <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-3 text-[11px] leading-5 text-muted-foreground"><Repeat2 className="mr-1 inline size-3.5 text-cyan-500" />Mỗi lần nhận dữ liệu, node đi qua cổng Lặp. Khi đủ lượt, nó chuyển sang cổng Xong.</div>
                <div className="space-y-1.5"><Label className="text-xs">Số lượt quay lại</Label><Input type="number" min={1} max={60} value={functionNode.maxIterations ?? 3} onChange={(event) => onUpdateFunction(functionNode.id, { maxIterations: Math.max(1, Math.min(60, Number(event.target.value) || 1)) })} /><p className="text-[9px] text-muted-foreground">Ví dụ 3 nghĩa là chạy nhánh Lặp tối đa 3 lần, lần tiếp theo đi qua nhánh Xong.</p></div>
              </>}
              {agentNode && <>
                <div className="space-y-1.5">
                  <Label className="text-xs">Agent</Label>
                  <Select value={agentNode.agentId || "__none"} onValueChange={(value) => {
                    if (value === "__create") {
                      const id = onCreateAgent();
                      onUpdateAgent(agentNode.id, { agentId: id });
                      setEditorTab("settings");
                      return;
                    }
                    onUpdateAgent(agentNode.id, { agentId: value === "__none" ? "" : value });
                  }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">— {vietnamese ? "chưa chọn" : "not selected"} —</SelectItem>
                      <SelectItem value="__create"><span className="flex items-center gap-2 font-medium text-primary"><Plus className="size-3.5" />{vietnamese ? "Tạo Agent mới…" : "Create new Agent…"}</span></SelectItem>
                      {agents.map((agent) => <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <p className="text-[9px] text-muted-foreground">{vietnamese ? "Chọn Agent dùng lại, hoặc tạo mới rồi cấu hình trong tab Cài đặt." : "Reuse an Agent, or create one and configure it in Settings."}</p>
                </div>
                <div className="space-y-1.5"><Label className="text-xs">{vietnamese ? "Chỉ dẫn" : "Prompt"}</Label><Textarea ref={promptRef} value={agentNode.prompt} onChange={(event) => onUpdateAgent(agentNode.id, { prompt: event.target.value })} onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; }} onDrop={(event) => { event.preventDefault(); const token = event.dataTransfer.getData("text/plain"); if (token) insertPromptToken(token); }} placeholder="Agent này cần làm gì với input được nối vào?" className="min-h-48 resize-y border-dashed font-mono text-xs leading-5" /><p className="text-[9px] text-muted-foreground">{vietnamese ? "Có thể kéo trường dữ liệu từ cột Đầu vào sang đây." : "Drag fields from the Input panel into this prompt."}</p></div><div className="space-y-1.5"><Label className="text-xs">{vietnamese ? "Kiểu đầu ra" : "Output type"}</Label><Select value={agentOutputKind} onValueChange={(value) => onUpdateAgent(agentNode.id, { outputKind: value as "text" | "file" | "folder", outputFile: value === "text" ? "" : agentNode.outputFile })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="text">{vietnamese ? "Phản hồi trực tiếp" : "Direct response"}</SelectItem><SelectItem value="file">{vietnamese ? "Tệp bất kỳ" : "File"}</SelectItem><SelectItem value="folder">{vietnamese ? "Thư mục" : "Folder"}</SelectItem></SelectContent></Select></div>{agentOutputKind !== "text" && <div className="space-y-1.5"><Label className="text-xs">{agentOutputKind === "folder" ? (vietnamese ? "Tên thư mục đầu ra" : "Output folder") : (vietnamese ? "Tên tệp đầu ra" : "Output file name")}</Label><Input value={agentNode.outputFile} onChange={(event) => onUpdateAgent(agentNode.id, { outputFile: event.target.value })} placeholder={agentOutputKind === "folder" ? "ket-qua/" : "ket-qua.json"} /><p className="text-[9px] text-muted-foreground">{vietnamese ? "Có thể dùng bất kỳ tên và định dạng nào, không bắt buộc .md." : "Any name or format is allowed; Markdown is not required."}</p></div>}
              </>}
            </>}
          </div>
        </section>

        <section className="flex min-w-0 flex-col bg-muted/10">
          <h3 className="border-b border-border px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{vietnamese ? "Đầu ra" : "Output"}</h3>
          <div className="flex min-h-0 flex-1 items-center justify-center p-5">
            {output ? <pre className="max-h-full w-full overflow-auto whitespace-pre-wrap break-words rounded-lg border border-border bg-card p-3 font-mono text-[10px] leading-5">{output}</pre> : <div className="text-center"><p className="text-xs font-medium">Chưa có dữ liệu đầu ra</p><p className="mt-1 text-[10px] text-muted-foreground">{agentNode ? (vietnamese ? "Chạy node để xem kết quả." : "Execute the node to see its output.") : (vietnamese ? "Chạy quy trình để xem kết quả." : "Execute the workflow to see its output.")}</p></div>}
          </div>
        </section>
      </div>
    </section>
    </div>
  );
}

