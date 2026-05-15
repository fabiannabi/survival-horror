import { writable } from 'svelte/store';
import { Path as RotPath, RNG as RotRNG } from 'rot-js';
import { ZoneMap } from '../engine/world/ZoneMap';
import { TacticalFOV } from '../engine/world/TacticalFOV';
import { LootTable } from '../engine/world/LootTable';
import type { ZoneMapState } from '../engine/world/ZoneMap';
import type { ZoneType } from '../engine/world/Zone';
import type { Item } from '../engine/entities/Item';

export interface TacticalState extends ZoneMapState {
  containerLoot: Record<string, Item[]>;
}

function hashId(id: string): number {
  let h = 5381;
  for (let i = 0; i < id.length; i++) h = (h * 33 ^ id.charCodeAt(i)) >>> 0;
  return h;
}

function createTacticalStore() {
  const { subscribe, set } = writable<TacticalState | null>(null);
  let current: TacticalState | null = null;
  subscribe(v => { current = v; });

  function push(s: TacticalState) {
    current = s;
    set(s);
  }

  return {
    subscribe,

    enter(zoneId: string, type: ZoneType, seed: number) {
      let s = ZoneMap.generate(zoneId, type, seed);
      s = TacticalFOV.compute(s, s.playerX, s.playerY);

      const lootSeed = (seed * 999983 + hashId(zoneId) + 17) >>> 0;
      const savedRng = RotRNG.getState();
      RotRNG.setSeed(lootSeed);

      const containerLoot: Record<string, Item[]> = {};
      for (let y = 0; y < s.height; y++) {
        for (let x = 0; x < s.width; x++) {
          if (s.tiles[y][x].type === 'container') {
            containerLoot[`${x},${y}`] = LootTable.generate(type);
          }
        }
      }

      RotRNG.setState(savedRng);
      push({ ...s, containerLoot });
    },

    exit() {
      current = null;
      set(null);
    },

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
      let next: TacticalState = { ...state, playerX: nx, playerY: ny };
      next = { ...TacticalFOV.compute(next, nx, ny), containerLoot: state.containerLoot };
      push(next);
      return steps;
    },

    moveAdjacentTo(cx: number, cy: number): number {
      const state = current;
      if (!state) return 0;

      const dirs: [number, number][] = [[0,-1],[0,1],[-1,0],[1,0],[-1,-1],[1,-1],[-1,1],[1,1]];
      let best: [number, number] | null = null;
      let bestDist = Infinity;

      for (const [dx, dy] of dirs) {
        const nx = cx + dx, ny = cy + dy;
        if (ZoneMap.isWalkable(state, nx, ny)) {
          const d = Math.abs(nx - state.playerX) + Math.abs(ny - state.playerY);
          if (d < bestDist) { bestDist = d; best = [nx, ny]; }
        }
      }

      return best ? this.moveTo(best[0], best[1]) : 0;
    },

    loot(cx: number, cy: number): Item[] | null {
      const state = current;
      if (!state) return null;

      const key = `${cx},${cy}`;
      const items = state.containerLoot[key];
      if (!items) return null;

      const newTiles = state.tiles.map(row => row.map(t => ({ ...t })));
      const vis = newTiles[cy][cx].vis;
      newTiles[cy][cx] = { type: 'container_empty', walkable: false, transparent: true, vis };

      const newContainerLoot = { ...state.containerLoot };
      delete newContainerLoot[key];

      push({ ...state, tiles: newTiles, containerLoot: newContainerLoot });
      return items;
    },
  };
}

export const tacticalStore = createTacticalStore();
