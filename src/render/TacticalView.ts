import { Application, Container, Graphics } from 'pixi.js';
import type { ZoneMapState, Tile } from '../engine/world/ZoneMap';
import type { ZombieState } from '../engine/entities/Zombie';

const T = 16;

const C = {
  floorVis:     0x1a2518,
  floorSeen:    0x0d110b,
  wallVis:      0x2e3c2c,
  wallSeen:     0x141a13,
  exitVis:      0x2a7040,
  exitSeen:     0x1a4025,
  contVis:      0x5a3a18,
  contSeen:     0x2a1e0e,
  contEmptyVis: 0x211a12,
  contEmptySeen:0x131008,
  player:       0x4a8fb5,
  playerHi:     0x8ac8e0,
};

export class TacticalView {
  private app: Application;
  private world = new Container();

  constructor(app: Application) {
    this.app = app;
    app.stage.addChild(this.world);
  }

  render(
    state: ZoneMapState & { zombies?: ZombieState[] },
    onTileClick: (x: number, y: number) => void,
  ) {
    this.world.removeChildren();
    const g = new Graphics();

    for (let y = 0; y < state.height; y++) {
      for (let x = 0; x < state.width; x++) {
        const color = this.tileColor(state.tiles[y][x]);
        if (color !== null) g.rect(x * T, y * T, T - 1, T - 1).fill(color);
      }
    }

    // Visible zombies
    for (const z of (state.zombies ?? [])) {
      const tile = state.tiles[z.y]?.[z.x];
      if (tile?.vis !== 'visible') continue;
      const zx = z.x * T + T / 2, zy = z.y * T + T / 2;
      g.circle(zx, zy, 5.5).fill(0xb82828);
      g.circle(zx, zy, 2.5).fill(0xe05050);
    }

    // Player dot with highlight
    const px = state.playerX * T + T / 2;
    const py = state.playerY * T + T / 2;
    g.circle(px, py, 6).fill(C.player);
    g.circle(px, py, 3).fill(C.playerHi);

    this.world.addChild(g);

    // Invisible hit layer for click/tap
    const hit = new Graphics();
    hit.rect(0, 0, state.width * T, state.height * T).fill({ color: 0, alpha: 0 });
    hit.eventMode = 'static';
    hit.cursor = 'crosshair';
    hit.on('pointerdown', (e) => {
      const pos = this.world.toLocal(e.global);
      onTileClick(Math.floor(pos.x / T), Math.floor(pos.y / T));
    });
    this.world.addChild(hit);

    this.centerOn(state.playerX, state.playerY, state.width, state.height);
  }

  private tileColor(tile: Tile): number | null {
    if (tile.vis === 'hidden') return null;
    const seen = tile.vis === 'seen';
    switch (tile.type) {
      case 'wall':            return seen ? C.wallSeen      : C.wallVis;
      case 'exit':            return seen ? C.exitSeen      : C.exitVis;
      case 'container':       return seen ? C.contSeen      : C.contVis;
      case 'container_empty': return seen ? C.contEmptySeen : C.contEmptyVis;
      default:                return seen ? C.floorSeen     : C.floorVis;
    }
  }

  private centerOn(px: number, py: number, mw: number, mh: number) {
    const sw = this.app.screen.width;
    const sh = this.app.screen.height;
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
