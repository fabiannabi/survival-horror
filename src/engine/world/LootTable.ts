import { RNG as RotRNG } from 'rot-js';
import type { ZoneType } from './Zone';
import { ITEMS } from '../data/items';
import type { Item } from '../entities/Item';

type WeightMap = Record<string, number>;

// ─── Per-zone tables derived from real OSM POI data ──────────────────────────
// Weights reflect actual amenities found within 600m of each zone's coordinates.
// Source: Overpass API query on Aguascalientes, Mexico.
const ZONE_TABLES: Record<string, WeightMap> = {

  // 49 restaurants/cafes, 16 grocery, 15 pharmacies → richest urban zone
  centro: {
    lata_frijoles: 12, lata_atun: 10, barra_cereal: 8, papas_fritas: 8,
    agua_botella: 18, refresco: 15, cafe: 12,
    venda: 6, antibiotico: 5, pastillas: 4, botiquin: 4, suero: 3,
    agua_grifo: 3,
  },

  // 52 food, 18 grocery (Circle K, Oxxo, Abarrotes Jassem) — raw food market
  mercado_teran: {
    lata_frijoles: 25, lata_atun: 18, pan_molde: 15, barra_cereal: 10,
    agua_botella: 15, refresco: 10, cafe: 8,
    venda: 5, antibiotico: 4, pastillas: 3,
  },

  // 2 Oxxos, 1 pharmacy — sparse sports venue
  estadio: {
    agua_botella: 22, refresco: 20, barra_cereal: 18, papas_fritas: 18,
    venda: 10, lata_frijoles: 8, cafe: 4,
  },

  // Hospital IMSS — medical zone dominates even with sparse commercial POIs
  hospital_imss: {
    antibiotico: 28, botiquin: 22, venda: 20, pastillas: 15, suero: 10,
    agua_botella: 5, // Tiendas 3B
  },

  // Military airport — emergency rations + military-grade supplies
  aeropuerto: {
    lata_atun: 22, lata_frijoles: 18, agua_botella: 18,
    botiquin: 15, venda: 12, antibiotico: 10,
    barra_cereal: 5,
  },

  // 0 commercial POIs — industrial wasteland, sparse & dangerous
  zona_industrial: {
    agua_grifo: 30, lata_frijoles: 18, venda: 15,
    pan_molde: 12, barra_cereal: 12, cafe: 8, agua_botella: 5,
  },

  // Soriana Hiper (big supermarket) + hospital campus (UAA Ciencias Biomédicas)
  uaa: {
    lata_frijoles: 20, lata_atun: 12, pan_molde: 12, barra_cereal: 10,
    agua_botella: 20, refresco: 10,
    antibiotico: 8, pastillas: 6, botiquin: 5, suero: 5, cafe: 8,
    agua_grifo: 4,
  },

  // 1 Oxxo + 1 pharmacy + school zone — sparse residential/commercial
  expo: {
    barra_cereal: 20, papas_fritas: 15, refresco: 18, agua_botella: 15,
    lata_frijoles: 12, venda: 10, pastillas: 8, cafe: 7,
  },

  // Single Oxxo — bare minimum residential convenience
  insurgentes: {
    barra_cereal: 25, papas_fritas: 20, refresco: 20, agua_botella: 15,
    lata_frijoles: 12, cafe: 8,
  },

  // Little Caesar's + Subway + 1 Oxxo — junk food zone
  parque_alcalde: {
    papas_fritas: 25, barra_cereal: 22, refresco: 20, agua_botella: 15,
    pan_molde: 10, lata_frijoles: 8,
  },

  // 5 Oxxo/Circle K + 3 restaurants (Merendero San Marcos) — dense convenience
  san_marcos: {
    agua_botella: 20, refresco: 18, barra_cereal: 15, papas_fritas: 12,
    lata_frijoles: 12, lata_atun: 8, cafe: 8, pan_molde: 7,
  },

  // 1 pharmacy (Farmacia Guadalajara) + Campos Omega park
  las_fuentes: {
    venda: 28, pastillas: 25, antibiotico: 18, suero: 15,
    agua_botella: 8, lata_frijoles: 6,
  },
};

// Fallback tables by zone type — used for all procedurally generated zones
const TYPE_TABLES: Record<ZoneType, WeightMap> = {
  commercial:  { lata_frijoles: 18, lata_atun: 12, barra_cereal: 12, agua_botella: 18, refresco: 12, cafe: 8, venda: 8, antibiotico: 6, pastillas: 4, agua_grifo: 2, bicicleta: 2, llave_auto: 1, llave_moto: 1 },
  medical:     { antibiotico: 25, botiquin: 20, venda: 20, pastillas: 15, suero: 12, agua_botella: 8 },
  industrial:  { lata_frijoles: 15, agua_grifo: 25, venda: 12, barra_cereal: 10, cafe: 8, pan_molde: 10, bicicleta: 3, llave_auto: 2, llave_moto: 2 },
  military:    { botiquin: 20, venda: 18, antibiotico: 15, lata_atun: 18, agua_botella: 15, pastillas: 10, suero: 4, llave_auto: 3, llave_moto: 3 },
  residential: { lata_frijoles: 20, agua_botella: 18, barra_cereal: 14, refresco: 12, cafe: 8, venda: 6, pan_molde: 12, papas_fritas: 10, bicicleta: 4, llave_auto: 2, llave_moto: 2 },
  wild:        { agua_grifo: 28, lata_frijoles: 15, barra_cereal: 15, pan_molde: 12, cafe: 10 },
};

export class LootTable {
  static generate(zoneType: ZoneType, zoneId: string): Item[] {
    const table = ZONE_TABLES[zoneId] ?? TYPE_TABLES[zoneType];
    const count = 1 + Math.floor(RotRNG.getUniform() * 3); // 1–3 items
    const items: Item[] = [];
    for (let i = 0; i < count; i++) {
      const itemId = RotRNG.getWeightedValue(table) as string | null;
      if (itemId && ITEMS[itemId]) items.push(ITEMS[itemId]);
    }
    return items;
  }
}
