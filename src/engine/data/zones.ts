import type { ZoneState } from '../world/Zone';

export interface ZoneStateDef extends ZoneState {
  canStart: boolean;
  startDescription?: string;
}

export const INITIAL_ZONES: ZoneStateDef[] = [
  // ─── NORTE ─────────────────────────────────────────────────────────
  {
    id: 'zona_industrial',
    name: 'Zona Industrial',
    type: 'industrial',
    coords: [21.8966, -102.3250],
    position: { x: 0.14, y: 0.12 },
    connections: ['estadio', 'insurgentes'],
    travelCost: { estadio: 30, insurgentes: 25 },
    danger: 6, noise: 5,
    loot: { abundance: 7, quality: 'medium', depleted: 0 },
    fog: 'unknown',
    description:
      'El polígono industrial al poniente. Maquiladoras vacías, bodegones silenciosos. Hay materiales de construcción y herramientas si llegas antes que los demás.',
    lore: ['En la entrada de una nave alguien pintó: "NO ENTRAR — ELLOS SIGUEN AQUÍ".'],
    canStart: false,
  },
  {
    id: 'estadio',
    name: 'Estadio Victoria',
    type: 'wild',
    coords: [21.8807, -102.2754],
    position: { x: 0.38, y: 0.12 },
    connections: ['zona_industrial', 'uaa', 'insurgentes'],
    travelCost: { zona_industrial: 30, uaa: 30, insurgentes: 30 },
    danger: 4, noise: 2,
    loot: { abundance: 4, quality: 'low', depleted: 0 },
    fog: 'unknown',
    description:
      'El Estadio Victoria, ahora en silencio. Las gradas vacías y los vestuarios ofrecen refugio temporal. Hay comida del último partido que nunca se terminó.',
    lore: [],
    canStart: false,
  },
  {
    id: 'uaa',
    name: 'Campus UAA',
    type: 'residential',
    coords: [21.9142, -102.3158],
    position: { x: 0.62, y: 0.12 },
    connections: ['estadio', 'expo', 'mercado_teran'],
    travelCost: { estadio: 30, expo: 25, mercado_teran: 35 },
    danger: 3, noise: 1,
    loot: { abundance: 5, quality: 'medium', depleted: 0 },
    fog: 'unknown',
    description:
      'La Universidad Autónoma de Aguascalientes. Los laboratorios tienen suministros médicos y químicos. Relativamente seguro — los zombis no parecen frecuentar las bibliotecas.',
    lore: ['Un pizarrón dice: "Clase suspendida indefinidamente. Cuídense."'],
    canStart: true,
    startDescription:
      'Despiertas en el campus universitario. Hay recursos en los laboratorios y pocas amenazas por ahora.',
  },
  {
    id: 'expo',
    name: 'Expo Aguascalientes',
    type: 'commercial',
    coords: [21.9024, -102.2542],
    position: { x: 0.85, y: 0.22 },
    connections: ['uaa', 'hospital_imss', 'las_fuentes'],
    travelCost: { uaa: 25, hospital_imss: 30, las_fuentes: 35 },
    danger: 5, noise: 3,
    loot: { abundance: 6, quality: 'medium', depleted: 0 },
    fog: 'unknown',
    description:
      'El centro de exposiciones, fue uno de los últimos lugares donde la gente se concentró cuando empezó el brote. Eso explica la cantidad de infectados.',
    lore: [],
    canStart: false,
  },

  // ─── CENTRO ────────────────────────────────────────────────────────
  {
    id: 'insurgentes',
    name: 'Col. Insurgentes',
    type: 'residential',
    coords: [21.8700, -102.3195],
    position: { x: 0.10, y: 0.45 },
    connections: ['zona_industrial', 'estadio', 'centro', 'parque_alcalde'],
    travelCost: { zona_industrial: 25, estadio: 30, centro: 25, parque_alcalde: 25 },
    danger: 3, noise: 2,
    loot: { abundance: 5, quality: 'low', depleted: 0 },
    fog: 'unknown',
    description:
      'Colonia residencial al poniente. Casas con despensas. Hay vecinos que no murieron — solo cambiaron.',
    lore: [],
    canStart: true,
    startDescription:
      'Despiertas en Insurgentes. Zona residencial tranquila con acceso a recursos domésticos básicos.',
  },
  {
    id: 'centro',
    name: 'Centro Histórico',
    type: 'commercial',
    coords: [21.8806, -102.2964], // Plaza de la Patria — OSM verified
    position: { x: 0.38, y: 0.45 },
    connections: ['insurgentes', 'mercado_teran', 'san_marcos', 'parque_alcalde'],
    travelCost: { insurgentes: 25, mercado_teran: 20, san_marcos: 25, parque_alcalde: 25 },
    danger: 6, noise: 4,
    loot: { abundance: 7, quality: 'medium', depleted: 20 },
    fog: 'explored',
    description:
      'La Plaza de la Patria, el corazón de Aguascalientes. Fue el punto de evacuación inicial. Hay recursos pero también una alta concentración de infectados en la zona peatonal.',
    lore: [
      'En la Catedral alguien puso un letrero: "DIOS NO ESTÁ AQUÍ. PERO TAMPOCO ELLOS."',
      'Los túneles hidráulicos debajo del centro siguen siendo una ruta posible.',
    ],
    canStart: true,
    startDescription:
      'Despiertas en el corazón de la ciudad. Alto riesgo, pero acceso a casi todo si sobrevives el primer día.',
  },
  {
    id: 'mercado_teran',
    name: 'Mercado Terán',
    type: 'commercial',
    coords: [21.8845, -102.2973],
    position: { x: 0.60, y: 0.43 },
    connections: ['centro', 'uaa', 'hospital_imss'],
    travelCost: { centro: 20, uaa: 35, hospital_imss: 25 },
    danger: 5, noise: 3,
    loot: { abundance: 9, quality: 'medium', depleted: 10 },
    fog: 'scouted',
    description:
      'El mercado más grande de la ciudad. Puestos de comida, ferreterías, farmacias. Si hay comida en algún lugar de la ciudad, es aquí.',
    lore: [],
    canStart: false,
  },
  {
    id: 'hospital_imss',
    name: 'Hospital IMSS',
    type: 'medical',
    coords: [21.8663, -102.2928],
    position: { x: 0.85, y: 0.45 },
    connections: ['mercado_teran', 'expo', 'las_fuentes'],
    travelCost: { mercado_teran: 25, expo: 30, las_fuentes: 25 },
    danger: 7, noise: 3,
    loot: { abundance: 9, quality: 'high', depleted: 0 },
    fog: 'scouted',
    description:
      'El Hospital General de Zona No. 1 del IMSS. Medicamentos, equipo quirúrgico, antibióticos. El peligro es proporcional a lo que hay ahí.',
    lore: ['Los últimos registros de admisiones tienen fecha del Día 3 del brote.'],
    canStart: false,
  },

  // ─── SUR ───────────────────────────────────────────────────────────
  {
    id: 'parque_alcalde',
    name: 'Parque Alcalde',
    type: 'wild',
    coords: [21.8684, -102.3080],
    position: { x: 0.18, y: 0.72 },
    connections: ['insurgentes', 'centro', 'san_marcos'],
    travelCost: { insurgentes: 25, centro: 25, san_marcos: 30 },
    danger: 2, noise: 1,
    loot: { abundance: 3, quality: 'low', depleted: 0 },
    fog: 'scouted',
    description:
      'El Parque Alejandro Gutiérrez. Árboles, silencio, espacio abierto. Pocos zombis aquí — prefieren los espacios cerrados con más "comida".',
    lore: [],
    canStart: true,
    startDescription:
      'Despiertas en el parque. Zona de bajo peligro, ideal para comenzar. Los recursos son escasos pero el tiempo para planear sobra.',
  },
  {
    id: 'san_marcos',
    name: 'Barrio San Marcos',
    type: 'residential',
    coords: [21.8742, -102.3069],
    position: { x: 0.45, y: 0.75 },
    connections: ['centro', 'parque_alcalde', 'las_fuentes'],
    travelCost: { centro: 25, parque_alcalde: 30, las_fuentes: 25 },
    danger: 4, noise: 2,
    loot: { abundance: 5, quality: 'low', depleted: 0 },
    fog: 'scouted',
    description:
      'El histórico Barrio de San Marcos, famoso por su Feria. Las casas coloniales son fáciles de barricar. El jardín es relativamente abierto.',
    lore: ['El quiosco del jardín tiene escrita una lista de supervivientes con fechas. La última entrada es de hace 4 días.'],
    canStart: true,
    startDescription:
      'Despiertas en San Marcos. Barrio histórico con buena visibilidad y acceso al centro. Peligro moderado.',
  },
  {
    id: 'las_fuentes',
    name: 'Col. Las Fuentes',
    type: 'residential',
    coords: [21.8472, -102.2720],
    position: { x: 0.68, y: 0.72 },
    connections: ['expo', 'hospital_imss', 'san_marcos', 'aeropuerto'],
    travelCost: { expo: 35, hospital_imss: 25, san_marcos: 25, aeropuerto: 30 },
    danger: 4, noise: 2,
    loot: { abundance: 5, quality: 'low', depleted: 0 },
    fog: 'unknown',
    description:
      'Colonia residencial al oriente. Casas de clase media, jardines. Hay algo en los fraccionamientos cerrados — las barricadas que pusieron los vecinos mantienen tanto a los zombis adentro como afuera.',
    lore: [],
    canStart: false,
  },
  {
    id: 'aeropuerto',
    name: 'Aeropuerto Internacional',
    type: 'military',
    coords: [21.7013, -102.3142],
    position: { x: 0.82, y: 0.86 },
    connections: ['las_fuentes'],
    travelCost: { las_fuentes: 30 },
    danger: 8, noise: 3,
    loot: { abundance: 8, quality: 'rare', depleted: 0 },
    fog: 'unknown',
    description:
      'El Aeropuerto Internacional Licenciado Jesús Terán Peredo. Fue el último intento de evacuación militar. Hay armamento, vehículos, y lo que quedó cuando la evacuación falló.',
    lore: ['Un avión sigue en la pista. Sus motores se encienden solos cada noche, por alguna razón.'],
    canStart: false,
  },
];
