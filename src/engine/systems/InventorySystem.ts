import type { PlayerState } from '../entities/Player';
import type { Item } from '../entities/Item';

export class InventorySystem {
  static useItem(player: PlayerState, item: Item): PlayerState {
    const e = item.effects;
    const clamp = (v: number) => Math.min(100, Math.max(0, v));
    return {
      health:    clamp(player.health    + (e.health    ?? 0)),
      hunger:    clamp(player.hunger    + (e.hunger    ?? 0)),
      thirst:    clamp(player.thirst    + (e.thirst    ?? 0)),
      fatigue:   clamp(player.fatigue   + (e.fatigue   ?? 0)),
      infection: clamp(player.infection + (e.infection ?? 0)),
      morale:    clamp(player.morale    + (e.morale    ?? 0)),
    };
  }

  static effectLabel(item: Item): string {
    const e = item.effects;
    const fmt = (label: string, v: number) => `${label} ${v > 0 ? '+' : ''}${v}`;
    return [
      e.hunger    ? fmt('Ham', e.hunger)    : '',
      e.thirst    ? fmt('Sed', e.thirst)    : '',
      e.health    ? fmt('HP',  e.health)    : '',
      e.infection ? fmt('Inf', e.infection) : '',
      e.fatigue   ? fmt('Fat', e.fatigue)   : '',
      e.morale    ? fmt('Mor', e.morale)    : '',
    ].filter(Boolean).join(' · ');
  }
}
