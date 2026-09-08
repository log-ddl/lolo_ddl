/**
 * Which queue entry runs next.
 *
 * Its own module so it can be tested without pulling in the store — that file
 * reaches for the engine, the project switcher and persisted storage, none of
 * which this decision needs. Structurally typed for the same reason: the only
 * thing picking cares about is a status and an optional time.
 */

export interface SchedulableEntry {
  status: string;
  /** Epoch ms this entry was asked to start at. Missing = as soon as its turn comes. */
  scheduledAt?: number;
}

/**
 * The pending entry to work on now.
 *
 * An entry whose time has come wins even if an entry above it is still waiting
 * for a later slot. Without that, a due entry sits behind a not-yet-due one while
 * the background scheduler keeps waking the queue up precisely because something
 * is due — it starts the runner, the runner parks on the wrong entry, and the
 * due one never runs.
 *
 * With nothing due, park on the entry whose time comes soonest rather than the
 * topmost one, so the queue wakes up when it actually has work.
 */
export function pickNextEntry<T extends SchedulableEntry>(entries: T[], now: number): T | undefined {
  const pending = entries.filter((entry) => entry.status === 'pending');
  const ready = pending.find((entry) => entry.scheduledAt === undefined || entry.scheduledAt <= now);
  if (ready) return ready;
  return pending.reduce<T | undefined>(
    (soonest, entry) => (!soonest || (entry.scheduledAt ?? 0) < (soonest.scheduledAt ?? 0) ? entry : soonest),
    undefined,
  );
}
