import type { ZoneState } from './Zone';
import type { Item } from '../entities/Item';

export type TravelMode = 'foot' | 'bike' | 'car' | 'moto';

export interface ModeConfig {
  label: string;
  icon: string;
  speedFactor: number;   // multiplier on foot base time (< 1 = faster)
  noiseFactor: number;   // noise level on arrival (0–5)
  fatigueRate: number;   // extra fatigue per hour of foot-equivalent distance
  vehicleItem?: string;  // item ID required in inventory
}

const MODE_CONFIG: Record<TravelMode, ModeConfig> = {
  foot: { label: 'A pie',       icon: '🚶', speedFactor: 1.00, noiseFactor: 0, fatigueRate: 8 },
  bike: { label: 'Bicicleta',   icon: '🚲', speedFactor: 0.35, noiseFactor: 1, fatigueRate: 3, vehicleItem: 'bicicleta' },
  moto: { label: 'Motocicleta', icon: '🏍', speedFactor: 0.18, noiseFactor: 4, fatigueRate: 1, vehicleItem: 'llave_moto' },
  car:  { label: 'Automóvil',   icon: '🚗', speedFactor: 0.12, noiseFactor: 5, fatigueRate: 1, vehicleItem: 'llave_auto' },
};

export const ALL_MODES: TravelMode[] = ['foot', 'bike', 'moto', 'car'];

export class Travel {
  static canTravel(zones: Record<string, ZoneState>, fromId: string, toId: string): boolean {
    return zones[fromId]?.connections.includes(toId) ?? false;
  }

  // Base cost = foot travel time in minutes (from zone travelCost map)
  static cost(zones: Record<string, ZoneState>, fromId: string, toId: string): number {
    return zones[fromId]?.travelCost[toId] ?? 999;
  }

  // Actual travel time after applying mode speed
  static travelTime(baseCost: number, mode: TravelMode): number {
    return Math.max(5, Math.round(baseCost * MODE_CONFIG[mode].speedFactor));
  }

  // Extra noise added to destination zone on arrival
  static noiseOnArrival(mode: TravelMode): number {
    return MODE_CONFIG[mode].noiseFactor;
  }

  // Extra fatigue from physical exertion (on top of NeedsSystem base drain)
  static extraFatigue(baseCost: number, mode: TravelMode): number {
    return Math.round((baseCost / 60) * MODE_CONFIG[mode].fatigueRate);
  }

  // Which modes are available given current inventory
  static availableModes(inventory: Item[]): TravelMode[] {
    const ids = new Set(inventory.map(i => i.id));
    return ALL_MODES.filter(mode => {
      const required = MODE_CONFIG[mode].vehicleItem;
      return !required || ids.has(required);
    });
  }

  static modeConfig(mode: TravelMode): ModeConfig {
    return MODE_CONFIG[mode];
  }

  static describe(fromName: string, toName: string, minutes: number, mode: TravelMode = 'foot'): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const time = h > 0 ? `${h}h ${m > 0 ? `${m}min` : ''}`.trim() : `${m}min`;
    const modeLabel = MODE_CONFIG[mode].label.toLowerCase();
    return `Viajas ${modeLabel} de ${fromName} a ${toName}. (${time})`;
  }
}
