import { FOV as RotFOV } from 'rot-js';
import type { ZoneMapState, CellVis } from './ZoneMap';

export class TacticalFOV {
  static compute(state: ZoneMapState, x: number, y: number, range = 8): ZoneMapState {
    const tiles = state.tiles.map(row =>
      row.map(tile => ({ ...tile, vis: (tile.vis === 'visible' ? 'seen' : tile.vis) as CellVis }))
    );

    const fov = new RotFOV.PreciseShadowcasting((fx, fy) => {
      if (fx < 0 || fy < 0 || fx >= state.width || fy >= state.height) return false;
      return state.tiles[fy][fx].transparent;
    });

    fov.compute(x, y, range, (fx, fy) => {
      if (tiles[fy]?.[fx]) tiles[fy][fx] = { ...tiles[fy][fx], vis: 'visible' };
    });

    return { ...state, tiles };
  }
}
