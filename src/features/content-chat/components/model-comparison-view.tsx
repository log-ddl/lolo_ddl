import { useState, useEffect, memo } from "react";
import {
  Columns2,
  Check,
  Copy,
  Loader2,
  X,
  GitCompare,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { MarkdownContent } from "./markdown-content";
import { DiffReviewCard } from "./diff-review-card";
import { toast } from "sonner";
import type { ContentCliAdapter } from "../store";
import { cliLabel } from "../lib/labels";
import { cachedCliModels } from "../lib/cli-cache";

const CLI_ADAPTERS: ContentCliAdapter[] = ["claude", "opencode", "codex"];

export const ModelComparisonView = memo(function ModelComparisonView({
  prompt,
  adapterA,
  adapterB,
  modelA,
  modelB,
  responseA,
  responseB,
  isStreamingA,
  isStreamingB,
  onSelectAdapterA,
  onSelectAdapterB,
  onSelectModelA,
  onSelectModelB,
  onPickResponse,
  onClose,
}: {
  prompt: string;
  adapterA: ContentCliAdapter;
  adapterB: ContentCliAdapter;
  modelA: string;
  modelB: string;
  responseA: string;
  responseB: string;
  isStreamingA: boolean;
  isStreamingB: boolean;
  onSelectAdapterA: (adapter: ContentCliAdapter) => void;
  onSelectAdapterB: (adapter: ContentCliAdapter) => void;
  onSelectModelA: (model: string) => void;
  onSelectModelB: (model: string) => void;
  onPickResponse: (chosenAdapter: ContentCliAdapter, chosenModel: string, chosenContent: string) => void;
  onClose: () => void;
}) {
  const [showDiff, setShowDiff] = useState(false);
  const [copiedA, setCopiedA] = useState(false);
  const [copiedB, setCopiedB] = useState(false);

  const [availableModelsA, setAvailableModelsA] = useState<string[]>([]);
  const [availableModelsB, setAvailableModelsB] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    void cachedCliModels(adapterA)
      .then((result) => {
        if (!cancelled) setAvailableModelsA(result.models || []);
      })
      .catch(() => {
        if (!cancelled) setAvailableModelsA([]);
      });
    return () => {
      cancelled = true;
    };
  }, [adapterA]);

  useEffect(() => {
    let cancelled = false;
    void cachedCliModels(adapterB)
      .then((result) => {
        if (!cancelled) setAvailableModelsB(result.models || []);
      })
      .catch(() => {
        if (!cancelled) setAvailableModelsB([]);
      });
    return () => {
      cancelled = true;
    };
  }, [adapterB]);

  const labelA = `${cliLabel(adapterA, true)}${modelA ? ` (${modelA})` : ""}`;
  const labelB = `${cliLabel(adapterB, true)}${modelB ? ` (${modelB})` : ""}`;

  // Synthesize diff between response A and response B
  const generatedDiff = `--- ${labelA}\n+++ ${labelB}\n${responseA.split("\n").map((l) => "-" + l).join("\n")}\n${responseB.split("\n").map((l) => "+" + l).join("\n")}`;

  return (
    <div className="flex flex-col h-full bg-background border-l border-border/60">
      {/* Comparison Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b border-border/70">
        <div className="flex items-center gap-2.5">
          <div className="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Columns2 className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              So Sánh CLI Song Song
              <span className="px-2 py-0.5 rounded-full text-2xs font-semibold bg-primary/10 text-primary uppercase tracking-wider">
                Split View
              </span>
            </h3>
            <p className="text-2xs text-muted-foreground">
              Chạy đồng thời 2 CLI / Model trên máy để so sánh kịch bản và câu trả lời
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {responseA && responseB && !isStreamingA && !isStreamingB && (
            <Button
              variant={showDiff ? "default" : "outline"}
              size="sm"
              onClick={() => setShowDiff(!showDiff)}
              className="h-8 text-2xs gap-1.5"
            >
              <GitCompare className="size-3.5" />
              <span>{showDiff ? "Ẩn So Sánh Diff" : "So Sánh Diff A vs B"}</span>
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            title="Đóng chế độ so sánh"
            className="size-8"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {/* Prompt banner */}
      <div className="px-4 py-2.5 bg-card/60 border-b border-border/50 text-xs flex items-center gap-2">
        <span className="font-semibold text-muted-foreground shrink-0">Yêu cầu:</span>
        <span className="truncate text-foreground font-medium">{prompt || "Chưa có prompt... Hãy nhập câu hỏi ở khung chat bên dưới"}</span>
      </div>

      {/* Main split comparison area */}
      <div className="flex-1 overflow-y-auto p-4">
        {showDiff ? (
          <div className="max-w-4xl mx-auto">
            <DiffReviewCard
              rawDiff={generatedDiff}
              title={`So sánh: ${labelA} vs ${labelB}`}
              onAccept={(chosen) => onPickResponse(adapterB, modelB, chosen)}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
            {/* Column A */}
            <div className="flex flex-col rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs">
              {/* Column A Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 bg-muted/50 border-b border-border/60">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="size-6 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-2xs shrink-0">
                    A
                  </div>
                  {/* CLI Adapter Selection A */}
                  <Select value={adapterA} onValueChange={(val) => onSelectAdapterA(val as ContentCliAdapter)}>
                    <SelectTrigger className="h-7 text-xs font-semibold bg-background min-w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CLI_ADAPTERS.map((cli) => (
                        <SelectItem key={cli} value={cli}>
                          {cliLabel(cli, true)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Model Selection A */}
                  {availableModelsA.length > 0 && (
                    <Select value={modelA || "default"} onValueChange={(val) => onSelectModelA(val === "default" ? "" : val)}>
                      <SelectTrigger className="h-7 text-xs bg-background min-w-[130px] max-w-[180px] truncate">
                        <SelectValue placeholder="Model mặc định" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Model mặc định CLI</SelectItem>
                        {availableModelsA.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {responseA && !isStreamingA && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onPickResponse(adapterA, modelA, responseA)}
                    className="h-7 px-2.5 text-2xs gap-1 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs shrink-0"
                  >
                    <Check className="size-3" />
                    <span>Chọn Bản A</span>
                  </Button>
                )}
              </div>

              {/* Column A Body */}
              <div className="flex-1 p-4 overflow-y-auto text-sm leading-6 select-text">
                {isStreamingA && !responseA ? (
                  <div className="flex items-center gap-2 py-8 text-muted-foreground text-xs justify-center">
                    <Loader2 className="size-4 animate-spin text-primary" />
                    <span>{labelA} đang xử lý...</span>
                  </div>
                ) : responseA ? (
                  <>
                    <MarkdownContent content={responseA} />
                    {isStreamingA && <span className="ml-1 inline-block h-4 w-0.5 animate-pulse bg-primary align-middle" />}
                  </>
                ) : (
                  <div className="py-12 text-center text-xs text-muted-foreground italic">
                    Chờ bạn gửi câu hỏi để bắt đầu so sánh...
                  </div>
                )}
              </div>

              {/* Column A Footer */}
              {responseA && !isStreamingA && (
                <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-t border-border/40 text-2xs text-muted-foreground">
                  <span>{responseA.length} ký tự</span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      navigator.clipboard.writeText(responseA);
                      setCopiedA(true);
                      toast.success("Đã sao chép câu trả lời của CLI A");
                      setTimeout(() => setCopiedA(false), 2000);
                    }}
                    title="Sao chép"
                  >
                    {copiedA ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                  </Button>
                </div>
              )}
            </div>

            {/* Column B */}
            <div className="flex flex-col rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs">
              {/* Column B Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 bg-muted/50 border-b border-border/60">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="size-6 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-2xs shrink-0">
                    B
                  </div>
                  {/* CLI Adapter Selection B */}
                  <Select value={adapterB} onValueChange={(val) => onSelectAdapterB(val as ContentCliAdapter)}>
                    <SelectTrigger className="h-7 text-xs font-semibold bg-background min-w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CLI_ADAPTERS.map((cli) => (
                        <SelectItem key={cli} value={cli}>
                          {cliLabel(cli, true)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Model Selection B */}
                  {availableModelsB.length > 0 && (
                    <Select value={modelB || "default"} onValueChange={(val) => onSelectModelB(val === "default" ? "" : val)}>
                      <SelectTrigger className="h-7 text-xs bg-background min-w-[130px] max-w-[180px] truncate">
                        <SelectValue placeholder="Model mặc định" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Model mặc định CLI</SelectItem>
                        {availableModelsB.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {responseB && !isStreamingB && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onPickResponse(adapterB, modelB, responseB)}
                    className="h-7 px-2.5 text-2xs gap-1 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs shrink-0"
                  >
                    <Check className="size-3" />
                    <span>Chọn Bản B</span>
                  </Button>
                )}
              </div>

              {/* Column B Body */}
              <div className="flex-1 p-4 overflow-y-auto text-sm leading-6 select-text">
                {isStreamingB && !responseB ? (
                  <div className="flex items-center gap-2 py-8 text-muted-foreground text-xs justify-center">
                    <Loader2 className="size-4 animate-spin text-primary" />
                    <span>{labelB} đang xử lý...</span>
                  </div>
                ) : responseB ? (
                  <>
                    <MarkdownContent content={responseB} />
                    {isStreamingB && <span className="ml-1 inline-block h-4 w-0.5 animate-pulse bg-primary align-middle" />}
                  </>
                ) : (
                  <div className="py-12 text-center text-xs text-muted-foreground italic">
                    Chờ bạn gửi câu hỏi để bắt đầu so sánh...
                  </div>
                )}
              </div>

              {/* Column B Footer */}
              {responseB && !isStreamingB && (
                <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-t border-border/40 text-2xs text-muted-foreground">
                  <span>{responseB.length} ký tự</span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      navigator.clipboard.writeText(responseB);
                      setCopiedB(true);
                      toast.success("Đã sao chép câu trả lời của CLI B");
                      setTimeout(() => setCopiedB(false), 2000);
                    }}
                    title="Sao chép"
                  >
                    {copiedB ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
