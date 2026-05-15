import { writable, get } from 'svelte/store';
import { EventBus } from '../engine/core/EventBus';
import { RNG } from '../engine/core/RNG';
import { TurnManager } from '../engine/core/TurnManager';
import { Logger } from '../engine/core/Logger';
import { StrategicMap } from '../engine/world/StrategicMap';
import { Travel } from '../engine/world/Travel';
import { INITIAL_ZONES, type ZoneStateDef } from '../engine/data/zones';
import { logStore } from './logStore';
import { timeStore } from './timeStore';
import { worldStore } from './worldStore';
import { uiStore } from './uiStore';
import type { LogEntry, GameMeta } from '../engine/types';

const INITIAL_TIME = 8 * 60; // Día 1, 08:00

function createGameStore() {
  const { subscribe, set } = writable<GameMeta | null>(null);

  let bus: EventBus | null = null;
  let rng: RNG | null = null;
  let turnManager: TurnManager | null = null;
  let logger: Logger | null = null;

  return {
    subscribe,

    newGame(seed?: number, startZoneId = 'centro') {
      bus = new EventBus();
      const gameSeed = seed ?? Date.now();
      rng = new RNG(gameSeed);
      turnManager = new TurnManager(bus, INITIAL_TIME);
      logger = new Logger(bus);

      bus.on<LogEntry>('log:entry', (entry) => logStore.add(entry));
      bus.on<number>('turn:advanced', (time) => timeStore.set(time));

      timeStore.reset();
      logStore.clear();

      // Initialize world with zone data
      const startId = startZoneId ?? 'centro';
      const zones = Object.fromEntries(
        INITIAL_ZONES.map((z) => {
          // Reveal start zone + its neighbors
          if (z.id === startId) return [z.id, { ...z, fog: 'explored' as const }];
          const startZone = INITIAL_ZONES.find((s) => s.id === startId);
          if (startZone?.connections.includes(z.id)) return [z.id, { ...z, fog: 'scouted' as const }];
          return [z.id, z];
        }),
      );
      worldStore.set({
        cityName: 'Aguascalientes',
        currentZoneId: startId,
        zones,
        globalThreat: 10,
        weather: 'clear',
      });
      uiStore.selectZone(startId);

      const startZone = INITIAL_ZONES.find((z) => z.id === startId);
      logger.narrative(
        startZone?.startDescription ?? 'Despiertas en una ciudad muerta. El silencio es absoluto.',
        INITIAL_TIME,
      );
      logger.info('Día 1. Aguascalientes ha caído. Explora el mapa.', INITIAL_TIME);

      turnManager.schedule('player', 0);

      set({
        version: '0.0.2',
        seed: gameSeed,
        startedAt: Date.now(),
        difficulty: 'normal',
        permadeath: false,
      });
    },

    playerAction(minutes: number, description?: string) {
      if (!turnManager || !logger) return;
      const time = get(timeStore);
      if (description) logger.info(description, time);
      turnManager.advance(minutes);
      turnManager.schedule('player', 0);
    },

    travel(targetId: string) {
      if (!logger) return;
      const world = get(worldStore);
      if (!Travel.canTravel(world.zones, world.currentZoneId, targetId)) return;

      const cost = Travel.cost(world.zones, world.currentZoneId, targetId);
      const fromZone = world.zones[world.currentZoneId];
      const toZone = world.zones[targetId];
      const desc = Travel.describe(fromZone.name, toZone.name, cost);

      this.playerAction(cost, desc);

      const newZones = StrategicMap.revealAfterTravel(world.zones, targetId);
      worldStore.moveToZone(targetId, newZones);
      uiStore.selectZone(targetId);

      if (toZone.danger >= 7) {
        const time = get(timeStore);
        logger.warning(`${toZone.name}: zona de alto peligro. Mantente alerta.`, time);
      }
    },

    getRNG(): RNG | null { return rng; },
    getLogger(): Logger | null { return logger; },
    getTurnManager(): TurnManager | null { return turnManager; },
  };
}

export const gameStore = createGameStore();
