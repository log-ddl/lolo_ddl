export type TaskMetadataKind = 'image' | 'video' | 'script' | 'tts' | 'subtitle' | 'render' | 'other';
export type TaskMetadataStatus = 'queued' | 'submitting' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface TaskMetadata {
  id: string;
  kind: TaskMetadataKind;
  status: TaskMetadataStatus;
  title?: string;
  provider?: string;
  model?: string;
  prompt?: string;
  instruction?: string;
  queuedAt: number;
  submittedAt?: number;
  completedAt?: number;
  outputUrl?: string;
  error?: string;
  details?: Record<string, string | number | boolean | null | undefined>;
}

