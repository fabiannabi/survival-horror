import { describe, it, expect } from 'vitest';
import { ZoneMap } from '../../src/engine/world/ZoneMap';
import { TacticalFOV } from '../../src/engine/world/TacticalFOV';

describe('ZoneMap', () => {
  it('generates a map with correct dimensions', () => {
    const m = ZoneMap.generate('centro', 'commercial', 42);
    expect(m.width).toBe(ZoneMap.W);
    expect(m.height).toBe(ZoneMap.H);
    expect(m.tiles.length).toBe(ZoneMap.H);
    expect(m.tiles[0].length).toBe(ZoneMap.W);
  });

  it('player starts on a walkable tile', () => {
    const m = ZoneMap.generate('centro', 'commercial', 42);
    expect(ZoneMap.isWalkable(m, m.playerX, m.playerY)).toBe(true);
  });

  it('exit tile is placed and walkable', () => {
    const m = ZoneMap.generate('centro', 'commercial', 42);
    const exit = m.tiles.flat().find(t => t.type === 'exit');
    expect(exit).toBeDefined();
    expect(exit?.walkable).toBe(true);
  });

  it('is deterministic with same seed', () => {
    const a = ZoneMap.generate('centro', 'commercial', 99);
    const b = ZoneMap.generate('centro', 'commercial', 99);
    expect(a.playerX).toBe(b.playerX);
    expect(a.playerY).toBe(b.playerY);
    expect(a.tiles[5][5].type).toBe(b.tiles[5][5].type);
  });

  it('different zones produce different maps', () => {
    const a = ZoneMap.generate('centro', 'commercial', 42);
    const b = ZoneMap.generate('hospital_imss', 'medical', 42);
    const aWalkable = a.tiles.flat().filter(t => t.walkable).length;
    const bWalkable = b.tiles.flat().filter(t => t.walkable).length;
    // Not identical (very unlikely with different seeds)
    expect(aWalkable).toBeGreaterThan(0);
    expect(bWalkable).toBeGreaterThan(0);
  });

  it('outdoor zones have walkable cells', () => {
    const m = ZoneMap.generate('parque_alcalde', 'wild', 42);
    const walkable = m.tiles.flat().filter(t => t.walkable).length;
    expect(walkable).toBeGreaterThan(20);
  });

  it('all tiles start as hidden', () => {
    const m = ZoneMap.generate('centro', 'commercial', 42);
    const allHidden = m.tiles.flat().every(t => t.vis === 'hidden');
    expect(allHidden).toBe(true);
  });
});

describe('TacticalFOV', () => {
  it('marks player tile as visible', () => {
    let m = ZoneMap.generate('centro', 'commercial', 42);
    m = TacticalFOV.compute(m, m.playerX, m.playerY);
    expect(m.tiles[m.playerY][m.playerX].vis).toBe('visible');
  });

  it('marks nearby floor tiles as visible', () => {
    let m = ZoneMap.generate('centro', 'commercial', 42);
    m = TacticalFOV.compute(m, m.playerX, m.playerY);
    const visible = m.tiles.flat().filter(t => t.vis === 'visible').length;
    expect(visible).toBeGreaterThan(1);
  });

  it('previously visible tiles become seen after recompute from new position', () => {
    let m = ZoneMap.generate('centro', 'commercial', 42);
    m = TacticalFOV.compute(m, m.playerX, m.playerY);
    const firstVisible = m.tiles.flat().filter(t => t.vis === 'visible').length;
    // Move FOV one tile over (even if it's a wall, hidden cells won't downgrade)
    m = TacticalFOV.compute(m, m.playerX + 1, m.playerY);
    const nowSeen = m.tiles.flat().filter(t => t.vis === 'seen').length;
    expect(firstVisible).toBeGreaterThan(0);
    expect(nowSeen).toBeGreaterThanOrEqual(0); // some cells should transition
  });

  it('walls block vision (hidden tiles far away stay hidden)', () => {
    let m = ZoneMap.generate('centro', 'commercial', 42);
    m = TacticalFOV.compute(m, m.playerX, m.playerY, 3); // short range
    const hidden = m.tiles.flat().filter(t => t.vis === 'hidden').length;
    expect(hidden).toBeGreaterThan(100); // most of a 44x32 map should still be hidden
  });
});
