import { useRef, useState } from 'react';
import { Download, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/shared/i18n';
import { useCanvasStore } from '@/features/video-studio/canvas/canvas-store';
import { exportSpace, importSpaceArchive, downloadBlob } from '@/features/video-studio/canvas/archive';

export function SpaceTransfer({ spaceId, vertical = false }: { spaceId?: string; vertical?: boolean }) {
  const { t } = useI18n();
  const [progress, setProgress] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const report = (done: number, total: number) => setProgress(`${done}/${total}`);
  const exportCurrent = async () => {
    const space = useCanvasStore.getState().spaces.find((space) => space.id === spaceId);
    if (!space || progress !== null) return;
    setProgress('…');
    try { downloadBlob(await exportSpace(structuredClone(space), report), `${(space.name || 'space').replace(/[\\/:*?"<>|]/g, '-')}.canvas`); }
    catch (error) { toast.error(String(error)); }
    finally { setProgress(null); }
  };
  const importFile = async (file: File) => {
    if (progress !== null) return;
    setProgress('…');
    try { useCanvasStore.getState().importSpace(await importSpaceArchive(file, report)); }
    catch (error) { toast.error(String(error)); }
    finally { setProgress(null); }
  };
  return <div className={`relative flex items-center gap-1 ${vertical ? "flex-col" : ""}`}>
    <input ref={input} type="file" accept=".canvas" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void importFile(file); }} />
    <button className="rounded-md p-2 hover:bg-accent disabled:opacity-40" disabled={progress !== null} title={t('canvas.import')} aria-label={t('canvas.import')} onClick={() => input.current?.click()}><Upload className="size-4" /></button>
    {spaceId && <button className="rounded-md p-2 hover:bg-accent disabled:opacity-40" disabled={progress !== null} title={t('canvas.export')} aria-label={t('canvas.export')} onClick={() => void exportCurrent()}><Download className="size-4" /></button>}
    {progress !== null && <span className={`flex items-center gap-1 whitespace-nowrap text-xs ${vertical ? "absolute left-full top-0 ml-2 rounded-md border border-border bg-card px-2 py-1 shadow-sm" : ""}`}><Loader2 className="size-3 animate-spin" />{progress}</span>}
  </div>;
}
