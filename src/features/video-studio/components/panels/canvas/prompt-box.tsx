import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/shared/i18n";

export function PromptBox({ value, onCommit, placeholder, rows, dragToMove = false }: {
  value: string;
  onCommit: (value: string) => void;
  placeholder: string;
  rows: number;
  dragToMove?: boolean;
}) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const echo = useRef(value);

  useEffect(() => {
    if (value === echo.current) return;
    echo.current = value;
    setDraft(value);
  }, [value]);

  const commit = (next: string) => {
    if (echo.current === next) return;
    echo.current = next;
    onCommit(next);
  };

  if (dragToMove && !editing) return <div
    role="textbox" tabIndex={0} aria-label={placeholder} aria-readonly="true"
    title={t("canvas.editTextHint")}
    onDoubleClick={(event) => { event.stopPropagation(); setEditing(true); }}
    onKeyDown={(event) => { if (event.key === 'Enter' || event.key === 'F2') { event.preventDefault(); event.stopPropagation(); setEditing(true); } }}
    style={{ minHeight: rows * 20 + 16 }}
    className="canvas-prompt w-full cursor-grab whitespace-pre-wrap break-words px-3 py-2 text-[11px] leading-5 outline-none"
  >{draft || <span className="text-muted-foreground">{placeholder}</span>}</div>;

  return (
    <textarea
      autoFocus={dragToMove}
      spellCheck={false}
      value={draft}
      onChange={(event) => {
        const next = event.target.value;
        setDraft(next);
        // An IME is mid-word here; committing now would round-trip through the
        // store and cut the composition short.
        // Keep typing local; blur commits before a Run button click.
      }}
      onCompositionEnd={(event) => {
        setDraft((event.target as HTMLTextAreaElement).value);
      }}
      placeholder={placeholder}
      rows={rows}
      onPointerDown={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
      onKeyUp={(event) => event.stopPropagation()}
      onBlur={(event) => { commit(event.currentTarget.value); setEditing(false); }}
      aria-label={placeholder}
      className="canvas-prompt nodrag nopan nowheel block w-full resize-none bg-transparent px-3 py-2 text-[11px] leading-5 outline-none placeholder:text-muted-foreground focus:bg-accent/20"
    />
  );
}

