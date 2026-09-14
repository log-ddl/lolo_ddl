import { useState } from 'react';
import { Library, Trash2 } from 'lucide-react';
import { useCanvasStore } from '@/features/video-studio/canvas/canvas-store';
import { Dialog, DialogContent, DialogTitle } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { useI18n } from '@/shared/i18n';

export function TemplateLibrary({ spaceId, selected, position, onInsert }: { spaceId: string; selected: string[]; position: () => { x: number; y: number }; onInsert: (ids: string[]) => void }) {
  const { t } = useI18n();
  const templates = useCanvasStore((state) => state.templates);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  return <><Button variant="ghost" size="icon" title={t('canvas.templates')} aria-label={t('canvas.templates')} onClick={() => setOpen(true)}><Library className="size-4" /></Button>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-lg"><DialogTitle>{t('canvas.templates')}</DialogTitle>
      <p className="text-xs text-muted-foreground">{t('canvas.templatesHint')}</p>
      <div className="flex gap-2"><input value={name} onChange={(e) => setName(e.target.value)} aria-label={t('canvas.templateName')} placeholder={t('canvas.templateName')} className="min-w-0 flex-1 rounded border border-border bg-background p-2 text-sm" /><Button disabled={!selected.length || !name.trim()} onClick={() => { useCanvasStore.getState().saveTemplate(spaceId, selected, name); setName(''); }}>{t('canvas.saveSelection')}</Button></div>
      <div className="max-h-80 space-y-2 overflow-auto">{templates.map((template) => <div key={template.id} className="flex items-center gap-2 rounded border border-border p-2"><span className="min-w-0 flex-1 truncate text-sm">{template.name}</span><Button variant="secondary" size="sm" onClick={() => {
        const at = position(); const minX = Math.min(...template.nodes.map((node) => node.position.x)); const minY = Math.min(...template.nodes.map((node) => node.position.y));
        const nodes = template.nodes.map((node) => ({ ...node, position: { x: node.position.x - minX + at.x, y: node.position.y - minY + at.y } }));
        onInsert(useCanvasStore.getState().pasteNodes(spaceId, nodes, template.edges, 0)); setOpen(false);
      }}>{t('canvas.picker.insert')}</Button><Button variant="ghost" size="icon" aria-label={t('canvas.node.delete')} onClick={() => useCanvasStore.getState().deleteTemplate(template.id)}><Trash2 className="size-4" /></Button></div>)}</div>
    </DialogContent></Dialog></>;
}
