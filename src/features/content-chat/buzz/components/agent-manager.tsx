import { useEffect, useState } from "react";
import { Bot, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import { cn } from "@/shared/lib/utils";
import { getCliModels } from "@/features/video-studio/lib/cli-runtime";
import { useBuzzStore } from "../buzz-store";
import { ADAPTER_LABELS, type BuzzAdapter, type BuzzAgent } from "../types";

/** Model + effort khả dụng phụ thuộc adapter, nên phải nạp lại mỗi lần đổi CLI. */
function useAdapterOptions(adapter: BuzzAdapter) {
  const [models, setModels] = useState<string[]>([]);
  const [efforts, setEfforts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void getCliModels(adapter)
      .then((result) => {
        if (cancelled) return;
        setModels(result.models);
        setEfforts(result.efforts ?? []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [adapter]);

  return { models, efforts, loading };
}

export function AgentManagerDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { agents, createAgent, updateAgent, deleteAgent } = useBuzzStore();
  const [selectedId, setSelectedId] = useState<string>(agents[0]?.id ?? "");
  const selected = agents.find((agent) => agent.id === selectedId) ?? agents[0] ?? null;
  const [draft, setDraft] = useState<BuzzAgent | null>(selected ? { ...selected } : null);
  const edited = draft?.id === selected?.id ? draft : selected;
  const { models, efforts, loading } = useAdapterOptions(edited?.adapter ?? "claude");

  useEffect(() => {
    if (!agents.some((agent) => agent.id === selectedId)) setSelectedId(agents[0]?.id ?? "");
  }, [agents, selectedId]);

  useEffect(() => {
    setDraft(selected ? { ...selected } : null);
  }, [selected?.id, selected?.updatedAt]);

  const patchDraft = (patch: Partial<BuzzAgent>) => setDraft((current) => current ? { ...current, ...patch } : current);
  const saveAgent = () => {
    if (!edited) return;
    const name = edited.name.trim();
    if (!name) {
      toast.error("Hãy đặt tên cho Agent.");
      return;
    }
    updateAgent(edited.id, { ...edited, name });
    toast.success(`Đã lưu Agent “${name}”.`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[78vh] max-w-4xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-border px-5 py-4">
          <DialogTitle>Agent</DialogTitle>
          <DialogDescription>
            Mỗi agent là một preset CLI + system prompt. Tạo một lần, dùng lại ở mọi pipeline.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1">
          <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-sidebar/50">
            <div className="border-b border-border p-2">
              <Button
                size="sm"
                className="w-full justify-start"
                onClick={() => setSelectedId(createAgent())}
              >
                <Plus className="size-4" />
                Tạo agent
              </Button>
            </div>
            <ScrollArea className="min-h-0 flex-1 p-2">
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => setSelectedId(agent.id)}
                  className={cn(
                    "mb-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors",
                    agent.id === selected?.id ? "bg-background shadow-xs ring-1 ring-border" : "hover:bg-sidebar-accent/60",
                  )}
                >
                  <Bot className="size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{agent.name}</span>
                    <span className="block truncate text-[10px] text-muted-foreground">
                      {ADAPTER_LABELS[agent.adapter]}
                    </span>
                  </span>
                </button>
              ))}
            </ScrollArea>
          </aside>

          <div className="min-w-0 flex-1">
            {!edited ? (
              <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
                Chưa có agent nào. Bấm “Tạo agent” để bắt đầu.
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div className="space-y-4 p-5">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Tên</Label>
                      <Input
                        value={edited.name}
                        maxLength={60}
                        onChange={(event) => patchDraft({ name: event.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Vai trò</Label>
                      <Input
                        value={edited.role}
                        maxLength={120}
                        placeholder="Ví dụ: viết lời đọc"
                        onChange={(event) => patchDraft({ role: event.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label>CLI</Label>
                      <Select
                        value={edited.adapter}
                        onValueChange={(value) => patchDraft({
                          adapter: value as BuzzAdapter,
                          // Model/effort của CLI cũ không tồn tại ở CLI mới.
                          model: "",
                          effort: "",
                        })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(Object.keys(ADAPTER_LABELS) as BuzzAdapter[]).map((adapter) => (
                            <SelectItem key={adapter} value={adapter}>{ADAPTER_LABELS[adapter]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Model</Label>
                      <Select
                        value={edited.model || "__default"}
                        onValueChange={(value) => patchDraft({ model: value === "__default" ? "" : value })}
                        disabled={loading}
                      >
                        <SelectTrigger>
                          {loading ? <Loader2 className="size-3.5 animate-spin" /> : <SelectValue />}
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__default">Mặc định</SelectItem>
                          {models.map((model) => <SelectItem key={model} value={model}>{model}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Suy luận</Label>
                      <Select
                        value={edited.effort || "__default"}
                        onValueChange={(value) => patchDraft({ effort: value === "__default" ? "" : value })}
                        disabled={loading || efforts.length === 0}
                      >
                        <SelectTrigger>
                          {loading ? <Loader2 className="size-3.5 animate-spin" /> : <SelectValue />}
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__default">Mặc định</SelectItem>
                          {efforts.map((effort) => <SelectItem key={effort} value={effort}>{effort}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>System prompt</Label>
                    <Textarea
                      value={edited.systemPrompt}
                      onChange={(event) => patchDraft({ systemPrompt: event.target.value })}
                      placeholder="Mô tả agent này là ai, làm gì, và không được làm gì."
                      className="min-h-56 resize-y font-mono text-xs leading-5"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Đây là tính cách cố định của agent. Việc cụ thể từng bước thì viết ở prompt của step.
                    </p>
                  </div>

                  <div className="flex justify-between gap-3 border-t border-border pt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => deleteAgent(edited.id)}
                    >
                      <Trash2 className="size-4" />
                      Xoá agent
                    </Button>
                    <Button size="sm" onClick={saveAgent}>Lưu cài đặt</Button>
                  </div>
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
