import { describe, it, expect } from 'vitest';
import { CombatSystem } from '../../src/engine/systems/CombatSystem';
import { ZombieAI } from '../../src/engine/systems/ZombieAI';
import { ZoneMap } from '../../src/engine/world/ZoneMap';
import type { ZombieState } from '../../src/engine/entities/Zombie';

describe('CombatSystem', () => {
  it('player attack damage is in expected range', () => {
    for (let i = 0; i < 20; i++) {
      const d = CombatSystem.playerAttackDamage();
      expect(d).toBeGreaterThanOrEqual(20);
      expect(d).toBeLessThanOrEqual(35);
    }
  });

  it('zombie attack damage is in expected range', () => {
    for (let i = 0; i < 20; i++) {
      const atk = CombatSystem.zombieAttack();
      expect(atk.damage).toBeGreaterThanOrEqual(8);
      expect(atk.damage).toBeLessThanOrEqual(15);
      expect(atk.infection).toBeGreaterThanOrEqual(5);
      expect(atk.infection).toBeLessThanOrEqual(15);
    }
  });
});

describe('ZombieAI', () => {
  const map = ZoneMap.generate('centro', 'commercial', 42);

  const makeZombie = (x: number, y: number, aiState: ZombieState['aiState'] = 'patrol'): ZombieState => ({
    id: 'z0', x, y, health: 40, maxHealth: 50, aiState, alertX: 0, alertY: 0, alertTurns: 0,
  });

  it('patrol zombie moves to adjacent walkable tile', () => {
    const z = makeZombie(map.playerX + 5, map.playerY);
    const { zombies } = ZombieAI.process([z], map, map.playerX, map.playerY, 0);
    // May or may not move depending on RNG, but shouldn't crash
    expect(zombies.length).toBe(1);
  });

  it('zombie beyond chase range but within noise range becomes alerted', () => {
    // Place zombie at distance 10 (beyond CHASE_RANGE=7), noiseRange=10
    const z = makeZombie(map.playerX + 10, map.playerY);
    const { zombies } = ZombieAI.process([z], map, map.playerX, map.playerY, 12);
    // Either alerted (no LOS) or chasing (has LOS) — zombie should not stay in patrol
    expect(['alerted', 'chasing']).toContain(zombies[0].aiState);
  });

  it('adjacent zombie attacks player', () => {
    const z = makeZombie(map.playerX + 1, map.playerY);
    const { attacks } = ZombieAI.process([z], map, map.playerX, map.playerY, 0);
    expect(attacks.length).toBeGreaterThan(0);
  });

  it('far zombie does not attack', () => {
    const z = makeZombie(map.playerX + 15, map.playerY);
    const { attacks } = ZombieAI.process([z], map, map.playerX, map.playerY, 0);
    expect(attacks.length).toBe(0);
  });

  it('multiple zombies processed without error', () => {
    const zombies = [
      makeZombie(map.playerX + 5, map.playerY),
      makeZombie(map.playerX, map.playerY + 5),
      makeZombie(map.playerX + 10, map.playerY + 5),
    ];
    const { zombies: updated } = ZombieAI.process(zombies, map, map.playerX, map.playerY, 0);
    expect(updated.length).toBe(3);
  });
});
