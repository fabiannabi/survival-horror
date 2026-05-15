import type { Item } from '../entities/Item';

export const ITEMS: Record<string, Item> = {
  lata_frijoles: { id: 'lata_frijoles', name: 'Lata de frijoles',    type: 'food',     effects: { hunger: 35 } },
  lata_atun:     { id: 'lata_atun',     name: 'Lata de atún',        type: 'food',     effects: { hunger: 25, morale: 5 } },
  barra_cereal:  { id: 'barra_cereal',  name: 'Barra de cereal',     type: 'food',     effects: { hunger: 20 } },
  cafe:          { id: 'cafe',          name: 'Café instantáneo',    type: 'food',     effects: { fatigue: -25, morale: 10 } },
  agua_botella:  { id: 'agua_botella',  name: 'Agua embotellada',    type: 'water',    effects: { thirst: 50 } },
  agua_grifo:    { id: 'agua_grifo',    name: 'Agua de grifo',       type: 'water',    effects: { thirst: 25, infection: 8 } },
  venda:         { id: 'venda',         name: 'Venda',               type: 'medicine', effects: { health: 15 } },
  antibiotico:   { id: 'antibiotico',   name: 'Antibiótico',         type: 'medicine', effects: { infection: -35 } },
  botiquin:      { id: 'botiquin',      name: 'Botiquín',            type: 'medicine', effects: { health: 30, infection: -10 } },
  pastillas:     { id: 'pastillas',     name: 'Pastillas de yodo',   type: 'medicine', effects: { infection: -15, health: 5 } },
};
