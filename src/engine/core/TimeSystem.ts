import type { DayPhase, GameTime } from '../types';

export class TimeSystem {
  static readonly MINUTES_PER_HOUR = 60;
  static readonly MINUTES_PER_DAY = 24 * 60;

  static fromMinutes(totalMinutes: number): GameTime {
    const day = Math.floor(totalMinutes / TimeSystem.MINUTES_PER_DAY) + 1;
    const minutesInDay = totalMinutes % TimeSystem.MINUTES_PER_DAY;
    const hour = Math.floor(minutesInDay / TimeSystem.MINUTES_PER_HOUR);
    const minute = minutesInDay % TimeSystem.MINUTES_PER_HOUR;
    return { totalMinutes, day, hour, minute, phase: TimeSystem.getPhase(hour) };
  }

  static getPhase(hour: number): DayPhase {
    if (hour >= 5 && hour < 7) return 'dawn';
    if (hour >= 7 && hour < 19) return 'day';
    if (hour >= 19 && hour < 21) return 'dusk';
    return 'night';
  }

  static isNight(hour: number): boolean {
    return hour >= 21 || hour < 5;
  }

  static formatTime(time: GameTime): string {
    const h = String(time.hour).padStart(2, '0');
    const m = String(time.minute).padStart(2, '0');
    return `Día ${time.day} — ${h}:${m}`;
  }

  static phaseLabel(phase: DayPhase): string {
    const labels: Record<DayPhase, string> = {
      dawn: 'Amanecer',
      day: 'Día',
      dusk: 'Crepúsculo',
      night: 'Noche',
    };
    return labels[phase];
  }
}
