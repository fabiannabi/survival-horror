import { describe, it, expect } from 'vitest';
import { InventorySystem } from '../../src/engine/systems/InventorySystem';
import { ITEMS } from '../../src/engine/data/items';
import { INITIAL_PLAYER } from '../../src/engine/entities/Player';

describe('InventorySystem.useItem', () => {
  it('food restores hunger', () => {
    const hungry = { ...INITIAL_PLAYER, hunger: 20 };
    const next = InventorySystem.useItem(hungry, ITEMS.lata_frijoles);
    expect(next.hunger).toBeGreaterThan(20);
    expect(next.hunger).toBeLessThanOrEqual(100);
  });

  it('water restores thirst', () => {
    const dry = { ...INITIAL_PLAYER, thirst: 10 };
    const next = InventorySystem.useItem(dry, ITEMS.agua_botella);
    expect(next.thirst).toBeGreaterThan(10);
  });

  it('medicine restores health', () => {
    const hurt = { ...INITIAL_PLAYER, health: 50 };
    const next = InventorySystem.useItem(hurt, ITEMS.botiquin);
    expect(next.health).toBeGreaterThan(50);
  });

  it('antibiotic reduces infection', () => {
    const infected = { ...INITIAL_PLAYER, infection: 60 };
    const next = InventorySystem.useItem(infected, ITEMS.antibiotico);
    expect(next.infection).toBeLessThan(60);
  });

  it('grifo water may increase infection', () => {
    const next = InventorySystem.useItem(INITIAL_PLAYER, ITEMS.agua_grifo);
    expect(next.infection).toBeGreaterThan(0);
  });

  it('does not exceed 100 on any stat', () => {
    const next = InventorySystem.useItem(INITIAL_PLAYER, ITEMS.lata_frijoles);
    expect(next.hunger).toBeLessThanOrEqual(100);
  });

  it('does not go below 0 on any stat', () => {
    const full = { ...INITIAL_PLAYER, infection: 5 };
    const next = InventorySystem.useItem(full, ITEMS.antibiotico);
    expect(next.infection).toBeGreaterThanOrEqual(0);
  });

  it('cafe reduces fatigue', () => {
    const tired = { ...INITIAL_PLAYER, fatigue: 60 };
    const next = InventorySystem.useItem(tired, ITEMS.cafe);
    expect(next.fatigue).toBeLessThan(60);
  });
});

describe('InventorySystem.effectLabel', () => {
  it('returns non-empty string for food', () => {
    expect(InventorySystem.effectLabel(ITEMS.lata_frijoles).length).toBeGreaterThan(0);
  });

  it('includes infection indicator for grifo water', () => {
    const label = InventorySystem.effectLabel(ITEMS.agua_grifo);
    expect(label).toContain('Inf');
  });
});
