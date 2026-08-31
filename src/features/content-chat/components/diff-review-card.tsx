import { useState, useMemo, memo } from "react";
import { Check, Copy, FileDiff, Columns2, AlignJustify, X } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";

interface DiffLine {
  type: "add" | "delete" | "normal";
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export function parseDiff(rawDiff: string): { lines: DiffLine[]; additions: number; deletions: number } {
  const rawLines = rawDiff.split("\n");
  const lines: DiffLine[] = [];
  let additions = 0;
  let deletions = 0;
  let oldLine = 1;
  let newLine = 1;

  for (const line of rawLines) {
    if (line.startsWith("+++") || line.startsWith("---") || line.startsWith("@@")) {
      continue;
    }
    if (line.startsWith("+")) {
      additions++;
      lines.push({
        type: "add",
        content: line.slice(1),
        newLineNumber: newLine++,
      });
    } else if (line.startsWith("-")) {
      deletions++;
      lines.push({
        type: "delete",
        content: line.slice(1),
        oldLineNumber: oldLine++,
      });
    } else {
      lines.push({
        type: "normal",
        content: line.startsWith(" ") ? line.slice(1) : line,
        oldLineNumber: oldLine++,
        newLineNumber: newLine++,
      });
    }
  }

  return { lines, additions, deletions };
}

export const DiffReviewCard = memo(function DiffReviewCard({
  rawDiff,
  title = "So sánh kịch bản / Thay đổi nội dung",
  onAccept,
  onReject,
}: {
  rawDiff: string;
  title?: string;
  onAccept?: (acceptedText: string) => void;
  onReject?: () => void;
}) {
  const [viewMode, setViewMode] = useState<"unified" | "split">("unified");
  const [copied, setCopied] = useState(false);

  const { lines, additions, deletions } = useMemo(() => parseDiff(rawDiff), [rawDiff]);

  // Generate full text after applied changes
  const newContent = useMemo(() => {
    return lines
      .filter((l) => l.type !== "delete")
      .map((l) => l.content)
      .join("\n");
  }, [lines]);

  const handleCopyNew = () => {
    navigator.clipboard.writeText(newContent);
    setCopied(true);
    toast.success("Đã sao chép nội dung mới đã áp dụng!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAccept = () => {
    if (onAccept) {
      onAccept(newContent);
    } else {
      handleCopyNew();
    }
  };

  return (
    <div className="my-4 rounded-2xl border border-border/80 bg-card shadow-sm overflow-hidden text-xs">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-muted/60 border-b border-border/70">
        <div className="flex items-center gap-2 min-w-0">
          <div className="size-6 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <FileDiff className="size-3.5" />
          </div>
          <span className="font-semibold text-foreground truncate">{title}</span>
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-medium">
              +{additions}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400 font-medium">
              -{deletions}
            </span>
          </div>
        </div>

        {/* View toggles & actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center bg-background/80 rounded-lg p-0.5 border border-border/60">
            <button
              type="button"
              onClick={() => setViewMode("unified")}
              className={cn(
                "px-2 py-1 rounded-md text-2xs font-medium transition-colors flex items-center gap-1",
                viewMode === "unified"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Xem dạng thống nhất (1 cột)"
            >
              <AlignJustify className="size-3" />
              <span>Unified</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("split")}
              className={cn(
                "px-2 py-1 rounded-md text-2xs font-medium transition-colors flex items-center gap-1",
                viewMode === "split"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Xem dạng chia đôi (2 cột)"
            >
              <Columns2 className="size-3" />
              <span>Split</span>
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyNew}
            className="h-7 px-2.5 text-2xs gap-1"
          >
            {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
            <span>Sao chép</span>
          </Button>

          {onReject && (
            <Button
              variant="outline"
              size="sm"
              onClick={onReject}
              className="h-7 px-2.5 text-2xs gap-1 text-muted-foreground hover:text-destructive"
              title="Từ chối thay đổi"
            >
              <X className="size-3" />
              <span>Từ chối</span>
            </Button>
          )}

          <Button
            variant="default"
            size="sm"
            onClick={handleAccept}
            className="h-7 px-2.5 text-2xs gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Check className="size-3" />
            <span>Áp dụng</span>
          </Button>
        </div>
      </div>

      {/* Diff content view */}
      <div className="max-h-[380px] overflow-x-auto overflow-y-auto font-mono text-[12px] leading-5 select-text">
        {viewMode === "unified" ? (
          <div className="divide-y divide-border/15">
            {lines.map((line, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex items-start px-3 py-0.5 transition-colors",
                  line.type === "add" && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-l-2 border-emerald-500",
                  line.type === "delete" && "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-l-2 border-rose-500 line-through opacity-80",
                  line.type === "normal" && "text-foreground hover:bg-muted/30 border-l-2 border-transparent"
                )}
              >
                <div className="flex select-none gap-2 text-muted-foreground/60 w-12 shrink-0 text-right pr-3 font-mono text-[10px]">
                  <span className="w-5">{line.oldLineNumber ?? ""}</span>
                  <span className="w-5">{line.newLineNumber ?? ""}</span>
                </div>
                <span className="select-none w-4 shrink-0 font-bold">
                  {line.type === "add" ? "+" : line.type === "delete" ? "-" : " "}
                </span>
                <span className="whitespace-pre-wrap break-words flex-1">{line.content || " "}</span>
              </div>
            ))}
          </div>
        ) : (
          /* Split 2-column view */
          <div className="grid grid-cols-2 divide-x divide-border/40 min-w-[600px]">
            {/* Left: Original / Deletions */}
            <div className="divide-y divide-border/10">
              <div className="px-3 py-1 bg-muted/40 font-semibold text-muted-foreground text-2xs sticky top-0">
                Trước (Original)
              </div>
              {lines.map((line, idx) => {
                if (line.type === "add") {
                  return (
                    <div key={idx} className="h-6 bg-muted/10 opacity-30 select-none" />
                  );
                }
                return (
                  <div
                    key={idx}
                    className={cn(
                      "flex items-start px-2 py-0.5",
                      line.type === "delete" && "bg-rose-500/10 text-rose-700 dark:text-rose-300 line-through"
                    )}
                  >
                    <span className="select-none w-6 shrink-0 text-muted-foreground/60 text-right pr-2 text-[10px]">
                      {line.oldLineNumber ?? ""}
                    </span>
                    <span className="whitespace-pre-wrap break-words flex-1">{line.content || " "}</span>
                  </div>
                );
              })}
            </div>

            {/* Right: Modified / Additions */}
            <div className="divide-y divide-border/10">
              <div className="px-3 py-1 bg-muted/40 font-semibold text-muted-foreground text-2xs sticky top-0">
                Sau khi sửa (Modified)
              </div>
              {lines.map((line, idx) => {
                if (line.type === "delete") {
                  return (
                    <div key={idx} className="h-6 bg-muted/10 opacity-30 select-none" />
                  );
                }
                return (
                  <div
                    key={idx}
                    className={cn(
                      "flex items-start px-2 py-0.5",
                      line.type === "add" && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-medium"
                    )}
                  >
                    <span className="select-none w-6 shrink-0 text-muted-foreground/60 text-right pr-2 text-[10px]">
                      {line.newLineNumber ?? ""}
                    </span>
                    <span className="whitespace-pre-wrap break-words flex-1">{line.content || " "}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
