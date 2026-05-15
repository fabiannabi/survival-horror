import { Application, Container, Graphics, Sprite, Assets, Texture } from 'pixi.js';
import type { ZoneMapState, Tile } from '../engine/world/ZoneMap';
import type { ZombieState } from '../engine/entities/Zombie';

// Sprite asset imports (Vite resolves these to hashed URLs)
import urlGround1 from '../assets/sprites/ground_1.png';
import urlGround2 from '../assets/sprites/ground_2.png';
import urlGround3 from '../assets/sprites/ground_3.png';
import urlGround4 from '../assets/sprites/ground_4.png';
import urlPath    from '../assets/sprites/path.png';
import urlPath2   from '../assets/sprites/path_2.png';
import urlFloor   from '../assets/sprites/floor.png';
import urlFloor2  from '../assets/sprites/floor_2.png';
import urlWallExt  from '../assets/sprites/wall_ext.png';
import urlWallExt2 from '../assets/sprites/wall_ext_2.png';
import urlWindow  from '../assets/sprites/window.png';
import urlDoor    from '../assets/sprites/door.png';
import urlDoor2   from '../assets/sprites/door_2.png';
import urlContainer      from '../assets/sprites/container.png';
import urlContainerEmpty from '../assets/sprites/container_empty.png';

const T = 16;

// Fallback colors for unseen/un-sprited tiles
const C = {
  groundSeen:       0x0f150c,
  wallExtVis:       0x3a3028,
  wallExtSeen:      0x1a1510,
  windowVis:        0x284858,
  windowSeen:       0x142028,
  rubbleVis:        0x2e2820,
  rubbleSeen:       0x161210,
  wallVis:          0x2e3c2c,
  wallSeen:         0x141a13,
  exitVis:          0x1a7040,
  exitSeen:         0x0e3a22,
  contEmptyVis:     0x211a12,
  contEmptySeen:    0x131008,
  player:           0x4a8fb5,
  playerHi:         0x8ac8e0,
  zombie:           0xb82828,
  zombieHi:         0xe05050,
  reachable:        0x2a4a2a,
  reachAlpha:       0.35,
};

// Tint applied to sprites in "seen" (not currently visible) state
const TINT_SEEN    = 0x404030;
const TINT_VISIBLE = 0xffffff;

const SPRITE_ASSETS = [
  ['ground_1', urlGround1], ['ground_2', urlGround2],
  ['ground_3', urlGround3], ['ground_4', urlGround4],
  ['path',     urlPath],    ['path_2',   urlPath2],
  ['floor',    urlFloor],   ['floor_2',  urlFloor2],
  ['wall_ext', urlWallExt], ['wall_ext_2', urlWallExt2],
  ['window',   urlWindow],
  ['door',     urlDoor],    ['door_2',   urlDoor2],
  ['container',       urlContainer],
  ['container_empty', urlContainerEmpty],
] as const;

export class TacticalView {
  private app: Application;
  private world       = new Container();
  private tileLayer   = new Container(); // sprite tiles (ground, floor, wall_ext)
  private detailLayer = new Container(); // overlay sprites (doors, containers)
  private gfxLayer    = new Graphics();  // color rects for walls/exit/rubble
  private reachLayer  = new Graphics();  // AP reachable overlay
  private actorLayer  = new Graphics();  // zombies + player
  private hitLayer    = new Graphics();  // invisible click catcher

  private textures    = new Map<string, Texture>();
  private loaded      = false;

  constructor(app: Application) {
    this.app = app;
    app.stage.addChild(this.world);
    this.world.addChild(this.tileLayer);
    this.world.addChild(this.gfxLayer);
    this.world.addChild(this.detailLayer);
    this.world.addChild(this.reachLayer);
    this.world.addChild(this.actorLayer);
    this.world.addChild(this.hitLayer);
  }

  // Call once after construction, before first render
  async preload(): Promise<void> {
    if (this.loaded) return;
    await Assets.load(SPRITE_ASSETS.map(([alias, src]) => ({ alias, src })));
    for (const [alias] of SPRITE_ASSETS) {
      try { this.textures.set(alias, Assets.get(alias)); } catch { /* skip */ }
    }
    this.loaded = true;
  }

  render(
    state: ZoneMapState & { zombies?: ZombieState[]; ap?: number },
    onTileClick: (x: number, y: number) => void,
  ) {
    this.tileLayer.removeChildren();
    this.detailLayer.removeChildren();
    this.gfxLayer.clear();
    this.reachLayer.clear();
    this.actorLayer.clear();
    this.hitLayer.clear();

    for (let y = 0; y < state.height; y++) {
      for (let x = 0; x < state.width; x++) {
        const tile = state.tiles[y][x];
        if (tile.vis === 'hidden') continue;
        this.drawTile(tile, x, y);
      }
    }

    // Reachable AP overlay
    const ap = state.ap ?? 0;
    if (ap > 0) {
      for (const [rx, ry] of this.bfsReachable(state, state.playerX, state.playerY, ap)) {
        if (state.tiles[ry][rx].vis !== 'hidden')
          this.reachLayer.rect(rx * T, ry * T, T - 1, T - 1)
            .fill({ color: C.reachable, alpha: C.reachAlpha });
      }
    }

    // Zombies
    for (const z of (state.zombies ?? [])) {
      if (state.tiles[z.y]?.[z.x]?.vis !== 'visible') continue;
      const zx = z.x * T + T / 2, zy = z.y * T + T / 2;
      this.actorLayer.circle(zx, zy, 5.5).fill(C.zombie);
      this.actorLayer.circle(zx, zy, 2.5).fill(C.zombieHi);
    }

    // Player
    const px = state.playerX * T + T / 2, py = state.playerY * T + T / 2;
    this.actorLayer.circle(px, py, 6).fill(C.player);
    this.actorLayer.circle(px, py, 3).fill(C.playerHi);

    // Click hit area
    this.hitLayer.rect(0, 0, state.width * T, state.height * T).fill({ color: 0, alpha: 0 });
    this.hitLayer.eventMode = 'static';
    this.hitLayer.cursor = 'crosshair';
    this.hitLayer.on('pointerdown', (e) => {
      const pos = this.world.toLocal(e.global);
      onTileClick(Math.floor(pos.x / T), Math.floor(pos.y / T));
    });

    this.centerOn(state.playerX, state.playerY, state.width, state.height);
  }

  private drawTile(tile: Tile, x: number, y: number) {
    const seen = tile.vis === 'seen';
    const tint = seen ? TINT_SEEN : TINT_VISIBLE;

    switch (tile.type) {
      case 'ground': {
        const key = 'ground_' + (((x * 7 + y * 13) % 4) + 1);
        this.addSprite(key, x, y, T, T, tint);
        break;
      }
      case 'floor': {
        const key = (x + y) % 3 === 0 ? 'floor_2' : 'floor';
        this.addSprite(key, x, y, T, T, tint);
        break;
      }
      case 'wall_ext': {
        const key = (x ^ y) % 3 === 0 ? 'wall_ext_2' : 'wall_ext';
        this.addSprite(key, x, y, T, T, tint);
        break;
      }
      case 'wall': {
        this.gfxLayer.rect(x * T, y * T, T - 1, T - 1)
          .fill(seen ? C.wallSeen : C.wallVis);
        break;
      }
      case 'window': {
        this.addSprite('window', x, y, T, T, tint);
        break;
      }
      case 'door': {
        // Floor base + door sprite centered
        this.addSprite('floor', x, y, T, T, tint);
        this.addOverlaySprite('door', x, y, tint);
        break;
      }
      case 'rubble': {
        // Ground base + path texture for texture, slightly different tint
        const key = (x + y * 3) % 2 === 0 ? 'path' : 'path_2';
        this.addSprite(key, x, y, T, T, tint);
        break;
      }
      case 'container': {
        this.addSprite('floor', x, y, T, T, tint);
        this.addOverlaySprite('container', x, y, tint);
        break;
      }
      case 'container_empty': {
        this.addSprite('floor', x, y, T, T, tint);
        this.addOverlaySprite('container_empty', x, y, tint);
        break;
      }
      case 'exit': {
        this.gfxLayer.rect(x * T, y * T, T - 1, T - 1)
          .fill(seen ? C.exitSeen : C.exitVis);
        break;
      }
      default: {
        // Generic floor fallback
        this.addSprite('floor', x, y, T, T, tint);
      }
    }
  }

  // Full-tile sprite (scaled to T×T)
  private addSprite(key: string, x: number, y: number, w: number, h: number, tint: number) {
    const tex = this.textures.get(key);
    if (!tex) {
      // Fallback: color rect from gfxLayer
      this.gfxLayer.rect(x * T, y * T, T - 1, T - 1).fill(0x222222);
      return;
    }
    const s = new Sprite(tex);
    s.x = x * T;
    s.y = y * T;
    s.width  = w;
    s.height = h;
    s.tint   = tint;
    this.tileLayer.addChild(s);
  }

  // Centered overlay sprite (natural size, not scaled)
  private addOverlaySprite(key: string, x: number, y: number, tint: number) {
    const tex = this.textures.get(key);
    if (!tex) return;
    const s = new Sprite(tex);
    s.anchor.set(0.5);
    s.x = x * T + T / 2;
    s.y = y * T + T / 2;
    s.tint = tint;
    this.detailLayer.addChild(s);
  }

  private bfsReachable(
    state: ZoneMapState & { zombies?: ZombieState[] },
    sx: number, sy: number, ap: number,
  ): [number, number][] {
    const zombieSet = new Set((state.zombies ?? []).map(z => `${z.x},${z.y}`));
    const visited   = new Map<string, number>();
    const queue: [number, number, number][] = [[sx, sy, 0]];
    const result: [number, number][] = [];
    const dirs: [number, number][] = [[0,-1],[0,1],[-1,0],[1,0]];
    while (queue.length) {
      const [x, y, cost] = queue.shift()!;
      for (const [dx, dy] of dirs) {
        const nx = x + dx, ny = y + dy;
        const key = `${nx},${ny}`;
        const nc  = cost + 1;
        if (nc > ap || visited.has(key)) continue;
        if (!state.tiles[ny]?.[nx]?.walkable || zombieSet.has(key)) continue;
        visited.set(key, nc);
        result.push([nx, ny]);
        queue.push([nx, ny, nc]);
      }
    }
    return result;
  }

  private centerOn(px: number, py: number, mw: number, mh: number) {
    const sw = this.app.screen.width, sh = this.app.screen.height;
    const pw = mw * T, ph = mh * T;
    let tx = sw / 2 - px * T - T / 2;
    let ty = sh / 2 - py * T - T / 2;
    tx = pw > sw ? Math.min(0, Math.max(sw - pw, tx)) : (sw - pw) / 2;
    ty = ph > sh ? Math.min(0, Math.max(sh - ph, ty)) : (sh - ph) / 2;
    this.world.x = tx;
    this.world.y = ty;
  }

  destroy() { this.world.destroy({ children: true }); }
}
