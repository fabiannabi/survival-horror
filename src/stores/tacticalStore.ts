import { writable } from 'svelte/store';
import { Path as RotPath } from 'rot-js';
import { ZoneMap } from '../engine/world/ZoneMap';
import { TacticalFOV } from '../engine/world/TacticalFOV';
import type { ZoneMapState } from '../engine/world/ZoneMap';
import type { ZoneType } from '../engine/world/Zone';

function createTacticalStore() {
  const { subscribe, set } = writable<ZoneMapState | null>(null);
  let current: ZoneMapState | null = null;
  subscribe(v => { current = v; });

  return {
    subscribe,

    enter(zoneId: string, type: ZoneType, seed: number) {
      let s = ZoneMap.generate(zoneId, type, seed);
      s = TacticalFOV.compute(s, s.playerX, s.playerY);
      set(s);
    },

    exit() { set(null); },

    moveTo(tx: number, ty: number): number {
      const state = current;
      if (!state) return 0;
      if (!ZoneMap.isWalkable(state, tx, ty)) return 0;
      if (tx === state.playerX && ty === state.playerY) return 0;

      const path: [number, number][] = [];
      const astar = new RotPath.AStar(tx, ty, (x, y) => ZoneMap.isWalkable(state, x, y));
      astar.compute(state.playerX, state.playerY, (x, y) => path.push([x, y]));
      if (path.length < 2) return 0;

      const steps = path.length - 1;
      const [nx, ny] = path[path.length - 1];
      let next = { ...state, playerX: nx, playerY: ny };
      next = TacticalFOV.compute(next, nx, ny);
      set(next);
      return steps;
    },
  };
}

export const tacticalStore = createTacticalStore();
