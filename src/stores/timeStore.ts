import { writable, derived } from 'svelte/store';
import { TimeSystem } from '../engine/core/TimeSystem';

const INITIAL_MINUTES = 8 * 60; // Día 1, 08:00

function createTimeStore() {
  const { subscribe, update, set } = writable(INITIAL_MINUTES);

  return {
    subscribe,
    advance(minutes: number) {
      update((t) => t + minutes);
    },
    set,
    reset() {
      set(INITIAL_MINUTES);
    },
  };
}

export const timeStore = createTimeStore();
export const gameTime = derived(timeStore, TimeSystem.fromMinutes);
