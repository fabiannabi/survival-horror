import { describe, it, expect } from 'vitest';
import { NeedsSystem } from '../../src/engine/systems/NeedsSystem';
import { INITIAL_PLAYER } from '../../src/engine/entities/Player';

describe('NeedsSystem', () => {
  it('advance reduces hunger over time', () => {
    const next = NeedsSystem.advance(INITIAL_PLAYER, 60);
    expect(next.hunger).toBeLessThan(INITIAL_PLAYER.hunger);
  });

  it('advance reduces thirst over time', () => {
    const next = NeedsSystem.advance(INITIAL_PLAYER, 60);
    expect(next.thirst).toBeLessThan(INITIAL_PLAYER.thirst);
  });

  it('advance increases fatigue over time', () => {
    const next = NeedsSystem.advance(INITIAL_PLAYER, 60);
    expect(next.fatigue).toBeGreaterThan(INITIAL_PLAYER.fatigue);
  });

  it('does not advance infection if infection is 0', () => {
    const next = NeedsSystem.advance(INITIAL_PLAYER, 120);
    expect(next.infection).toBe(0);
  });

  it('advances infection when > 0', () => {
    const infected = { ...INITIAL_PLAYER, infection: 10 };
    const next = NeedsSystem.advance(infected, 60);
    expect(next.infection).toBeGreaterThan(10);
  });

  it('hunger below threshold causes HP loss', () => {
    const starving = { ...INITIAL_PLAYER, hunger: 10 };
    const next = NeedsSystem.advance(starving, 60);
    expect(next.health).toBeLessThan(INITIAL_PLAYER.health);
  });

  it('thirst below threshold causes HP loss', () => {
    const dehydrated = { ...INITIAL_PLAYER, thirst: 5 };
    const next = NeedsSystem.advance(dehydrated, 60);
    expect(next.health).toBeLessThan(INITIAL_PLAYER.health);
  });

  it('health never goes below 0', () => {
    const critical = { ...INITIAL_PLAYER, health: 1, hunger: 0, thirst: 0 };
    const next = NeedsSystem.advance(critical, 600);
    expect(next.health).toBeGreaterThanOrEqual(0);
  });

  it('isDead returns true when health is 0', () => {
    expect(NeedsSystem.isDead({ ...INITIAL_PLAYER, health: 0 })).toBe(true);
    expect(NeedsSystem.isDead(INITIAL_PLAYER)).toBe(false);
  });

  it('isTurned returns true when infection reaches 100', () => {
    expect(NeedsSystem.isTurned({ ...INITIAL_PLAYER, infection: 100 })).toBe(true);
    expect(NeedsSystem.isTurned(INITIAL_PLAYER)).toBe(false);
  });

  it('deathCause returns infection when infection >= 100', () => {
    expect(NeedsSystem.deathCause({ ...INITIAL_PLAYER, health: 0, infection: 100 })).toBe('infection');
  });

  it('deathCause returns dehydration when thirst is lower', () => {
    expect(NeedsSystem.deathCause({ ...INITIAL_PLAYER, health: 0, thirst: 0, hunger: 20 })).toBe('dehydration');
  });

  it('warnings fires when hunger crosses threshold', () => {
    const before = { ...INITIAL_PLAYER, hunger: 35 };
    const after  = { ...INITIAL_PLAYER, hunger: 25 };
    const msgs = NeedsSystem.warnings(before, after);
    expect(msgs.some(m => m.includes('Hambre'))).toBe(true);
  });

  it('no warnings when nothing crosses a threshold', () => {
    const msgs = NeedsSystem.warnings(INITIAL_PLAYER, INITIAL_PLAYER);
    expect(msgs.length).toBe(0);
  });
});
