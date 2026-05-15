export interface PlayerState {
  health: number;      // 0–100
  hunger: number;      // 0–100 (100 = full)
  thirst: number;      // 0–100 (100 = full)
  fatigue: number;     // 0–100 (100 = exhausted)
  infection: number;   // 0–100
  morale: number;      // 0–100
}

export const INITIAL_PLAYER: PlayerState = {
  health: 100,
  hunger: 100,
  thirst: 100,
  fatigue: 0,
  infection: 0,
  morale: 70,
};
