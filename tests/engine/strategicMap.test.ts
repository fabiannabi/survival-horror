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
  it('centro is connected to mercado_teran', () => {
    expect(StrategicMap.isConnected(zones, 'centro', 'mercado_teran')).toBe(true);
  });

  it('centro is NOT directly connected to aeropuerto', () => {
    expect(StrategicMap.isConnected(zones, 'centro', 'aeropuerto')).toBe(false);
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
    expect(StrategicMap.getTravelCost(zones, 'centro', 'mercado_teran')).toBe(20);
    expect(StrategicMap.getTravelCost(zones, 'centro', 'insurgentes')).toBe(25);
    expect(StrategicMap.getTravelCost(zones, 'centro', 'san_marcos')).toBe(25);
  });

  it('getTravelCost returns 999 for unconnected zones', () => {
    expect(StrategicMap.getTravelCost(zones, 'centro', 'aeropuerto')).toBe(999);
  });

  it('revealAfterTravel explores destination and scouts neighbors', () => {
    const updated = StrategicMap.revealAfterTravel(zones, 'mercado_teran');

    expect(updated['mercado_teran'].fog).toBe('explored');
    // uaa is a neighbor of mercado_teran
    expect(updated['uaa'].fog).toBe('scouted');
  });

  it('revealAfterTravel does not downgrade fog', () => {
    // centro starts as explored; traveling to mercado_teran shouldn't downgrade centro
    const updated = StrategicMap.revealAfterTravel(zones, 'mercado_teran');
    expect(updated['centro'].fog).toBe('explored');
  });

  it('getConnected returns the connected zone objects', () => {
    const connected = StrategicMap.getConnected(zones, 'centro');
    const ids = connected.map((z) => z.id);
    expect(ids).toContain('mercado_teran');
    expect(ids).toContain('san_marcos');
    expect(ids).toContain('insurgentes');
    expect(ids).toContain('parque_alcalde');
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

  it('alpha is 0 for unknown and 1 for explored', () => {
    expect(FogOfWar.alpha('unknown')).toBe(0);
    expect(FogOfWar.alpha('explored')).toBe(1);
  });
});

describe('Travel', () => {
  it('canTravel returns true for connected zones', () => {
    expect(Travel.canTravel(zones, 'centro', 'mercado_teran')).toBe(true);
  });

  it('canTravel returns false for non-adjacent zones', () => {
    expect(Travel.canTravel(zones, 'centro', 'aeropuerto')).toBe(false);
  });

  it('describe formats minutes correctly', () => {
    const desc = Travel.describe('Centro', 'Mercado Terán', 20);
    expect(desc).toContain('20min');
    expect(desc).toContain('Centro');
  });

  it('describe formats hours and minutes', () => {
    const desc = Travel.describe('A', 'B', 90);
    expect(desc).toContain('1h');
    expect(desc).toContain('30min');
  });
});
