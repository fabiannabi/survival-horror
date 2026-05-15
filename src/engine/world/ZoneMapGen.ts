import { RNG as RotRNG } from 'rot-js';
import type { ZoneType } from './Zone';
import type { ZoneMapState, Tile } from './ZoneMap';

export const W = 54;
export const H = 38;

type TileGrid = Tile[][];

const mkGround  = (): Tile => ({ type: 'ground',   walkable: true,  transparent: true,  vis: 'hidden' });
const mkWallExt = (): Tile => ({ type: 'wall_ext', walkable: false, transparent: false, vis: 'hidden' });
const mkFloor   = (): Tile => ({ type: 'floor',    walkable: true,  transparent: true,  vis: 'hidden' });
const mkWall    = (): Tile => ({ type: 'wall',     walkable: false, transparent: false, vis: 'hidden' });
const mkDoor    = (): Tile => ({ type: 'door',     walkable: true,  transparent: true,  vis: 'hidden' });
const mkWindow  = (): Tile => ({ type: 'window',   walkable: false, transparent: true,  vis: 'hidden' });
const mkRubble  = (): Tile => ({ type: 'rubble',   walkable: true,  transparent: true,  vis: 'hidden' });
const mkContainer = (): Tile => ({ type: 'container', walkable: false, transparent: true, vis: 'hidden' });
const mkExit    = (): Tile => ({ type: 'exit',     walkable: true,  transparent: true,  vis: 'hidden' });

// ─── Building placement helpers ────────────────────────────────────────────

interface Building {
  x: number; y: number; w: number; h: number;
  withDoor?: boolean;
  containerCount?: number;
}

function placeBuilding(grid: TileGrid, b: Building): [number, number][] {
  const { x, y, w, h } = b;
  const containers: [number, number][] = [];

  // Outer walls
  for (let cy = y; cy < y + h; cy++) {
    for (let cx = x; cx < x + w; cx++) {
      if (cy === y || cy === y + h - 1 || cx === x || cx === x + w - 1) {
        grid[cy][cx] = mkWallExt();
      } else {
        grid[cy][cx] = mkFloor();
      }
    }
  }

  // Windows on sides (not corners)
  if (w > 4) {
    for (let cx = x + 2; cx < x + w - 2; cx += 3) {
      if (RotRNG.getUniform() < 0.6) grid[y][cx] = mkWindow();
      if (RotRNG.getUniform() < 0.6) grid[y + h - 1][cx] = mkWindow();
    }
  }
  if (h > 4) {
    for (let cy = y + 2; cy < y + h - 2; cy += 3) {
      if (RotRNG.getUniform() < 0.6) grid[cy][x] = mkWindow();
      if (RotRNG.getUniform() < 0.6) grid[cy][x + w - 1] = mkWindow();
    }
  }

  // Door on south wall (toward player entry)
  const doorX = x + 1 + Math.floor(RotRNG.getUniform() * (w - 2));
  grid[y + h - 1][doorX] = mkDoor();

  // Interior containers
  const count = b.containerCount ?? (RotRNG.getUniform() < 0.5 ? 1 : 0);
  for (let i = 0; i < count; i++) {
    for (let attempt = 0; attempt < 20; attempt++) {
      const cx = x + 1 + Math.floor(RotRNG.getUniform() * (w - 2));
      const cy = y + 1 + Math.floor(RotRNG.getUniform() * (h - 2));
      if (grid[cy][cx].type === 'floor') {
        grid[cy][cx] = mkContainer();
        containers.push([cx, cy]);
        break;
      }
    }
  }

  // Random rubble inside
  if (RotRNG.getUniform() < 0.4) {
    for (let attempt = 0; attempt < 10; attempt++) {
      const cx = x + 1 + Math.floor(RotRNG.getUniform() * (w - 2));
      const cy = y + 1 + Math.floor(RotRNG.getUniform() * (h - 2));
      if (grid[cy][cx].type === 'floor') { grid[cy][cx] = mkRubble(); break; }
    }
  }

  return containers;
}

// ─── Exterior rubble / obstacles scattered in open ground ──────────────────

function scatterDebris(grid: TileGrid, count: number) {
  for (let i = 0; i < count; i++) {
    for (let attempt = 0; attempt < 30; attempt++) {
      const x = 1 + Math.floor(RotRNG.getUniform() * (W - 2));
      const y = 1 + Math.floor(RotRNG.getUniform() * (H - 2));
      if (grid[y][x].type === 'ground') {
        grid[y][x] = RotRNG.getUniform() < 0.3 ? mkRubble() : mkWallExt();
        break;
      }
    }
  }
}

// ─── Zone-specific generators ───────────────────────────────────────────────

function genResidential(grid: TileGrid): [number, number][] {
  const containers: [number, number][] = [];
  // 3–4 small houses arranged in rows
  const houses: Building[] = [
    { x: 3,  y: 4, w: 9,  h: 7,  containerCount: 1 },
    { x: 15, y: 4, w: 8,  h: 7,  containerCount: 1 },
    { x: 27, y: 4, w: 9,  h: 7,  containerCount: 1 },
    { x: 39, y: 4, w: 12, h: 7,  containerCount: 2 },
    { x: 6,  y: 17, w: 11, h: 8, containerCount: 1 },
    { x: 22, y: 17, w: 8,  h: 8, containerCount: 1 },
  ];
  for (const h of houses) containers.push(...placeBuilding(grid, h));
  scatterDebris(grid, 8);
  return containers;
}

function genCommercial(grid: TileGrid): [number, number][] {
  const containers: [number, number][] = [];
  // 1 large store + 2 smaller shops
  const buildings: Building[] = [
    { x: 4,  y: 3, w: 20, h: 12, containerCount: 4 },
    { x: 28, y: 3, w: 10, h: 8,  containerCount: 2 },
    { x: 28, y: 14, w: 14, h: 9, containerCount: 3 },
    { x: 6,  y: 20, w: 16, h: 8, containerCount: 2 },
  ];
  for (const b of buildings) containers.push(...placeBuilding(grid, b));
  scatterDebris(grid, 5);
  return containers;
}

function genIndustrial(grid: TileGrid): [number, number][] {
  const containers: [number, number][] = [];
  // 1 big warehouse + 2 side buildings
  const buildings: Building[] = [
    { x: 3,  y: 3, w: 26, h: 16, containerCount: 5 },
    { x: 33, y: 3, w: 18, h: 10, containerCount: 3 },
    { x: 33, y: 17, w: 12, h: 9, containerCount: 2 },
    { x: 4,  y: 23, w: 20, h: 8, containerCount: 3 },
  ];
  for (const b of buildings) containers.push(...placeBuilding(grid, b));
  scatterDebris(grid, 14);
  return containers;
}

function genMedical(grid: TileGrid): [number, number][] {
  const containers: [number, number][] = [];
  // 1 hospital (big L-shape via two rects) + pharmacy
  const buildings: Building[] = [
    { x: 3,  y: 3, w: 30, h: 14, containerCount: 4 },
    { x: 3,  y: 19, w: 14, h: 9, containerCount: 3 },
    { x: 38, y: 3, w: 13, h: 10, containerCount: 3 },
    { x: 35, y: 17, w: 16, h: 10, containerCount: 2 },
  ];
  for (const b of buildings) containers.push(...placeBuilding(grid, b));
  scatterDebris(grid, 4);
  return containers;
}

function genMilitary(grid: TileGrid): [number, number][] {
  const containers: [number, number][] = [];
  // Bunker complex: 1 main bunker + perimeter wall segments
  const buildings: Building[] = [
    { x: 8,  y: 5, w: 22, h: 14, containerCount: 5 },
    { x: 34, y: 5, w: 10, h: 8,  containerCount: 2 },
    { x: 4,  y: 22, w: 14, h: 8, containerCount: 2 },
    { x: 24, y: 22, w: 20, h: 8, containerCount: 3 },
  ];
  for (const b of buildings) containers.push(...placeBuilding(grid, b));

  // Perimeter fence segments (horizontal wall_ext strips)
  for (let x = 1; x < W - 1; x++) {
    if (grid[2][x].type === 'ground') grid[2][x] = mkWallExt();
  }
  for (let x = 1; x < W - 1; x++) {
    if (grid[H - 5][x].type === 'ground' && RotRNG.getUniform() < 0.7) grid[H - 5][x] = mkWallExt();
  }
  // Gate in south fence
  const gateX = Math.floor(W / 2);
  for (let dx = -2; dx <= 2; dx++) grid[H - 5][gateX + dx] = mkGround();

  scatterDebris(grid, 6);
  return containers;
}

function genWild(grid: TileGrid): [number, number][] {
  const containers: [number, number][] = [];
  // Just a small shack, lots of rubble / obstacles
  const buildings: Building[] = [
    { x: 6, y: 5, w: 10, h: 7, containerCount: 2 },
    { x: 36, y: 8, w: 8,  h: 6, containerCount: 1 },
  ];
  for (const b of buildings) containers.push(...placeBuilding(grid, b));
  scatterDebris(grid, 22);

  // Scattered rubble patches
  for (let i = 0; i < 15; i++) {
    const bx = 2 + Math.floor(RotRNG.getUniform() * (W - 4));
    const by = 5 + Math.floor(RotRNG.getUniform() * (H - 10));
    for (let dy = 0; dy < 2; dy++) {
      for (let dx = 0; dx < 2; dx++) {
        if (grid[by + dy]?.[bx + dx]?.type === 'ground' && RotRNG.getUniform() < 0.5)
          grid[by + dy][bx + dx] = mkRubble();
      }
    }
  }
  return containers;
}

// ─── Main generator ─────────────────────────────────────────────────────────

export function generateZoneMap(
  zoneId: string,
  type: ZoneType,
  gameSeed: number,
): ZoneMapState & { containerPositions: [number, number][] } {
  function hashId(id: string): number {
    let h = 5381;
    for (let i = 0; i < id.length; i++) h = (h * 33 ^ id.charCodeAt(i)) >>> 0;
    return h;
  }

  const mapSeed = (gameSeed * 1000003 + hashId(zoneId)) >>> 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const savedRng: any = RotRNG.getState();
  RotRNG.setSeed(mapSeed);

  // Start with full ground exterior
  const tiles: Tile[][] = Array.from({ length: H }, () =>
    Array.from({ length: W }, mkGround),
  );

  // Border wall
  for (let x = 0; x < W; x++) { tiles[0][x] = mkWallExt(); tiles[H - 1][x] = mkWallExt(); }
  for (let y = 0; y < H; y++) { tiles[y][0] = mkWallExt(); tiles[y][W - 1] = mkWallExt(); }

  let containerPositions: [number, number][] = [];
  switch (type) {
    case 'residential': containerPositions = genResidential(tiles); break;
    case 'commercial':  containerPositions = genCommercial(tiles);  break;
    case 'industrial':  containerPositions = genIndustrial(tiles);  break;
    case 'medical':     containerPositions = genMedical(tiles);     break;
    case 'military':    containerPositions = genMilitary(tiles);    break;
    case 'wild':        containerPositions = genWild(tiles);        break;
  }

  // Exit at top-center
  const exitX = Math.floor(W / 2);
  const exitY = 1;
  tiles[exitY][exitX] = mkExit();

  // Player entry at bottom-center (find first walkable near bottom)
  let playerX = Math.floor(W / 2);
  let playerY = H - 3;
  outer: for (let dy = 0; dy < 5; dy++) {
    for (let dx = 0; dx <= 3; dx++) {
      for (const sx of [0, dx, -dx]) {
        const cx = playerX + sx, cy = playerY - dy;
        if (cy > 0 && cx > 0 && cx < W - 1 && tiles[cy][cx].walkable) {
          playerX = cx; playerY = cy; break outer;
        }
      }
    }
  }

  RotRNG.setState(savedRng);
  return { zoneId, width: W, height: H, tiles, playerX, playerY, containerPositions };
}
