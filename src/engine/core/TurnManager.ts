import type { EventBus } from './EventBus';
import type { ScheduledAction } from '../types';

export class TurnManager {
  private queue: ScheduledAction[] = [];
  private _currentTime: number;

  constructor(
    private bus: EventBus,
    startTime: number = 0,
  ) {
    this._currentTime = startTime;
  }

  get currentTime(): number {
    return this._currentTime;
  }

  schedule(entityId: string, delayMinutes: number): void {
    const time = this._currentTime + Math.max(0, delayMinutes);
    this.queue.push({ entityId, time });
    this.queue.sort((a, b) => a.time - b.time);
  }

  next(): ScheduledAction | null {
    const action = this.queue.shift();
    if (!action) return null;
    this._currentTime = action.time;
    this.bus.emit('turn:advanced', this._currentTime);
    return action;
  }

  advance(minutes: number): void {
    this._currentTime += Math.max(0, minutes);
    this.bus.emit('turn:advanced', this._currentTime);
  }

  peek(): ScheduledAction | null {
    return this.queue[0] ?? null;
  }

  getQueue(): readonly ScheduledAction[] {
    return this.queue;
  }

  clear(): void {
    this.queue = [];
  }
}
