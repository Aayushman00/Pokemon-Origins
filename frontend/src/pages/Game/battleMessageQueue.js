/**
 * Paced battle-log queue (spec §1). push() returns a promise that resolves
 * when *that* line is handed to onLine, so beats can `await` their text
 * before playing the visual it introduces. Lines are spaced by gapMs()
 * after each paint. clear() resolves every unpainted line so no beat is
 * left awaiting forever (restart / new action).
 */
export function createMessageQueue({
  onLine,
  gapMs,
  setTimer = setTimeout,
  clearTimer = clearTimeout,
}) {
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
    timer = setTimer(flush, gapMs());
  };

  return {
    push(message) {
      return new Promise((resolve) => {
        pending.push({ message, resolve });
        if (timer === null) flush();
      });
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
