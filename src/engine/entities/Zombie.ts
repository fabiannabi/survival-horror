export type ZombieAIState = 'patrol' | 'alerted' | 'chasing';

export interface ZombieState {
  id: string;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  aiState: ZombieAIState;
  alertX: number;
  alertY: number;
  alertTurns: number;
}
