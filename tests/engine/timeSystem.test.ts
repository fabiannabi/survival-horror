import { describe, it, expect } from 'vitest';
import { TimeSystem } from '../../src/engine/core/TimeSystem';

describe('TimeSystem', () => {
  it('converts 480 minutes to Day 1, 08:00', () => {
    const t = TimeSystem.fromMinutes(480);
    expect(t.day).toBe(1);
    expect(t.hour).toBe(8);
    expect(t.minute).toBe(0);
    expect(t.phase).toBe('day');
  });

  it('midnight (0 min) is Day 1, 00:00, night', () => {
    const t = TimeSystem.fromMinutes(0);
    expect(t.day).toBe(1);
    expect(t.hour).toBe(0);
    expect(t.minute).toBe(0);
    expect(t.phase).toBe('night');
  });

  it('24h later is Day 2', () => {
    const t = TimeSystem.fromMinutes(24 * 60 + 480);
    expect(t.day).toBe(2);
    expect(t.hour).toBe(8);
  });

  it('preserves minutes within the hour', () => {
    const t = TimeSystem.fromMinutes(8 * 60 + 37);
    expect(t.hour).toBe(8);
    expect(t.minute).toBe(37);
  });

  it('getPhase — dawn at 5 and 6', () => {
    expect(TimeSystem.getPhase(5)).toBe('dawn');
    expect(TimeSystem.getPhase(6)).toBe('dawn');
    expect(TimeSystem.getPhase(7)).toBe('day');
  });

  it('getPhase — dusk at 19 and 20', () => {
    expect(TimeSystem.getPhase(19)).toBe('dusk');
    expect(TimeSystem.getPhase(20)).toBe('dusk');
    expect(TimeSystem.getPhase(21)).toBe('night');
  });

  it('getPhase — night wraps through midnight', () => {
    expect(TimeSystem.getPhase(21)).toBe('night');
    expect(TimeSystem.getPhase(0)).toBe('night');
    expect(TimeSystem.getPhase(4)).toBe('night');
  });

  it('isNight returns true for 21-4', () => {
    expect(TimeSystem.isNight(21)).toBe(true);
    expect(TimeSystem.isNight(2)).toBe(true);
    expect(TimeSystem.isNight(4)).toBe(true);
    expect(TimeSystem.isNight(5)).toBe(false);
    expect(TimeSystem.isNight(12)).toBe(false);
  });

  it('formatTime produces correct string', () => {
    const t = TimeSystem.fromMinutes(8 * 60 + 5);
    expect(TimeSystem.formatTime(t)).toBe('Día 1 — 08:05');
  });
});
