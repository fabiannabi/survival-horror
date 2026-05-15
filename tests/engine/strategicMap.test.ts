import { describe, it, expect } from 'vitest';
import { StrategicMap } from '../../src/engine/world/StrategicMap';
import { FogOfWar } from '../../src/engine/world/FogOfWar';
import { Travel } from '../../src/engine/world/Travel';
import { INITIAL_ZONES } from '../../src/engine/data/zones';
import type { ZoneState } from '../../src/engine/world/Zone';

const zones: Record<string, ZoneState> = Object.fromEntries(
  INITIAL_ZONES.map((z) => [z.id, z]),
);

describe('StrategicMap', () => {
  it('refugio is connected to gasolinera', () => {
    expect(StrategicMap.isConnected(zones, 'refugio', 'gasolinera')).toBe(true);
  });

  it('refugio is NOT directly connected to cuartel', () => {
    expect(StrategicMap.isConnected(zones, 'refugio', 'cuartel')).toBe(false);
  });

  it('all connections are bidirectional', () => {
    for (const zone of INITIAL_ZONES) {
      for (const connId of zone.connections) {
        expect(
          StrategicMap.isConnected(zones, connId, zone.id),
          `${connId} should connect back to ${zone.id}`,
        ).toBe(true);
      }
    }
  });

  it('getTravelCost returns correct value', () => {
    expect(StrategicMap.getTravelCost(zones, 'refugio', 'gasolinera')).toBe(25);
    expect(StrategicMap.getTravelCost(zones, 'refugio', 'hospital')).toBe(25);
    expect(StrategicMap.getTravelCost(zones, 'refugio', 'supermercado')).toBe(20);
  });

  it('getTravelCost returns 999 for unconnected zones', () => {
    expect(StrategicMap.getTravelCost(zones, 'refugio', 'cuartel')).toBe(999);
  });

  it('revealAfterTravel explores destination and scouts neighbors', () => {
    const updated = StrategicMap.revealAfterTravel(zones, 'gasolinera');

    expect(updated['gasolinera'].fog).toBe('explored');
    // parque is a neighbor of gasolinera
    expect(updated['parque'].fog).toBe('scouted');
    // refugio was already explored, should not downgrade
    expect(updated['refugio'].fog).toBe('explored');
  });

  it('revealAfterTravel does not downgrade fog', () => {
    // refugio starts as explored, should stay explored
    const updated = StrategicMap.revealAfterTravel(zones, 'gasolinera');
    expect(updated['refugio'].fog).toBe('explored');
  });
});

describe('FogOfWar', () => {
  it('unknown is not visible', () => {
    expect(FogOfWar.isVisible('unknown')).toBe(false);
  });

  it('scouted and explored are visible', () => {
    expect(FogOfWar.isVisible('scouted')).toBe(true);
    expect(FogOfWar.isVisible('explored')).toBe(true);
  });

  it('upgrade returns higher fog level', () => {
    expect(FogOfWar.upgrade('unknown', 'scouted')).toBe('scouted');
    expect(FogOfWar.upgrade('scouted', 'explored')).toBe('explored');
  });

  it('upgrade does not downgrade', () => {
    expect(FogOfWar.upgrade('explored', 'scouted')).toBe('explored');
    expect(FogOfWar.upgrade('scouted', 'unknown')).toBe('scouted');
  });

  it('alpha is 0 for unknown', () => {
    expect(FogOfWar.alpha('unknown')).toBe(0);
  });

  it('alpha is 1 for explored', () => {
    expect(FogOfWar.alpha('explored')).toBe(1);
  });
});

describe('Travel', () => {
  it('canTravel returns true for connected zones', () => {
    expect(Travel.canTravel(zones, 'refugio', 'hospital')).toBe(true);
  });

  it('canTravel returns false for non-adjacent zones', () => {
    expect(Travel.canTravel(zones, 'refugio', 'bosque')).toBe(false);
  });

  it('describe formats time correctly in minutes', () => {
    const desc = Travel.describe('Refugio', 'Gasolinera', 25);
    expect(desc).toContain('25min');
    expect(desc).toContain('Refugio');
    expect(desc).toContain('Gasolinera');
  });

  it('describe formats hours and minutes', () => {
    const desc = Travel.describe('A', 'B', 90);
    expect(desc).toContain('1h');
    expect(desc).toContain('30min');
  });
});
