import type { ZoneState } from '../world/Zone';

/*
  Mapa de Villarosa (posiciones normalizadas 0-1):

  bosque(0.15,0.14)---fabrica(0.45,0.14)---cuartel(0.78,0.14)
       |                    |                    |
  parque(0.15,0.40)---res_norte(0.45,0.40)---comisaria(0.78,0.40)
       |                    |                    |
  gasolinera(0.15,0.64)-REFUGIO(0.45,0.64)--hospital(0.78,0.64)
                             |                    |
                       supermercado(0.45,0.86)--res_sur(0.78,0.86)
*/

export const INITIAL_ZONES: ZoneState[] = [
  {
    id: 'refugio',
    name: 'Refugio',
    type: 'residential',
    position: { x: 0.45, y: 0.64 },
    connections: ['gasolinera', 'res_norte', 'hospital', 'supermercado'],
    travelCost: { gasolinera: 25, res_norte: 30, hospital: 25, supermercado: 20 },
    danger: 2, noise: 1,
    loot: { abundance: 4, quality: 'low', depleted: 30 },
    fog: 'explored',
    description:
      'Un bloque de apartamentos convertido en refugio. Las barricadas aguantan... por ahora.',
    lore: ['Alguien grabó "DÍA 1" en la pared de entrada. Hay más marcas debajo.'],
  },
  {
    id: 'gasolinera',
    name: 'Gasolinera',
    type: 'commercial',
    position: { x: 0.15, y: 0.64 },
    connections: ['refugio', 'parque'],
    travelCost: { refugio: 25, parque: 30 },
    danger: 4, noise: 2,
    loot: { abundance: 6, quality: 'medium', depleted: 0 },
    fog: 'scouted',
    description:
      'Una gasolinera abandonada. Los depósitos pueden tener combustible. También pueden tener zombis.',
    lore: [],
  },
  {
    id: 'hospital',
    name: 'Hospital',
    type: 'medical',
    position: { x: 0.78, y: 0.64 },
    connections: ['refugio', 'comisaria', 'res_sur'],
    travelCost: { refugio: 25, comisaria: 35, res_sur: 25 },
    danger: 6, noise: 3,
    loot: { abundance: 8, quality: 'high', depleted: 0 },
    fog: 'scouted',
    description:
      'El Hospital de San Marcos. Lleno de suministros médicos... y de los que murieron esperando ayuda.',
    lore: [],
  },
  {
    id: 'res_norte',
    name: 'Residencial Norte',
    type: 'residential',
    position: { x: 0.45, y: 0.40 },
    connections: ['refugio', 'parque', 'fabrica', 'comisaria'],
    travelCost: { refugio: 30, parque: 30, fabrica: 35, comisaria: 35 },
    danger: 3, noise: 2,
    loot: { abundance: 5, quality: 'low', depleted: 0 },
    fog: 'scouted',
    description:
      'Bloques de viviendas del norte. Hay señales de que hubo supervivientes aquí hace poco.',
    lore: [],
  },
  {
    id: 'supermercado',
    name: 'Supermercado',
    type: 'commercial',
    position: { x: 0.45, y: 0.86 },
    connections: ['refugio', 'res_sur'],
    travelCost: { refugio: 20, res_sur: 30 },
    danger: 5, noise: 3,
    loot: { abundance: 9, quality: 'medium', depleted: 0 },
    fog: 'scouted',
    description:
      'El Supermercado Éxito. Probablemente saqueado, pero puede quedar algo útil entre los estantes caídos.',
    lore: [],
  },
  {
    id: 'parque',
    name: 'Parque Municipal',
    type: 'wild',
    position: { x: 0.15, y: 0.40 },
    connections: ['gasolinera', 'res_norte', 'bosque'],
    travelCost: { gasolinera: 30, res_norte: 30, bosque: 45 },
    danger: 3, noise: 1,
    loot: { abundance: 3, quality: 'low', depleted: 0 },
    fog: 'unknown',
    description:
      'El parque central, ahora selvático. Menos zombis, pero la vegetación corta la visibilidad.',
    lore: [],
  },
  {
    id: 'comisaria',
    name: 'Comisaría',
    type: 'military',
    position: { x: 0.78, y: 0.40 },
    connections: ['res_norte', 'hospital', 'cuartel'],
    travelCost: { res_norte: 35, hospital: 35, cuartel: 40 },
    danger: 6, noise: 2,
    loot: { abundance: 7, quality: 'high', depleted: 0 },
    fog: 'unknown',
    description:
      'La comisaría del distrito. Posible armería intacta. Alta concentración de infectados en el bloque.',
    lore: [],
  },
  {
    id: 'res_sur',
    name: 'Residencial Sur',
    type: 'residential',
    position: { x: 0.78, y: 0.86 },
    connections: ['hospital', 'supermercado'],
    travelCost: { hospital: 25, supermercado: 30 },
    danger: 4, noise: 2,
    loot: { abundance: 5, quality: 'low', depleted: 0 },
    fog: 'unknown',
    description: 'Barrios residenciales al sur. Silenciosos... demasiado silenciosos.',
    lore: [],
  },
  {
    id: 'fabrica',
    name: 'Fábrica',
    type: 'industrial',
    position: { x: 0.45, y: 0.14 },
    connections: ['res_norte', 'cuartel', 'bosque'],
    travelCost: { res_norte: 35, cuartel: 30, bosque: 45 },
    danger: 7, noise: 4,
    loot: { abundance: 6, quality: 'medium', depleted: 0 },
    fog: 'unknown',
    description:
      'Una fábrica abandonada desde antes del brote. Los trabajadores que quedaron no tardaron en convertirse.',
    lore: [],
  },
  {
    id: 'bosque',
    name: 'Bosque Norte',
    type: 'wild',
    position: { x: 0.15, y: 0.14 },
    connections: ['parque', 'fabrica'],
    travelCost: { parque: 45, fabrica: 45 },
    danger: 3, noise: 1,
    loot: { abundance: 2, quality: 'low', depleted: 0 },
    fog: 'unknown',
    description:
      'El bosque al norte de la ciudad. Alejado del ruido. Alejado también de los recursos.',
    lore: [],
  },
  {
    id: 'cuartel',
    name: 'Cuartel',
    type: 'military',
    position: { x: 0.78, y: 0.14 },
    connections: ['fabrica', 'comisaria'],
    travelCost: { fabrica: 30, comisaria: 40 },
    danger: 8, noise: 3,
    loot: { abundance: 9, quality: 'rare', depleted: 0 },
    fog: 'unknown',
    description:
      'El cuartel militar al norte. Altísimo peligro, pero hay armamento pesado y raciones de campaña.',
    lore: [],
  },
];
