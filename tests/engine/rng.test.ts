import { describe, it, expect } from 'vitest';
import { RNG } from '../../src/engine/core/RNG';

describe('RNG', () => {
  it('same state produces same sequence', () => {
    const rng = new RNG(42);
    const state = rng.getState();

    const first = Array.from({ length: 10 }, () => rng.int(1, 100));
    rng.setState(state);
    const second = Array.from({ length: 10 }, () => rng.int(1, 100));

    expect(first).toEqual(second);
  });

  it('int returns values within [min, max]', () => {
    const rng = new RNG(123);
    for (let i = 0; i < 200; i++) {
      const val = rng.int(1, 20);
      expect(val).toBeGreaterThanOrEqual(1);
      expect(val).toBeLessThanOrEqual(20);
    }
  });

  it('d20 returns values between 1 and 20', () => {
    const rng = new RNG(456);
    for (let i = 0; i < 100; i++) {
      const val = rng.d20();
      expect(val).toBeGreaterThanOrEqual(1);
      expect(val).toBeLessThanOrEqual(20);
    }
  });

  it('float returns values in [0, 1)', () => {
    const rng = new RNG(789);
    for (let i = 0; i < 100; i++) {
      const val = rng.float();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });

  it('pick selects an element from the array', () => {
    const rng = new RNG(101);
    const arr = ['a', 'b', 'c', 'd'];
    for (let i = 0; i < 20; i++) {
      expect(arr).toContain(rng.pick(arr));
    }
  });

  it('pick throws on empty array', () => {
    const rng = new RNG(202);
    expect(() => rng.pick([])).toThrow();
  });

  it('getSeed returns the seed used to construct', () => {
    const rng = new RNG(999);
    expect(rng.getSeed()).toBe(999);
  });

  it('chance returns true with probability 1 and false with 0', () => {
    const rng = new RNG(303);
    expect(rng.chance(1)).toBe(true);
    expect(rng.chance(0)).toBe(false);
  });
});
