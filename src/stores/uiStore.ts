import { writable } from 'svelte/store';

export type Screen = 'menu' | 'game' | 'gameOver';
export type PlayerMode = 'strategic' | 'tactical' | 'base';

interface UiState {
  screen: Screen;
  playerMode: PlayerMode;
  selectedZoneId: string | null;
  logOpen: boolean;
}

function createUiStore() {
  const { subscribe, update } = writable<UiState>({
    screen: 'menu',
    playerMode: 'strategic',
    selectedZoneId: null,
    logOpen: true,
  });

  return {
    subscribe,
    setScreen(screen: Screen) {
      update((s) => ({ ...s, screen }));
    },
    setPlayerMode(playerMode: PlayerMode) {
      update((s) => ({ ...s, playerMode }));
    },
    selectZone(id: string | null) {
      update((s) => ({ ...s, selectedZoneId: id }));
    },
    toggleLog() {
      update((s) => ({ ...s, logOpen: !s.logOpen }));
    },
  };
}

export const uiStore = createUiStore();
