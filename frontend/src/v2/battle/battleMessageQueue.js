/**
 * Paced battle-log queue. push() returns a promise that resolves when
 * *that* line is handed to onLine, so beats can `await` their text before
 * playing the visual it introduces. Each line holds for gapMs(line) after
 * it paints (V2: long lines hold longer so the typewriter can finish).
 * skip() cuts the current hold short (player fast-forward). clear()
 * resolves every unpainted line so no beat awaits forever (restart / new
 * action).
 */
export function createMessageQueue({ onLine, gapMs, setTimer = setTimeout, clearTimer = clearTimeout }) {
  let pending = [];
  let timer = null;

  const flush = () => {
    if (pending.length === 0) {
      timer = null;
      return;
    }
    const { message, resolve } = pending.shift();
    onLine(message);
    resolve();
    timer = setTimer(flush, gapMs(message));
  };

  return {
    push(message) {
      return new Promise((resolve) => {
        pending.push({ message, resolve });
        if (timer === null) flush();
      });
    },
    skip() {
      if (timer === null) return;
      clearTimer(timer);
      flush();
    },
    clear() {
      if (timer !== null) clearTimer(timer);
      timer = null;
      const dropped = pending;
      pending = [];
      dropped.forEach((entry) => entry.resolve());
    },
    isIdle() {
      return pending.length === 0 && timer === null;
    },
  };
}
