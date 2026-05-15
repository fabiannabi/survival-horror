export type ZoneType = 'residential' | 'commercial' | 'industrial' | 'medical' | 'military' | 'wild';
export type FogLevel = 'unknown' | 'rumored' | 'scouted' | 'explored';
export type LootQuality = 'low' | 'medium' | 'high' | 'rare';

export const FOG_ORDER: FogLevel[] = ['unknown', 'rumored', 'scouted', 'explored'];

export interface ZoneState {
  id: string;
  name: string;
  type: ZoneType;
  coords: [number, number];
  position: { x: number; y: number };
  connections: string[];
  travelCost: Record<string, number>;
  danger: number;
  noise: number;
  loot: { abundance: number; quality: LootQuality; depleted: number };
  fog: FogLevel;
  description: string;
  lore: string[];
}
