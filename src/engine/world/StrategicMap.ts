import { FOG_ORDER, type ZoneState, type FogLevel } from './Zone';

export class StrategicMap {
  static isConnected(zones: Record<string, ZoneState>, fromId: string, toId: string): boolean {
    return zones[fromId]?.connections.includes(toId) ?? false;
  }

  static getTravelCost(zones: Record<string, ZoneState>, fromId: string, toId: string): number {
    return zones[fromId]?.travelCost[toId] ?? 999;
  }

  static getConnected(zones: Record<string, ZoneState>, fromId: string): ZoneState[] {
    return (zones[fromId]?.connections ?? []).map((id) => zones[id]).filter(Boolean);
  }

  static revealAfterTravel(
    zones: Record<string, ZoneState>,
    arrivedAt: string,
  ): Record<string, ZoneState> {
    const updated = { ...zones };

    updated[arrivedAt] = { ...updated[arrivedAt], fog: 'explored' };

    for (const connId of updated[arrivedAt]?.connections ?? []) {
      if (!updated[connId]) continue;
      const current = updated[connId].fog;
      if (FOG_ORDER.indexOf(current) < FOG_ORDER.indexOf('scouted' as FogLevel)) {
        updated[connId] = { ...updated[connId], fog: 'scouted' };
      }
    }

    return updated;
  }
}
