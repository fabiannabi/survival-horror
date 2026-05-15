import { writable } from 'svelte/store';
import type { ZoneState } from '../engine/world/Zone';

export type Weather = 'clear' | 'rain' | 'storm' | 'fog';

export interface WorldState {
  cityName: string;
  currentZoneId: string;
  zones: Record<string, ZoneState>;
  globalThreat: number;
  weather: Weather;
}

function createWorldStore() {
  const { subscribe, update, set } = writable<WorldState>({
    cityName: 'Villarosa',
    currentZoneId: 'refugio',
    zones: {},
    globalThreat: 10,
    weather: 'clear',
  });

  return {
    subscribe,
    set,
    update,
    moveToZone(zoneId: string, newZones: Record<string, ZoneState>) {
      update((w) => ({ ...w, currentZoneId: zoneId, zones: newZones }));
    },
    setZones(zones: Record<string, ZoneState>) {
      update((w) => ({ ...w, zones }));
    },
  };
}

export const worldStore = createWorldStore();
