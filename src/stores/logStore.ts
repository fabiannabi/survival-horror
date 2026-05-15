import { writable } from 'svelte/store';
import type { LogEntry } from '../engine/types';

const MAX_ENTRIES = 200;

function createLogStore() {
  const { subscribe, update, set } = writable<LogEntry[]>([]);

  return {
    subscribe,
    add(entry: LogEntry) {
      update((entries) => {
        const next = [...entries, entry];
        return next.length > MAX_ENTRIES ? next.slice(-MAX_ENTRIES) : next;
      });
    },
    clear() {
      set([]);
    },
  };
}

export const logStore = createLogStore();
