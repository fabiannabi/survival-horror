import { writable } from 'svelte/store';
import { INITIAL_PLAYER, type PlayerState } from '../engine/entities/Player';

function createPlayerStore() {
  const { subscribe, set, update } = writable<PlayerState>({ ...INITIAL_PLAYER });

  return {
    subscribe,
    reset() {
      set({ ...INITIAL_PLAYER });
    },
    apply(next: PlayerState) {
      set(next);
    },
    update,
  };
}

export const playerStore = createPlayerStore();
