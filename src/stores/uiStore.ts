import { writable } from 'svelte/store';

export type Screen = 'menu' | 'game' | 'gameOver';

interface UiState {
  screen: Screen;
  logOpen: boolean;
}

function createUiStore() {
  const { subscribe, update } = writable<UiState>({ screen: 'menu', logOpen: true });

  return {
    subscribe,
    setScreen(screen: Screen) {
      update((s) => ({ ...s, screen }));
    },
    toggleLog() {
      update((s) => ({ ...s, logOpen: !s.logOpen }));
    },
  };
}

export const uiStore = createUiStore();
