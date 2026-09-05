import fs from 'node:fs';
import path from 'node:path';

/**
 * Per (Flow account × model) daily-quota locks.
 *
 * Google answers PUBLIC_ERROR_PER_MODEL_DAILY_QUOTA_REACHED when an account has
 * burned its daily allowance for one specific model. Every other model on that
 * same account keeps working, so a lock is always scoped to the pair — locking
 * the whole account would park a usable Veo/Omni lane because an image model ran
 * out (and vice versa).
 */

export type FlowQuotaLock = {
  /** Account identity (`slot.ownerScopeId`) — stable across app restarts. */
  ownerScopeId: string;
  /** Last credential that hit the wall; display only. */
  credentialId: string;
  /** Resolved model key sent to Flow (`GEM_PIX_2`, `veo_3_1_i2v_s_fast`, ...). */
  modelKey: string;
  lockedAt: number;
  until: number;
};

// Only the daily reason locks. A bare HTTP 429 can also be short-term rate
// limiting, which the pollers already treat as retryable — parking an account
// for the rest of the day over one of those would be far worse than a retry.
const DAILY_QUOTA_REASON = /PER_MODEL_DAILY_QUOTA|DAILY_QUOTA_REACHED|DAILY_QUOTA_EXCEEDED/i;

export function isDailyQuotaError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return DAILY_QUOTA_REASON.test(message);
}

const PACIFIC_CLOCK = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Los_Angeles', hour12: false,
  hour: '2-digit', minute: '2-digit', second: '2-digit',
});

/**
 * Google Flow's daily quota rolls over at midnight America/Los_Angeles, so a
 * lock expires at the next PT midnight rather than 24h after the 429 — the
 * latter would keep an account parked through most of the following day.
 * A DST switch moves that boundary by an hour twice a year; the lock is only a
 * scheduling hint, so being an hour early or late there costs one retry.
 */
export function nextQuotaResetAt(now: number): number {
  const parts = PACIFIC_CLOCK.formatToParts(new Date(now));
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value || 0);
  const elapsedMs = (((value('hour') % 24) * 60 + value('minute')) * 60 + value('second')) * 1_000;
  return now - elapsedMs + 24 * 60 * 60 * 1_000;
}

export class FlowQuotaLockStore {
  private locks = new Map<string, FlowQuotaLock>();
  private readonly filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
    try {
      const parsed = JSON.parse(fs.readFileSync(this.filePath, 'utf8')) as FlowQuotaLock[];
      if (Array.isArray(parsed)) {
        for (const lock of parsed) {
          if (!lock?.ownerScopeId || !lock.modelKey || typeof lock.until !== 'number') continue;
          this.locks.set(keyOf(lock.ownerScopeId, lock.modelKey), lock);
        }
      }
    } catch { this.locks.clear(); }
    this.prune();
  }

  /** Expiry timestamp if this pair is still locked, otherwise undefined. */
  lockedUntil(ownerScopeId: string, modelKey: string): number | undefined {
    const lock = this.locks.get(keyOf(ownerScopeId, modelKey));
    if (!lock) return undefined;
    if (lock.until <= Date.now()) { this.locks.delete(keyOf(ownerScopeId, modelKey)); this.save(); return undefined; }
    return lock.until;
  }

  isLocked(ownerScopeId: string, modelKey: string): boolean {
    return this.lockedUntil(ownerScopeId, modelKey) !== undefined;
  }

  lock(ownerScopeId: string, credentialId: string, modelKey: string): FlowQuotaLock {
    const now = Date.now();
    const lock: FlowQuotaLock = { ownerScopeId, credentialId, modelKey, lockedAt: now, until: nextQuotaResetAt(now) };
    this.locks.set(keyOf(ownerScopeId, modelKey), lock);
    this.save();
    return lock;
  }

  /** Live locks, optionally narrowed to one account. */
  list(ownerScopeId?: string): FlowQuotaLock[] {
    this.prune();
    const all = [...this.locks.values()];
    return ownerScopeId ? all.filter((lock) => lock.ownerScopeId === ownerScopeId) : all;
  }

  /** Manual unlock — for when Google's reset lands earlier than we assumed. */
  clear(ownerScopeId?: string, modelKey?: string): number {
    let removed = 0;
    for (const [key, lock] of [...this.locks]) {
      if (ownerScopeId && lock.ownerScopeId !== ownerScopeId) continue;
      if (modelKey && lock.modelKey !== modelKey) continue;
      this.locks.delete(key);
      removed += 1;
    }
    if (removed) this.save();
    return removed;
  }

  private prune(): void {
    const now = Date.now();
    let changed = false;
    for (const [key, lock] of [...this.locks]) {
      if (lock.until > now) continue;
      this.locks.delete(key);
      changed = true;
    }
    if (changed) this.save();
  }

  private save(): void {
    try {
      fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
      fs.writeFileSync(this.filePath, JSON.stringify([...this.locks.values()], null, 2), 'utf8');
    } catch { /* a lost lock only costs one wasted 429 */ }
  }
}

function keyOf(ownerScopeId: string, modelKey: string): string {
  return `${ownerScopeId}\0${modelKey}`;
}
