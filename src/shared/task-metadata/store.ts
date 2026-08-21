import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TaskMetadata } from './types';

const MAX_TASK_RECORDS = 200;

type TaskMetadataState = {
  records: Record<string, TaskMetadata>;
  order: string[];
  begin: (record: TaskMetadata) => void;
  update: (id: string, updates: Partial<TaskMetadata>) => void;
  remove: (id: string) => void;
};

export const useTaskMetadataStore = create<TaskMetadataState>()(
  persist(
    (set) => ({
      records: {},
      order: [],
      begin: (record) => set((state) => {
        const order = [record.id, ...state.order.filter((id) => id !== record.id)].slice(0, MAX_TASK_RECORDS);
        const allowed = new Set(order);
        const records = Object.fromEntries(
          [...Object.entries(state.records), [record.id, record]].filter(([id]) => allowed.has(id)),
        );
        return { records, order };
      }),
      update: (id, updates) => set((state) => {
        const current = state.records[id];
        if (!current) return state;
        return { records: { ...state.records, [id]: { ...current, ...updates } } };
      }),
      remove: (id) => set((state) => {
        const records = { ...state.records };
        delete records[id];
        return { records, order: state.order.filter((item) => item !== id) };
      }),
    }),
    { name: 'longdd-task-metadata-v1', version: 1 },
  ),
);

function safelyRecord(action: () => void) {
  try { action(); }
  catch (error) { console.warn('[TaskMetadata] Could not save task information:', error); }
}

export const taskMetadata = {
  begin(record: TaskMetadata) { safelyRecord(() => useTaskMetadataStore.getState().begin(record)); },
  update(id: string, updates: Partial<TaskMetadata>) { safelyRecord(() => useTaskMetadataStore.getState().update(id, updates)); },
  submitted(id: string, submittedAt = Date.now()) {
    safelyRecord(() => useTaskMetadataStore.getState().update(id, { status: 'submitting', submittedAt }));
  },
  completed(id: string, outputUrl?: string, details?: TaskMetadata['details']) {
    const current = useTaskMetadataStore.getState().records[id];
    safelyRecord(() => useTaskMetadataStore.getState().update(id, {
      status: 'completed',
      completedAt: Date.now(),
      outputUrl,
      details: { ...(current?.details || {}), ...(details || {}) },
    }));
  },
  failed(id: string, error: unknown) {
    safelyRecord(() => useTaskMetadataStore.getState().update(id, {
      status: error instanceof DOMException && error.name === 'AbortError' ? 'cancelled' : 'failed',
      completedAt: Date.now(),
      error: error instanceof Error ? error.message : String(error),
    }));
  },
};
