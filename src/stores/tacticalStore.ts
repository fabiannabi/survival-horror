import { writable } from 'svelte/store';
import { Path as RotPath, RNG as RotRNG } from 'rot-js';
import { ZoneMap } from '../engine/world/ZoneMap';
import { generateZoneMap } from '../engine/world/ZoneMapGen';
import { TacticalFOV } from '../engine/world/TacticalFOV';
import { LootTable } from '../engine/world/LootTable';
import { ZombieAI } from '../engine/systems/ZombieAI';
import { CombatSystem } from '../engine/systems/CombatSystem';
import type { ZoneMapState } from '../engine/world/ZoneMap';
import type { ZoneType } from '../engine/world/Zone';
import type { Item } from '../engine/entities/Item';
import type { ZombieState } from '../engine/entities/Zombie';

export const MAX_AP = 4;

export interface TacticalState extends ZoneMapState {
  containerLoot: Record<string, Item[]>;
  zombies: ZombieState[];
  ap: number;
  maxAp: number;
}

export type ActionEvent =
  | { type: 'zombie_attack'; damage: number; infection: number }
  | { type: 'player_hit_zombie'; damage: number; killed: boolean };

export interface ActionResult {
  steps: number;
  events: ActionEvent[];
}

export interface LootResult extends ActionResult {
  items: Item[] | null;
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

  function push(s: TacticalState) { current = s; set(s); }

  function runAI(state: TacticalState, noiseRange: number): { state: TacticalState; events: ActionEvent[] } {
    const { zombies, attacks } = ZombieAI.process(
      state.zombies, state, state.playerX, state.playerY, noiseRange,
    );
    const events: ActionEvent[] = attacks.map(a => ({ type: 'zombie_attack' as const, ...a }));
    return { state: { ...state, zombies }, events };
  }

  function playerPassable(state: TacticalState) {
    return (x: number, y: number) =>
      ZoneMap.isWalkable(state, x, y) &&
      !state.zombies.some(z => z.x === x && z.y === y);
  }

  return {
    subscribe,

    enter(zoneId: string, type: ZoneType, seed: number, danger = 5) {
      const gen = generateZoneMap(zoneId, type, seed);
      let s: ZoneMapState = { zoneId: gen.zoneId, width: gen.width, height: gen.height, tiles: gen.tiles, playerX: gen.playerX, playerY: gen.playerY };
      s = TacticalFOV.compute(s, s.playerX, s.playerY);

      // Generate container loot from positions found during map gen
      const lootSeed = (seed * 999983 + hashId(zoneId) + 17) >>> 0;
      const savedRng = RotRNG.getState();
      RotRNG.setSeed(lootSeed);

      const containerLoot: Record<string, Item[]> = {};
      for (const [cx, cy] of gen.containerPositions)
        containerLoot[`${cx},${cy}`] = LootTable.generate(type, zoneId);

      // Spawn zombies
      const zombieSeed = (seed * 888883 + hashId(zoneId) + 42) >>> 0;
      RotRNG.setSeed(zombieSeed);

      const zombieCount = Math.max(1, Math.floor(1 + danger * 0.5));
      const zombies: ZombieState[] = [];
      let attempts = 0;
      while (zombies.length < zombieCount && attempts < 300) {
        attempts++;
        const x = 1 + Math.floor(RotRNG.getUniform() * (s.width  - 2));
        const y = 1 + Math.floor(RotRNG.getUniform() * (s.height - 2));
        if (!ZoneMap.isWalkable(s, x, y)) continue;
        if (Math.max(Math.abs(x - s.playerX), Math.abs(y - s.playerY)) < 8) continue;
        if (zombies.some(z => z.x === x && z.y === y)) continue;
        zombies.push({
          id: `z${zombies.length}`,
          x, y,
          health:    30 + Math.floor(RotRNG.getUniform() * 20),
          maxHealth: 50,
          aiState:   'patrol',
          alertX: 0, alertY: 0, alertTurns: 0,
        });
      }

      RotRNG.setState(savedRng);
      push({ ...s, containerLoot, zombies, ap: MAX_AP, maxAp: MAX_AP });
    },

    exit() { current = null; set(null); },

    moveTo(tx: number, ty: number): ActionResult {
      const state = current;
      if (!state || state.ap <= 0) return { steps: 0, events: [] };

      const pass = playerPassable(state);
      if (!pass(tx, ty)) return { steps: 0, events: [] };
      if (tx === state.playerX && ty === state.playerY) return { steps: 0, events: [] };

      const path: [number, number][] = [];
      const astar = new RotPath.AStar(tx, ty, pass);
      astar.compute(state.playerX, state.playerY, (x, y) => path.push([x, y]));
      if (path.length < 2) return { steps: 0, events: [] };

      // Walk as many steps as AP allows
      const apCost = Math.min(path.length - 1, state.ap);
      const dest = path[apCost];
      const [nx, ny] = dest;
      const newAp = state.ap - apCost;

      const fovState = TacticalFOV.compute({ ...state, playerX: nx, playerY: ny }, nx, ny);
      const moved: TacticalState = { ...fovState, containerLoot: state.containerLoot, zombies: state.zombies, ap: newAp, maxAp: state.maxAp };

      if (newAp <= 0) {
        const noiseRange = Math.min(Math.ceil(apCost / 2), 6);
        const { state: afterAI, events } = runAI(moved, noiseRange);
        push({ ...afterAI, ap: MAX_AP });
        return { steps: apCost, events };
      }
      push(moved);
      return { steps: apCost, events: [] };
    },

    moveAdjacentTo(cx: number, cy: number): ActionResult {
      const state = current;
      if (!state) return { steps: 0, events: [] };

      const dirs: [number, number][] = [[0,-1],[0,1],[-1,0],[1,0],[-1,-1],[1,-1],[-1,1],[1,1]];
      let best: [number, number] | null = null;
      let bestDist = Infinity;

      const pass = playerPassable(state);
      for (const [dx, dy] of dirs) {
        const nx = cx + dx, ny = cy + dy;
        if (!pass(nx, ny)) continue;
        const d = Math.abs(nx - state.playerX) + Math.abs(ny - state.playerY);
        if (d < bestDist) { bestDist = d; best = [nx, ny]; }
      }

      return best ? this.moveTo(best[0], best[1]) : { steps: 0, events: [] };
    },

    attack(zx: number, zy: number): ActionResult {
      const state = current;
      if (!state || state.ap < 2) return { steps: 0, events: [] };

      const zIdx = state.zombies.findIndex(z => z.x === zx && z.y === zy);
      if (zIdx === -1) return { steps: 0, events: [] };

      const damage = CombatSystem.playerAttackDamage();
      const newHealth = state.zombies[zIdx].health - damage;
      const killed = newHealth <= 0;

      const newZombies = state.zombies.map((z, i) =>
        i === zIdx ? { ...z, health: newHealth } : z,
      ).filter(z => z.health > 0);

      const events: ActionEvent[] = [{ type: 'player_hit_zombie', damage, killed }];
      const newAp = state.ap - 2;

      if (newAp <= 0) {
        const { state: afterAI, events: aiEvents } = runAI({ ...state, zombies: newZombies }, 3);
        push({ ...afterAI, ap: MAX_AP });
        return { steps: 1, events: [...events, ...aiEvents] };
      }
      push({ ...state, zombies: newZombies, ap: newAp });
      return { steps: 1, events };
    },

    loot(cx: number, cy: number): LootResult {
      const state = current;
      if (!state || state.ap < 2) return { items: null, steps: 0, events: [] };

      const key = `${cx},${cy}`;
      const items = state.containerLoot[key] ?? null;
      if (!items) return { items: null, steps: 0, events: [] };

      const newTiles = state.tiles.map(row => row.map(t => ({ ...t })));
      const vis = newTiles[cy][cx].vis;
      newTiles[cy][cx] = { type: 'container_empty', walkable: false, transparent: true, vis };

      const newContainerLoot = { ...state.containerLoot };
      delete newContainerLoot[key];
      const newAp = state.ap - 2;

      if (newAp <= 0) {
        const { state: afterAI, events } = runAI(
          { ...state, tiles: newTiles, containerLoot: newContainerLoot }, 1,
        );
        push({ ...afterAI, ap: MAX_AP });
        return { items, steps: 1, events };
      }
      push({ ...state, tiles: newTiles, containerLoot: newContainerLoot, ap: newAp });
      return { items, steps: 1, events: [] };
    },

    endTurn(): ActionResult {
      const state = current;
      if (!state) return { steps: 0, events: [] };
      const { state: afterAI, events } = runAI(state, 0);
      push({ ...afterAI, ap: MAX_AP });
      return { steps: 0, events };
    },
  };
}

export const tacticalStore = createTacticalStore();
