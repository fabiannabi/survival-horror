import { writable, get } from 'svelte/store';
import { EventBus } from '../engine/core/EventBus';
import { RNG } from '../engine/core/RNG';
import { TurnManager } from '../engine/core/TurnManager';
import { Logger } from '../engine/core/Logger';
import { logStore } from './logStore';
import { timeStore } from './timeStore';
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

    newGame(seed?: number) {
      bus = new EventBus();
      const gameSeed = seed ?? Date.now();
      rng = new RNG(gameSeed);
      turnManager = new TurnManager(bus, INITIAL_TIME);
      logger = new Logger(bus);

      bus.on<LogEntry>('log:entry', (entry) => logStore.add(entry));
      bus.on<number>('turn:advanced', (time) => timeStore.set(time));

      timeStore.reset();
      logStore.clear();

      logger.narrative('Despiertas en una ciudad muerta. El silencio es absoluto.', INITIAL_TIME);
      logger.info('Día 1. Busca recursos. Evita el ruido. Sobrevive.', INITIAL_TIME);

      turnManager.schedule('player', 0);

      set({
        version: '0.0.1',
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

    getRNG(): RNG | null {
      return rng;
    },
    getLogger(): Logger | null {
      return logger;
    },
    getTurnManager(): TurnManager | null {
      return turnManager;
    },
  };
}

export const gameStore = createGameStore();
