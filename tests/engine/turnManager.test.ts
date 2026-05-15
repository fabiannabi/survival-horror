import { describe, it, expect, vi } from 'vitest';
import { TurnManager } from '../../src/engine/core/TurnManager';
import { EventBus } from '../../src/engine/core/EventBus';

function makeTM(startTime = 0) {
  return new TurnManager(new EventBus(), startTime);
}

describe('TurnManager', () => {
  it('starts at the given initial time', () => {
    const tm = makeTM(480);
    expect(tm.currentTime).toBe(480);
  });

  it('returns null when queue is empty', () => {
    const tm = makeTM();
    expect(tm.next()).toBeNull();
  });

  it('returns actions in chronological order', () => {
    const tm = makeTM(0);
    tm.schedule('player', 5);
    tm.schedule('zombie1', 2);
    tm.schedule('zombie2', 8);

    expect(tm.next()?.entityId).toBe('zombie1');
    expect(tm.next()?.entityId).toBe('player');
    expect(tm.next()?.entityId).toBe('zombie2');
  });

  it('advance increases currentTime', () => {
    const tm = makeTM(0);
    tm.advance(30);
    expect(tm.currentTime).toBe(30);
    tm.advance(45);
    expect(tm.currentTime).toBe(75);
  });

  it('next() moves currentTime to the action time', () => {
    const tm = makeTM(0);
    tm.schedule('player', 10);
    tm.next();
    expect(tm.currentTime).toBe(10);
  });

  it('emits turn:advanced on advance()', () => {
    const bus = new EventBus();
    const tm = new TurnManager(bus, 0);
    const handler = vi.fn();
    bus.on('turn:advanced', handler);

    tm.advance(60);

    expect(handler).toHaveBeenCalledWith(60);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('emits turn:advanced on next()', () => {
    const bus = new EventBus();
    const tm = new TurnManager(bus, 0);
    const handler = vi.fn();
    bus.on('turn:advanced', handler);

    tm.schedule('player', 15);
    tm.next();

    expect(handler).toHaveBeenCalledWith(15);
  });

  it('clamps negative delays to 0', () => {
    const tm = makeTM(100);
    tm.schedule('player', -10);
    const action = tm.next();
    expect(action?.time).toBe(100);
  });

  it('peek does not remove from queue', () => {
    const tm = makeTM(0);
    tm.schedule('player', 5);
    expect(tm.peek()?.entityId).toBe('player');
    expect(tm.peek()?.entityId).toBe('player');
    expect(tm.getQueue().length).toBe(1);
  });
});
