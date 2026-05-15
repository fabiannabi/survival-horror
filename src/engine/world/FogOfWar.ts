import { FOG_ORDER, type FogLevel } from './Zone';

export class FogOfWar {
  static upgrade(current: FogLevel, target: FogLevel): FogLevel {
    return FOG_ORDER.indexOf(target) > FOG_ORDER.indexOf(current) ? target : current;
  }

  static isVisible(fog: FogLevel): boolean {
    return fog !== 'unknown';
  }

  static alpha(fog: FogLevel): number {
    const alphas: Record<FogLevel, number> = {
      unknown: 0,
      rumored: 0.3,
      scouted: 0.65,
      explored: 1,
    };
    return alphas[fog];
  }
}
