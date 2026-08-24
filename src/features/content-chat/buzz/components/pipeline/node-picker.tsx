"use client";

/** The searchable "add node" palette that opens from the canvas toolbar. */

import { Search, X } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { localizedNodeName, type NodeFamily, type PickerItem } from "./types";

export function NodePicker({ vietnamese, query, onQueryChange, items, onPick, onClose }: {
  vietnamese: boolean;
  query: string;
  onQueryChange: (value: string) => void;
  items: PickerItem[];
  onPick: (item: PickerItem) => void;
  onClose: () => void;
}) {
  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-border bg-card shadow-[-8px_0_24px_rgba(0,0,0,0.05)]">
      <div className="flex items-start justify-between gap-3 px-4 pb-3 pt-4">
        <div><h2 className="text-sm font-semibold">Thêm gì vào workflow?</h2><p className="mt-1 text-2xs text-muted-foreground">Chọn một node rồi nối dữ liệu trên canvas.</p></div>
        <Button variant="ghost" size="icon" className="size-7" onClick={onClose}><X className="size-4" /></Button>
      </div>
      <div className="px-4 pb-3">
        <div className="relative"><Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" /><Input autoFocus value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Tìm node…" className="pl-9" /></div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        {(["input", "function", "agent"] as NodeFamily[]).map((family) => {
          const group = items.filter((item) => item.family === family);
          if (group.length === 0) return null;
          return <div key={family} className="mb-3"><p className="px-2 py-1.5 text-2xs font-semibold text-muted-foreground">{family === "input" ? (vietnamese ? "Đầu vào" : "Input") : family === "function" ? (vietnamese ? "Hàm" : "Function") : "Agent"}</p>{group.map((item) => <button key={item.id} type="button" onClick={() => onPick(item)} className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition hover:bg-accent"><span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted"><item.icon className={cn("size-4", item.color)} /></span><span className="min-w-0"><span className="block text-xs font-medium">{localizedNodeName(item.title, vietnamese)}</span><span className="mt-0.5 block text-2xs text-muted-foreground">{item.description}</span></span></button>)}</div>;
        })}
      </div>
    </aside>
  );
}

