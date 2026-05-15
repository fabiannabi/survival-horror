import { Path as RotPath, RNG as RotRNG } from 'rot-js';
import { ZoneMap } from '../world/ZoneMap';
import { CombatSystem } from './CombatSystem';
import type { ZoneMapState } from '../world/ZoneMap';
import type { ZombieState } from '../entities/Zombie';
import type { ZombieAttack } from './CombatSystem';

const CHASE_RANGE = 7;

export interface ZombieAIOutput {
  zombies: ZombieState[];
  attacks: ZombieAttack[];
}

export class ZombieAI {
  static process(
    zombies: ZombieState[],
    mapState: ZoneMapState,
    playerX: number,
    playerY: number,
    noiseRange: number,
  ): ZombieAIOutput {
    const updated = zombies.map(z => ({ ...z }));
    const attacks: ZombieAttack[] = [];

    for (let i = 0; i < updated.length; i++) {
      const z = updated[i];
      const others = updated.filter((_, j) => j !== i);

      const dist = chebyshev(z.x, z.y, playerX, playerY);
      const canSee = dist <= CHASE_RANGE && ZombieAI.hasLOS(mapState, z.x, z.y, playerX, playerY);

      if (canSee) {
        z.aiState = 'chasing';
      } else if (dist <= noiseRange && z.aiState === 'patrol') {
        z.aiState = 'alerted';
        z.alertX = playerX;
        z.alertY = playerY;
        z.alertTurns = 8;
      } else if (z.aiState === 'alerted') {
        z.alertTurns--;
        if (z.alertTurns <= 0) z.aiState = 'patrol';
      }

      const passable = (x: number, y: number) =>
        ZoneMap.isWalkable(mapState, x, y) &&
        !others.some(o => o.x === x && o.y === y);

      const step = ZombieAI.nextStep(z, passable, playerX, playerY);
      // Never occupy the player's tile — attack from adjacent instead
      if (step && !(step[0] === playerX && step[1] === playerY)) {
        z.x = step[0]; z.y = step[1];
      }

      if (chebyshev(z.x, z.y, playerX, playerY) <= 1) {
        attacks.push(CombatSystem.zombieAttack());
      }

      updated[i] = z;
    }

    return { zombies: updated, attacks };
  }

  private static nextStep(
    z: ZombieState,
    passable: (x: number, y: number) => boolean,
    px: number,
    py: number,
  ): [number, number] | null {
    if (z.aiState === 'chasing') {
      return ZombieAI.astarStep(z.x, z.y, px, py, passable);
    }
    if (z.aiState === 'alerted') {
      return ZombieAI.astarStep(z.x, z.y, z.alertX, z.alertY, passable);
    }
    // patrol: random adjacent walkable tile
    const dirs: [number, number][] = [[0,-1],[0,1],[-1,0],[1,0]];
    dirs.sort(() => RotRNG.getUniform() - 0.5);
    for (const [dx, dy] of dirs) {
      const nx = z.x + dx, ny = z.y + dy;
      if (passable(nx, ny)) return [nx, ny];
    }
    return null;
  }

  private static astarStep(
    x0: number, y0: number,
    tx: number, ty: number,
    passable: (x: number, y: number) => boolean,
  ): [number, number] | null {
    const path: [number, number][] = [];
    const astar = new RotPath.AStar(tx, ty, passable);
    astar.compute(x0, y0, (x, y) => path.push([x, y]));
    return path.length >= 2 ? path[1] : null;
  }

  private static hasLOS(
    state: ZoneMapState,
    x0: number, y0: number,
    x1: number, y1: number,
  ): boolean {
    const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx - dy, x = x0, y = y0;
    while (x !== x1 || y !== y1) {
      if (!ZoneMap.isTransparent(state, x, y)) return false;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x += sx; }
      if (e2 < dx)  { err += dx; y += sy; }
    }
    return true;
  }
}

function chebyshev(x0: number, y0: number, x1: number, y1: number): number {
  return Math.max(Math.abs(x0 - x1), Math.abs(y0 - y1));
}
