/**
 * Staggered concurrency runner.
 *
 * Behavior:
 * - Each new task starts only after waiting at least staggerMs from the previous launch.
 * - No more than maxConcurrent tasks run at the same time.
 * - When concurrency is full, later tasks wait in a queue until a slot is freed,
 *   while still respecting the stagger interval.
 *
 * Example with maxConcurrent=3, staggerMs=5000, and each task taking 20s:
 *   t=0s:  start task 1
 *   t=5s:  start task 2
 *   t=10s: start task 3 (concurrency limit reached)
 *   t=15s: task 4 stagger is ready but concurrency is full, so it waits in queue
 *   t=20s: task 1 completes -> task 4 starts immediately
 *   t=25s: task 2 completes -> task 5 starts immediately
 *
 * Example with maxConcurrent=1, staggerMs=5000, and each task taking 2s:
 *   t=0s:  start task 1
 *   t=2s:  task 1 completes
 *   t=5s:  stagger is ready -> start task 2 (strict 5s spacing preserved)
 *   t=7s:  task 2 completes
 *   t=10s: start task 3
 */
export async function runStaggered<T>(
  tasks: (() => Promise<T>)[],
  maxConcurrent: number,
  staggerMs: number | (() => number) = 5000
): Promise<PromiseSettledResult<T>[]> {
  if (tasks.length === 0) return [];

  const results: PromiseSettledResult<T>[] = new Array(tasks.length);

  // Semaphore controlling maximum concurrency.
  let activeCount = 0;
  const waiters: (() => void)[] = [];

  const acquire = async (): Promise<void> => {
    if (activeCount < maxConcurrent) {
      activeCount++;
      return;
    }
    // Concurrency is full, so wait in queue.
    await new Promise<void>((resolve) => waiters.push(resolve));
  };

  const release = (): void => {
    activeCount--;
    if (waiters.length > 0) {
      // Wake the next waiter in the queue.
      activeCount++;
      const next = waiters.shift()!;
      next();
    }
  };

  // Launch tasks one by one with staggerMs spacing.
  // Task N can only start after N * staggerMs, while still being gated by the semaphore.
  let nextLaunchDelayMs = 0;
  const taskPromises = tasks.map(async (task, idx) => {
    // Staggered launch: task N starts no earlier than N * staggerMs.
    if (idx > 0) {
      const delayMs = typeof staggerMs === 'function' ? staggerMs() : staggerMs;
      nextLaunchDelayMs += Math.max(0, delayMs || 0);
      await new Promise<void>((r) => setTimeout(r, nextLaunchDelayMs));
    }

    // Acquire a concurrency slot, waiting if necessary.
    await acquire();

    try {
      const value = await task();
      results[idx] = { status: 'fulfilled', value };
    } catch (reason) {
      results[idx] = { status: 'rejected', reason: reason as any };
    } finally {
      release();
    }
  });

  await Promise.all(taskPromises);
  return results;
}
