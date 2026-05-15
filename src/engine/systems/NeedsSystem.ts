import type { PlayerState } from '../entities/Player';

// Rates are per 60 minutes (1 in-game hour)
const HUNGER_DRAIN   = 5;   // hunger decreases
const THIRST_DRAIN   = 8;   // thirst decreases
const FATIGUE_GAIN   = 4;   // fatigue increases
const MORALE_DRAIN   = 2;   // morale decreases slowly
const INFECTION_SPREAD = 2; // infection increases if > 0

const HUNGER_DAMAGE_THRESHOLD = 30; // HP loss rate: 2/hr
const THIRST_DAMAGE_THRESHOLD = 20; // HP loss rate: 4/hr
const HUNGER_HP_DRAIN  = 2;
const THIRST_HP_DRAIN  = 4;
const INFECTION_HP_DRAIN = 3; // per hour when infection >= 80

export type DeathCause = 'starvation' | 'dehydration' | 'infection' | 'injury';

export class NeedsSystem {
  static advance(state: PlayerState, minutes: number): PlayerState {
    const ratio = minutes / 60;
    let { health, hunger, thirst, fatigue, infection, morale } = state;

    hunger    = Math.max(0, hunger    - HUNGER_DRAIN   * ratio);
    thirst    = Math.max(0, thirst    - THIRST_DRAIN   * ratio);
    fatigue   = Math.min(100, fatigue + FATIGUE_GAIN   * ratio);
    morale    = Math.max(0, morale    - MORALE_DRAIN   * ratio);

    if (infection > 0) {
      infection = Math.min(100, infection + INFECTION_SPREAD * ratio);
    }

    if (hunger < HUNGER_DAMAGE_THRESHOLD) {
      health = Math.max(0, health - HUNGER_HP_DRAIN * ratio);
    }
    if (thirst < THIRST_DAMAGE_THRESHOLD) {
      health = Math.max(0, health - THIRST_HP_DRAIN * ratio);
    }
    if (infection >= 80) {
      health = Math.max(0, health - INFECTION_HP_DRAIN * ratio);
    }

    return { health, hunger, thirst, fatigue, infection, morale };
  }

  static isDead(state: PlayerState): boolean {
    return state.health <= 0;
  }

  static isTurned(state: PlayerState): boolean {
    return state.infection >= 100;
  }

  static isGameOver(state: PlayerState): boolean {
    return NeedsSystem.isDead(state) || NeedsSystem.isTurned(state);
  }

  static deathCause(state: PlayerState): DeathCause {
    if (state.infection >= 100) return 'infection';
    if (state.thirst <= 0 && state.thirst <= state.hunger) return 'dehydration';
    if (state.hunger <= 0) return 'starvation';
    return 'injury';
  }

  static warnings(prev: PlayerState, next: PlayerState): string[] {
    const msgs: string[] = [];
    if (prev.hunger >= 30 && next.hunger < 30) msgs.push('Hambre crítica. Necesitas comer pronto.');
    if (prev.thirst >= 20 && next.thirst < 20) msgs.push('Sed crítica. Necesitas agua ahora.');
    if (prev.fatigue <= 80 && next.fatigue > 80) msgs.push('Agotamiento extremo. Descansa.');
    if (prev.infection < 50 && next.infection >= 50) msgs.push('La infección avanza. Busca antibióticos.');
    if (prev.infection < 80 && next.infection >= 80) msgs.push('Infección grave. La muerte se acerca.');
    if (prev.morale >= 20 && next.morale < 20) msgs.push('Al borde del colapso mental.');
    return msgs;
  }
}
