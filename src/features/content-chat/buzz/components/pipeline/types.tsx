import { Bot, FileText, FolderOpen, GitBranch, Merge, Repeat2, Type } from "lucide-react";
import type {
  BuzzConnection,
  BuzzFunctionKind,
  BuzzInputKind,
  RunStepStatus,
} from "../../types";

/** Shapes the React Flow canvas carries on its nodes and edges. */

export type NodeFamily = "input" | "function" | "agent";

export type CanvasNodeData = {
  family: NodeFamily;
  kind: BuzzInputKind | BuzzFunctionKind | "agent";
  title: string;
  subtitle: string;
  runningLabel: string;
  status: RunStepStatus;
  onAddNext: (sourceHandle?: BuzzConnection['sourceHandle']) => void;
  onOpen: () => void;
  onDelete: () => void;
  onRun: () => void;
};

export type PickerItem = {
  id: "input-text" | "input-file" | "input-folder" | "function-merge" | "function-condition" | "function-loop" | "agent";
  family: NodeFamily;
  title: string;
  description: string;
  icon: typeof Bot;
  color: string;
};

export type EditorInputSource = {
  id: string;
  kind: BuzzInputKind | "agent";
  field: string;
  dataType: "text" | "path";
  value: string;
  token: string;
};

export type CanvasEdgeData = {
  onDelete: (id: string) => void;
  branchLabel?: string;
  branchTone?: "success" | "danger" | "loop" | "done";
};

export const PICKER_ITEMS: PickerItem[] = [
  { id: "input-text", family: "input", title: "Text", description: "Đề bài hoặc nội dung văn bản", icon: Type, color: "text-blue-500" },
  { id: "input-file", family: "input", title: "File", description: "Markdown, DOCX, TXT, JSON…", icon: FileText, color: "text-blue-500" },
  { id: "input-folder", family: "input", title: "Folder", description: "Cho agent đọc cả thư mục", icon: FolderOpen, color: "text-blue-500" },
  { id: "function-merge", family: "function", title: "Merge", description: "Gộp nhiều input thành một luồng", icon: Merge, color: "text-amber-500" },
  { id: "function-condition", family: "function", title: "If", description: "Rẽ nhánh Đúng hoặc Sai theo dữ liệu", icon: GitBranch, color: "text-violet-500" },
  { id: "function-loop", family: "function", title: "Loop", description: "Quay lại một nhánh với số lượt giới hạn", icon: Repeat2, color: "text-cyan-500" },
  { id: "agent", family: "agent", title: "Agent", description: "Chạy Claude, OpenCode hoặc Codex CLI", icon: Bot, color: "text-primary" },
];

export const STATUS_COLORS: Record<RunStepStatus, string> = {
  pending: "bg-muted-foreground/40",
  running: "bg-blue-500",
  checking: "bg-amber-500",
  awaiting: "bg-violet-500",
  passed: "bg-emerald-500",
  failed: "bg-destructive",
  skipped: "bg-muted-foreground/30",
};


export function localizedNodeName(name: string, vietnamese: boolean): string {
  if (!vietnamese) return name;
  return ({ Text: "Văn bản", File: "Tệp", Folder: "Thư mục", Merge: "Gộp", If: "Điều kiện", Loop: "Vòng lặp", Agent: "Agent" } as Record<string, string>)[name] ?? name;
}
