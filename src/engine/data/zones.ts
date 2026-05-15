import type { ZoneState } from '../world/Zone';

export interface ZoneStateDef extends ZoneState {
  canStart: boolean;
  startDescription?: string;
}

// Zone data is now generated procedurally via ProceduralMapGen.generateMap()
export const INITIAL_ZONES: ZoneStateDef[] = [];
