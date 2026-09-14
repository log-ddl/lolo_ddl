import { useI18n } from '@/shared/i18n';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { mentionPattern } from '@/features/video-studio/canvas/mentions';
export interface MentionOption { id: string; label: string }
function read(element: Node): string {
  if (element instanceof HTMLElement && element.dataset.mention) return `@{${element.dataset.mention}}`;
  if (element.nodeType === Node.TEXT_NODE) return element.textContent || '';
  if (element.nodeName === 'BR') return '\n';
  return Array.from(element.childNodes).map((child, i) => `${i > 0 && child.nodeName === 'DIV' ? '\n' : ''}${read(child)}`).join('');
}
function chip(id: string, label: string) {
  const span = document.createElement('span'); span.dataset.mention = id; span.contentEditable = 'false';
  span.className = 'canvas-mention-chip'; span.textContent = `@${label}`; return span;
}
export function MentionEditor({ value, onCommit, placeholder, rows, options }: {
  value: string; onCommit: (value: string) => void; placeholder: string; rows: number; options: MentionOption[];
}) {
  const { t } = useI18n();
  const editor = useRef<HTMLDivElement>(null);
  const queryRange = useRef<Range | null>(null);
  const [menu, setMenu] = useState<{ query: string; x: number; y: number } | null>(null);
  const [active, setActive] = useState(0);
  const composing = useRef(false);
  useEffect(() => {
    const el = editor.current; if (!el) return;
    if (document.activeElement !== el) {
      el.replaceChildren(); let end = 0;
      for (const match of value.matchAll(mentionPattern)) {
        el.append(document.createTextNode(value.slice(end, match.index)), chip(match[1], options.find((o) => o.id === match[1])?.label || t('canvas.mentionUnavailable')));
        end = match.index! + match[0].length;
      }
      el.append(document.createTextNode(value.slice(end)));
    } else el.querySelectorAll<HTMLElement>('[data-mention]').forEach((span) => { const label = '@' + (options.find((o) => o.id === span.dataset.mention)?.label || t('canvas.mentionUnavailable')); if (span.textContent !== label) span.textContent = label; });
  }, [value, options, t]);
  const search = () => {
    if (composing.current) return;
    const selection = window.getSelection();
    if (!selection?.rangeCount || !selection.isCollapsed) { setMenu(null); return; }
    const range = selection.getRangeAt(0); const text = range.startContainer;
    if (text.nodeType !== Node.TEXT_NODE || !editor.current?.contains(text)) { setMenu(null); return; }
    const match = (text.textContent || '').slice(0, range.startOffset).match(/(?:^|\s)@([^@\n]*)$/);
    if (!match) { setMenu(null); return; }
    const replace = range.cloneRange(); replace.setStart(text, range.startOffset - match[1].length - 1); queryRange.current = replace;
    const box = range.getBoundingClientRect();
    setMenu({ query: match[1], x: Math.min(box.left, window.innerWidth - 270), y: Math.min(box.bottom + 6, window.innerHeight - 230) }); setActive(0);
  };
  const filtered = options.filter((o) => o.label.toLocaleLowerCase().includes(menu?.query.toLocaleLowerCase() || '')).slice(0, 8);
  const choose = (option: MentionOption) => {
    const range = queryRange.current; if (!range || !editor.current) return;
    range.deleteContents(); const span = chip(option.id, option.label); range.insertNode(span);
    const space = document.createTextNode(' '); span.after(space); range.setStart(space, 1); range.collapse(true);
    const selection = window.getSelection(); selection?.removeAllRanges(); selection?.addRange(range);
    setMenu(null); editor.current.focus();
  };
  return <>
    <div ref={editor} contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true" aria-label={placeholder}
      data-placeholder={placeholder} title="@ → node" spellCheck={false}
      style={{ minHeight: rows * 20 + 16 }}
      className="canvas-prompt canvas-mention-editor nodrag nopan nowheel w-full whitespace-pre-wrap break-words bg-transparent px-3 py-2 text-[11px] leading-5 outline-none"
      onPointerDown={(e) => e.stopPropagation()} onInput={search} onKeyUp={(e) => e.stopPropagation()}
      onCompositionStart={() => { composing.current = true; }} onCompositionEnd={() => { composing.current = false; search(); }}
      onBlur={(e) => { onCommit(read(e.currentTarget)); setMenu(null); }}
      onPaste={(e) => { e.preventDefault(); const text = e.clipboardData.getData('text/plain'); const selection = window.getSelection(); if (!selection?.rangeCount) return; const range = selection.getRangeAt(0); range.deleteContents(); const node = document.createTextNode(text); range.insertNode(node); range.setStartAfter(node); range.collapse(true); selection.removeAllRanges(); selection.addRange(range); search(); }}
      onKeyDown={(e) => {
        e.stopPropagation(); if (composing.current || e.nativeEvent.isComposing || !menu) return;
        if (e.key === 'Escape') { e.preventDefault(); setMenu(null); }
        else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(0, Math.min(filtered.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1)))); }
        else if ((e.key === 'Enter' || e.key === 'Tab') && filtered[active]) { e.preventDefault(); choose(filtered[active]); }
      }} />
    {menu && createPortal(<div role="listbox" aria-label="Node" className="nodrag nopan fixed z-[100] w-64 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-xl" style={{ left: Math.max(8, menu.x), top: Math.max(8, menu.y) }}>
      {!filtered.length && <p className="px-3 py-2 text-xs text-muted-foreground">{t('canvas.mentionEmpty')}</p>}
      {filtered.map((option, index) => <button type="button" role="option" aria-selected={index === active} key={option.id} className={`block w-full truncate rounded px-3 py-2 text-left text-xs ${index === active ? 'bg-accent' : ''}`} onMouseDown={(e) => { e.preventDefault(); choose(option); }}>{'@' + option.label}</button>)}
    </div>, document.body)}
  </>;
}
