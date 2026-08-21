import type { StateStorage } from 'zustand/middleware';
import { fileStorage } from './indexed-db-storage';


/**
 * Bọc một StateStorage lại và gộp các lượt ghi.
 *
 * Zustand persist ghi sau MỌI `set()`. Với store lớn (lịch sử chat ~550 KB) hoặc
 * store bị sửa liên tục (kéo node trên canvas, gõ trong ô prompt), mỗi lượt là
 * serialize toàn bộ state + IPC + `fs.writeFileSync` đồng bộ ở main process — tức
 * là chặn cả cửa sổ, kể cả những phần không liên quan.
 *
 * Gộp lại: chỉ ghi bản mới nhất, tối đa một lần mỗi `delayMs`.
 */

interface Pending {
  value: string;
  timer: ReturnType<typeof setTimeout>;
  /** Đích ghi đi kèm, để flush không phải đoán target. */
  target: StateStorage;
}

const pending = new Map<string, Pending>();
/** Ghi đang bay, để `flushPendingWrites` chờ được và tránh ghi chồng lệch thứ tự. */
let inflight: Promise<unknown> = Promise.resolve();

function writeNow(name: string): void {
  const entry = pending.get(name);
  if (!entry) return;
  clearTimeout(entry.timer);
  pending.delete(name);
  // Nối đuôi nhau để bản ghi sau không về đích trước bản ghi trước.
  inflight = inflight
    .catch(() => undefined)
    .then(() => entry.target.setItem(name, entry.value));
}

export function createDebouncedStorage(target: StateStorage, delayMs = 400): StateStorage {
  return {
    getItem: (name) => {
      // Bản chưa kịp ghi vẫn là bản mới nhất — phải trả nó, không thì hydrate lại
      // sẽ đọc ra dữ liệu cũ hơn những gì user vừa làm.
      const entry = pending.get(name);
      if (entry) return Promise.resolve(entry.value);
      return target.getItem(name);
    },

    setItem: (name, value) => {
      const entry = pending.get(name);
      if (entry) clearTimeout(entry.timer);
      pending.set(name, {
        value,
        target,
        timer: setTimeout(() => writeNow(name), delayMs),
      });
    },

    removeItem: (name) => {
      const entry = pending.get(name);
      if (entry) {
        clearTimeout(entry.timer);
        pending.delete(name);
      }
      return target.removeItem(name);
    },
  };
}

/** Ghi ngay mọi thứ còn treo. Gọi trước khi cửa sổ đóng. */
export function flushPendingWrites(): Promise<unknown> {
  for (const name of [...pending.keys()]) writeNow(name);
  return inflight;
}

if (typeof window !== 'undefined') {
  // Main hoãn quit lại và gọi xuống đây, nên lượt flush này chạy trọn vẹn —
  // đây mới là đường bảo đảm không mất gì khi đóng app.
  window.fileStorage?.onFlushRequest?.(() => void flushPendingWrites());
  // Dự phòng cho reload / đóng tab / chạy trên trình duyệt.
  window.addEventListener('beforeunload', () => void flushPendingWrites());
  window.addEventListener('pagehide', () => void flushPendingWrites());
  // Chuyển sang app khác hoặc thu nhỏ là lúc rảnh, tranh thủ ghi xuống luôn.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void flushPendingWrites();
  });
  window.addEventListener('blur', () => void flushPendingWrites());
}

/** fileStorage đã gộp ghi — dùng cái này thay cho fileStorage trong store lớn/ghi dày. */
export const debouncedFileStorage = createDebouncedStorage(fileStorage);
