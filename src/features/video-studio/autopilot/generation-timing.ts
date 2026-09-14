/** Unknown start times stay unknown; mounting a view never starts a task. */
export function generationElapsedSeconds(status: string | undefined, submittedAt: number | undefined, now: number): number | undefined {
  if (status !== 'generating' && status !== 'uploading') return undefined;
  if (submittedAt === undefined || !Number.isFinite(submittedAt) || submittedAt <= 0) return undefined;
  return Math.max(0, Math.floor((now - submittedAt) / 1000));
}
