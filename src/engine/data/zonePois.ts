export type PoiCategory = 'food' | 'shop' | 'medical' | 'military' | 'industrial' | 'water';

export interface ZonePoi {
  category: PoiCategory;
  label: string;
}

// Real POI data from Overpass API (600m radius per zone)
export const ZONE_POIS: Record<string, ZonePoi[]> = {
  centro: [
    { category: 'food',    label: '49 restaurantes y cafés' },
    { category: 'shop',    label: '16 supermercados y abarrotes' },
    { category: 'medical', label: '15 farmacias' },
  ],
  mercado_teran: [
    { category: 'food',  label: '52 puestos de comida' },
    { category: 'shop',  label: '18 tiendas (Oxxo, Circle K, Abarrotes Jassem)' },
  ],
  estadio: [
    { category: 'shop',    label: '2 Oxxos' },
    { category: 'medical', label: '1 farmacia' },
  ],
  hospital_imss: [
    { category: 'medical', label: 'Hospital IMSS (zona médica principal)' },
    { category: 'shop',    label: 'Tiendas 3B (suministros básicos)' },
  ],
  aeropuerto: [
    { category: 'military', label: 'Aeropuerto militar (último intento de evacuación)' },
  ],
  zona_industrial: [
    { category: 'industrial', label: 'Polígono industrial — sin comercios' },
    { category: 'water',      label: 'Tomas de agua industriales' },
  ],
  uaa: [
    { category: 'shop',    label: 'Soriana Hiper (supermercado)' },
    { category: 'medical', label: 'Hospital campus UAA Ciencias Biomédicas' },
  ],
  expo: [
    { category: 'shop',    label: '1 Oxxo' },
    { category: 'medical', label: '1 farmacia' },
  ],
  insurgentes: [
    { category: 'shop', label: '1 Oxxo' },
  ],
  parque_alcalde: [
    { category: 'food', label: "Little Caesar's · Subway" },
    { category: 'shop', label: '1 Oxxo' },
  ],
  san_marcos: [
    { category: 'shop', label: '5 tiendas (Oxxo, Circle K)' },
    { category: 'food', label: '3 restaurantes (Merendero San Marcos)' },
  ],
  las_fuentes: [
    { category: 'medical', label: 'Farmacia Guadalajara' },
  ],
};

export const POI_META: Record<PoiCategory, { badge: string; color: string }> = {
  food:       { badge: 'ALI', color: '#c97a30' },
  shop:       { badge: 'CVN', color: '#4a8fb5' },
  medical:    { badge: 'MED', color: '#5fc88a' },
  military:   { badge: 'MIL', color: '#aa4444' },
  industrial: { badge: 'IND', color: '#888' },
  water:      { badge: 'AGU', color: '#5aafc8' },
};
