import { Map as RotMap, RNG as RotRNG } from 'rot-js';
import type { ZoneType } from './Zone';

export type TileType = 'floor' | 'wall' | 'container' | 'exit';
export type CellVis = 'hidden' | 'seen' | 'visible';

export interface Tile {
  type: TileType;
  walkable: boolean;
  transparent: boolean;
  vis: CellVis;
}

export interface ZoneMapState {
  zoneId: string;
  width: number;
  height: number;
  tiles: Tile[][];
  playerX: number;
  playerY: number;
}

function hashId(id: string): number {
  let h = 5381;
  for (let i = 0; i < id.length; i++) h = (h * 33 ^ id.charCodeAt(i)) >>> 0;
  return h;
}

const mkFloor = (): Tile => ({ type: 'floor', walkable: true, transparent: true, vis: 'hidden' });
const mkWall = (): Tile => ({ type: 'wall', walkable: false, transparent: false, vis: 'hidden' });

export class ZoneMap {
  static readonly W = 44;
  static readonly H = 32;

  static generate(zoneId: string, type: ZoneType, gameSeed: number): ZoneMapState {
    const W = ZoneMap.W;
    const H = ZoneMap.H;
    const mapSeed = (gameSeed * 1000003 + hashId(zoneId)) >>> 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const savedRng: any = RotRNG.getState();
    RotRNG.setSeed(mapSeed);

    const tiles: Tile[][] = Array.from({ length: H }, () => Array.from({ length: W }, mkWall));
    const isOutdoor = type === 'wild' || type === 'residential';

    let playerX = 1, playerY = 1, exitX = W - 2, exitY = H - 2;

    if (isOutdoor) {
      const map = new RotMap.Cellular(W, H);
      map.randomize(0.48);
      for (let i = 0; i < 3; i++) map.create();
      map.create((x, y, v) => { if (v === 0) tiles[y][x] = mkFloor(); });

      outer: for (let y = 1; y < H / 2; y++)
        for (let x = 1; x < W / 2; x++)
          if (tiles[y][x].walkable) { playerX = x; playerY = y; break outer; }

      outer2: for (let y = H - 2; y >= H / 2; y--)
        for (let x = W - 2; x >= W / 2; x--)
          if (tiles[y][x].walkable) { exitX = x; exitY = y; break outer2; }
    } else {
      const map = new RotMap.Digger(W, H, {
        roomWidth: [4, 9] as [number, number],
        roomHeight: [3, 6] as [number, number],
        dugPercentage: 0.35,
        corridorLength: [2, 6] as [number, number],
      });
      map.create((x, y, v) => { if (v === 0) tiles[y][x] = mkFloor(); });

      const rooms = map.getRooms();
      if (rooms.length > 0) {
        [playerX, playerY] = rooms[0].getCenter();
      } else {
        outer: for (let y = 1; y < H - 1; y++)
          for (let x = 1; x < W - 1; x++)
            if (tiles[y][x].walkable) { playerX = x; playerY = y; break outer; }
      }

      if (rooms.length > 1) {
        [exitX, exitY] = rooms[rooms.length - 1].getCenter();
      } else {
        outer2: for (let y = H - 2; y >= H / 2; y--)
          for (let x = W - 2; x >= W / 2; x--)
            if (tiles[y][x].walkable && (x !== playerX || y !== playerY)) {
              exitX = x; exitY = y; break outer2;
            }
      }

      // Scatter containers in middle rooms
      for (let i = 1; i < rooms.length - 1; i++) {
        if (RotRNG.getUniform() < 0.5) {
          const [cx, cy] = rooms[i].getCenter();
          if (tiles[cy][cx].walkable)
            tiles[cy][cx] = { type: 'container', walkable: true, transparent: true, vis: 'hidden' };
        }
      }
    }

    tiles[exitY][exitX] = { type: 'exit', walkable: true, transparent: true, vis: 'hidden' };
    RotRNG.setState(savedRng);

    return { zoneId, width: W, height: H, tiles, playerX, playerY };
  }

  static isWalkable(s: ZoneMapState, x: number, y: number): boolean {
    if (x < 0 || y < 0 || x >= s.width || y >= s.height) return false;
    return s.tiles[y][x].walkable;
  }

  static isTransparent(s: ZoneMapState, x: number, y: number): boolean {
    if (x < 0 || y < 0 || x >= s.width || y >= s.height) return false;
    return s.tiles[y][x].transparent;
  }

  static tile(s: ZoneMapState, x: number, y: number): Tile | null {
    if (x < 0 || y < 0 || x >= s.width || y >= s.height) return null;
    return s.tiles[y][x];
  }
}
