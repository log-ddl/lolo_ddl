import type { CanvasNodeState } from './types';
import type { GoogleFlowTaskEvent } from '../packages/ai-core/providers/google-flow/types';

export function generationPhase(current: Pick<CanvasNodeState, 'phase' | 'phaseStartedAt'> | undefined, task: GoogleFlowTaskEvent, now = Date.now()): Pick<CanvasNodeState, 'phase' | 'phaseStartedAt'> | null {
  const phase = task.status === 'completed' ? 'downloading' : task.status;
  if (phase === 'failed' || phase === 'cancelled' || current?.phase === phase) return null;
  const generating = phase === 'submitting' || phase === 'polling';
  return { phase, phaseStartedAt: generating
    ? (current?.phase === 'submitting' ? current.phaseStartedAt : task.submittedAt || now)
    : now };
}
