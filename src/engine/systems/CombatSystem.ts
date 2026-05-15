import { RNG as RotRNG } from 'rot-js';

export interface ZombieAttack {
  damage: number;
  infection: number;
}

export class CombatSystem {
  static playerAttackDamage(): number {
    return 20 + Math.floor(RotRNG.getUniform() * 16); // 20–35
  }

  static zombieAttack(): ZombieAttack {
    return {
      damage:    8 + Math.floor(RotRNG.getUniform() * 8),   // 8–15
      infection: 5 + Math.floor(RotRNG.getUniform() * 11),  // 5–15
    };
  }
}
