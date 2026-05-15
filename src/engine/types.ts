export type DayPhase = 'dawn' | 'day' | 'dusk' | 'night';
export type LogEntryType = 'info' | 'combat' | 'narrative' | 'warning' | 'danger';
export type Difficulty = 'easy' | 'normal' | 'hard' | 'iron';

export interface GameTime {
  totalMinutes: number;
  day: number;
  hour: number;
  minute: number;
  phase: DayPhase;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  message: string;
  type: LogEntryType;
}

export interface GameMeta {
  version: string;
  seed: number;
  startedAt: number;
  difficulty: Difficulty;
  permadeath: boolean;
}

export interface ScheduledAction {
  entityId: string;
  time: number;
}
