import type { EventBus } from './EventBus';
import type { LogEntry, LogEntryType } from '../types';

export class Logger {
  constructor(private bus: EventBus) {}

  log(message: string, type: LogEntryType = 'info', timestamp: number = 0): void {
    const entry: LogEntry = {
      id: crypto.randomUUID(),
      timestamp,
      message,
      type,
    };
    this.bus.emit('log:entry', entry);
  }

  info(message: string, timestamp?: number): void {
    this.log(message, 'info', timestamp);
  }

  narrative(message: string, timestamp?: number): void {
    this.log(message, 'narrative', timestamp);
  }

  combat(message: string, timestamp?: number): void {
    this.log(message, 'combat', timestamp);
  }

  warning(message: string, timestamp?: number): void {
    this.log(message, 'warning', timestamp);
  }

  danger(message: string, timestamp?: number): void {
    this.log(message, 'danger', timestamp);
  }
}
