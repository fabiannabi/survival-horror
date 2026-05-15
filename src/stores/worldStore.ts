import { writable } from 'svelte/store';

export interface WorldStub {
  currentZone: string;
  globalThreat: number;
}

export const worldStore = writable<WorldStub>({
  currentZone: 'Refugio inicial',
  globalThreat: 10,
});
