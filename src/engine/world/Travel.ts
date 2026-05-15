import type { ZoneState } from './Zone';

export class Travel {
  static canTravel(zones: Record<string, ZoneState>, fromId: string, toId: string): boolean {
    return zones[fromId]?.connections.includes(toId) ?? false;
  }

  static cost(zones: Record<string, ZoneState>, fromId: string, toId: string): number {
    return zones[fromId]?.travelCost[toId] ?? 999;
  }

  static describe(fromName: string, toName: string, minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const time = h > 0 ? `${h}h${m > 0 ? ` ${m}min` : ''}` : `${m}min`;
    return `Viajas de ${fromName} a ${toName}. (${time})`;
  }
}
