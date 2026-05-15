import { RNG as RotRNG } from 'rot-js';

export class RNG {
  private _seed: number;

  constructor(seed?: number) {
    this._seed = seed ?? Math.floor(Math.random() * 2_147_483_647);
    RotRNG.setSeed(this._seed);
  }

  int(min: number, max: number): number {
    return RotRNG.getUniformInt(min, max);
  }

  float(): number {
    return RotRNG.getUniform();
  }

  d20(): number {
    return this.int(1, 20);
  }

  d6(): number {
    return this.int(1, 6);
  }

  pick<T>(arr: readonly T[]): T {
    if (arr.length === 0) throw new Error('Cannot pick from empty array');
    return arr[this.int(0, arr.length - 1)];
  }

  chance(probability: number): boolean {
    return this.float() < probability;
  }

  getState(): number[] {
    return RotRNG.getState();
  }

  setState(state: number[]): void {
    RotRNG.setState(state);
  }

  getSeed(): number {
    return this._seed;
  }
}
