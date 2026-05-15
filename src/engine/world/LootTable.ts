import { RNG as RotRNG } from 'rot-js';
import type { ZoneType } from './Zone';
import { ITEMS } from '../data/items';
import type { Item } from '../entities/Item';

type WeightMap = Record<string, number>;

const TABLES: Record<ZoneType, WeightMap> = {
  commercial:  { lata_frijoles: 20, lata_atun: 15, barra_cereal: 15, agua_botella: 15, cafe: 10, venda: 5 },
  medical:     { antibiotico: 25, botiquin: 20, venda: 20, pastillas: 15, agua_botella: 10 },
  industrial:  { lata_frijoles: 10, agua_grifo: 20, venda: 10 },
  military:    { botiquin: 20, venda: 20, antibiotico: 15, lata_atun: 15, agua_botella: 10 },
  residential: { lata_frijoles: 20, agua_botella: 20, barra_cereal: 15, cafe: 10, venda: 5, lata_atun: 10 },
  wild:        { agua_grifo: 30, lata_frijoles: 10, barra_cereal: 10 },
};

export class LootTable {
  // Called inside a RotRNG save/restore context — RNG state is already seeded
  static generate(zoneType: ZoneType): Item[] {
    const table = TABLES[zoneType];
    const count = 1 + Math.floor(RotRNG.getUniform() * 3); // 1–3 items
    const items: Item[] = [];
    for (let i = 0; i < count; i++) {
      const itemId = RotRNG.getWeightedValue(table) as string | null;
      if (itemId && ITEMS[itemId]) items.push(ITEMS[itemId]);
    }
    return items;
  }
}
