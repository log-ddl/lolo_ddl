import { useEffect, useRef, useState } from 'react';
import { Loader2, Send, X } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/shared/i18n';
import { useCanvasStore } from '@/features/video-studio/canvas/canvas-store';
import { askCanvasAssistant, graphFingerprint, prepareProposal, type CanvasProposal } from '@/features/video-studio/canvas/assistant';

export function CanvasAssistantPanel({ spaceId, selected, onClose }: { spaceId: string; selected: string[]; onClose: () => void }) {
  const { t } = useI18n();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [pending, setPending] = useState<{ proposal: CanvasProposal; fingerprint: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const send = async () => {
    const space = useCanvasStore.getState().spaces.find((space) => space.id === spaceId);
    if (!space || !input.trim() || busy) return;
    const request = input.trim(); setInput(''); setPending(null); setBusy(true);
    const abort = new AbortController(); controller.current = abort;
    setMessages((messages) => [...messages, { role: 'user', text: request }]);
    try {
      const proposal = await askCanvasAssistant(space, selected, request, messages, abort.signal);
      if (abort.signal.aborted) return;
      setMessages((messages) => [...messages, { role: 'assistant', text: proposal.message }]);
      if ([proposal.add, proposal.update, proposal.remove, proposal.connect, proposal.disconnect].some((items) => items?.length)) setPending({ proposal, fingerprint: graphFingerprint(space) });
    } catch (error) { if (!abort.signal.aborted) toast.error(error instanceof Error && error.message === "AI_NOT_CONFIGURED" ? t("canvas.ai.configure") : error instanceof Error ? error.message : String(error)); }
    finally { setBusy(false); }
  };
  const apply = () => {
    const space = useCanvasStore.getState().spaces.find((space) => space.id === spaceId);
    if (!pending || !space) return;
    if (space.nodes.some((node) => node.status === 'running') || graphFingerprint(space) !== pending.fingerprint) { toast.error(t('canvas.ai.changed')); return; }
    try {
      const graph = prepareProposal(space, pending.proposal);
      useCanvasStore.getState().replaceGraph(spaceId, graph.nodes, graph.edges); setPending(null);
      setMessages((messages) => [...messages, { role: 'assistant', text: t('canvas.ai.applied') }]);
    } catch (error) { toast.error(String(error)); }
  };
  return <aside className="flex h-full w-80 shrink-0 flex-col border-l border-border bg-card" onKeyDown={(event) => event.stopPropagation()}>
    <header className="flex items-center justify-between border-b border-border p-3 text-sm font-medium">{t('canvas.ai.title')}<button title={t('common.close')} onClick={onClose}><X className="size-4" /></button></header>
    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3 text-xs leading-5">
      <p className="text-muted-foreground">{t('canvas.ai.hint')}</p>
      {messages.map((message, index) => <p key={index} className={`whitespace-pre-wrap break-words rounded-lg p-3 ${message.role === 'user' ? 'bg-accent' : 'border border-border'}`}>{message.text}</p>)}
      {pending && <div className="space-y-2 rounded-lg border border-primary/40 p-3">
        <p>{t('canvas.ai.review', { add: pending.proposal.add?.length || 0, update: pending.proposal.update?.length || 0, remove: pending.proposal.remove?.length || 0 })}</p>
        <details><summary className="cursor-pointer">{t('canvas.ai.details')}</summary>
          <div className="max-h-72 space-y-2 overflow-y-auto pt-2">
            {[...(pending.proposal.add || []), ...(pending.proposal.update || [])].map((item) => <div key={item.id} className="rounded border border-border p-2">
              <strong>{item.name || item.id}</strong>
              {item.prompt !== undefined && <p className="whitespace-pre-wrap break-words">{item.prompt}</p>}
              {item.aspectRatio && <p>{item.aspectRatio}</p>}{item.model && <p>{item.model}</p>}
            </div>)}
            {(pending.proposal.remove || []).map((id) => <p key={id}>{t('canvas.node.delete')}: {id}</p>)}
            {(pending.proposal.connect || []).map((edge, index) => <p key={index}>{edge.source} → {edge.target} ({edge.targetHandle})</p>)}
            {(pending.proposal.disconnect || []).map((id) => <p key={id}>{t('canvas.edge.delete')}: {id}</p>)}
          </div>
        </details>
        <button onClick={apply} className="w-full rounded-md bg-primary p-2 text-primary-foreground">{t('canvas.ai.apply')}</button>
        <button onClick={() => setPending(null)} className="w-full p-1 text-muted-foreground">{t('canvas.ai.discard')}</button>
      </div>}
    </div>
    <form className="space-y-2 border-t border-border p-3" onSubmit={(event) => { event.preventDefault(); void send(); }}>
      <textarea value={input} onChange={(event) => setInput(event.target.value)} rows={3} placeholder={t('canvas.ai.placeholder')} className="w-full resize-none rounded-md border border-border bg-background p-2 text-xs" />
      {busy ? <button type="button" onClick={() => controller.current?.abort()} className="flex w-full items-center justify-center gap-2 rounded bg-muted p-2 text-xs"><Loader2 className="size-3 animate-spin" />{t('canvas.stop')}</button>
        : <button disabled={!input.trim()} className="flex w-full items-center justify-center gap-2 rounded bg-primary p-2 text-xs text-primary-foreground disabled:opacity-50"><Send className="size-3" />{t('canvas.ai.send')}</button>}
    </form>
  </aside>;
}
