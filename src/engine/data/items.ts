import type { Item } from '../entities/Item';

export const ITEMS: Record<string, Item> = {
  // ── Comida ──────────────────────────────────────────────────────────
  lata_frijoles:  { id: 'lata_frijoles',  name: 'Lata de frijoles',      type: 'food',     effects: { hunger: 35 } },
  lata_atun:      { id: 'lata_atun',      name: 'Lata de atún',          type: 'food',     effects: { hunger: 25, morale: 5 } },
  barra_cereal:   { id: 'barra_cereal',   name: 'Barra de cereal',       type: 'food',     effects: { hunger: 20 } },
  papas_fritas:   { id: 'papas_fritas',   name: 'Papas fritas (bolsa)',   type: 'food',     effects: { hunger: 12, morale: 4 } },
  pan_molde:      { id: 'pan_molde',      name: 'Pan de molde',          type: 'food',     effects: { hunger: 18 } },
  cafe:           { id: 'cafe',           name: 'Café instantáneo',      type: 'food',     effects: { fatigue: -25, morale: 10 } },
  // ── Agua ────────────────────────────────────────────────────────────
  agua_botella:   { id: 'agua_botella',   name: 'Agua embotellada',      type: 'water',    effects: { thirst: 50 } },
  refresco:       { id: 'refresco',       name: 'Refresco (lata)',        type: 'water',    effects: { thirst: 30, morale: 8 } },
  agua_grifo:     { id: 'agua_grifo',     name: 'Agua de grifo',         type: 'water',    effects: { thirst: 25, infection: 8 } },
  // ── Medicina ────────────────────────────────────────────────────────
  venda:          { id: 'venda',          name: 'Venda',                 type: 'medicine', effects: { health: 15 } },
  antibiotico:    { id: 'antibiotico',    name: 'Antibiótico',           type: 'medicine', effects: { infection: -35 } },
  botiquin:       { id: 'botiquin',       name: 'Botiquín completo',     type: 'medicine', effects: { health: 30, infection: -10 } },
  pastillas:      { id: 'pastillas',      name: 'Pastillas de yodo',     type: 'medicine', effects: { infection: -15, health: 5 } },
  suero:          { id: 'suero',          name: 'Suero oral',            type: 'medicine', effects: { thirst: 35, health: 8 } },
  // ── Vehículos (equipo — no se consumen) ─────────────────────────────────
  bicicleta:      { id: 'bicicleta',      name: 'Bicicleta',             type: 'material', effects: {} },
  llave_auto:     { id: 'llave_auto',     name: 'Llave de auto',         type: 'material', effects: {} },
  llave_moto:     { id: 'llave_moto',     name: 'Llave de moto',         type: 'material', effects: {} },
};
