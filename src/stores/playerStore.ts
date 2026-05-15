import { writable } from 'svelte/store';

export interface PlayerStub {
  name: string;
  health: number;
  maxHealth: number;
  hunger: number;
  fatigue: number;
}

export const playerStore = writable<PlayerStub>({
  name: 'Superviviente',
  health: 100,
  maxHealth: 100,
  hunger: 80,
  fatigue: 20,
});
