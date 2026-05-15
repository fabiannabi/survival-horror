import type { ZoneStateDef } from '../data/zones';
import type { ZoneType, LootQuality } from './Zone';

// ─── Local seeded LCG RNG (independent of rot-js singleton) ─────────────────
class LcgRng {
  private s: number;
  constructor(seed: number) {
    this.s = ((seed ^ 0xdeadbeef) >>> 0) || 1;
  }
  next(): number {
    this.s = (Math.imul(1664525, this.s) + 1013904223) >>> 0;
    return this.s / 0x100000000;
  }
  range(lo: number, hi: number): number { return lo + this.next() * (hi - lo); }
  int(lo: number, hi: number): number { return lo + Math.floor(this.next() * (hi - lo + 1)); }
  pick<T>(arr: T[]): T { return arr[Math.floor(this.next() * arr.length)]; }
  chance(p: number): boolean { return this.next() < p; }
  shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = (this.next() * (i + 1)) | 0;
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
}

// ─── Geometry ────────────────────────────────────────────────────────────────
interface Pt { x: number; y: number }
type Tri = [number, number, number];

function circumcircle(pts: Pt[], a: number, b: number, c: number): { cx: number; cy: number; r2: number } {
  const ax = pts[a].x, ay = pts[a].y;
  const bx = pts[b].x, by = pts[b].y;
  const cx = pts[c].x, cy = pts[c].y;
  const D = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
  if (Math.abs(D) < 1e-9) return { cx: (ax + bx + cx) / 3, cy: (ay + by + cy) / 3, r2: Infinity };
  const s1 = ax * ax + ay * ay, s2 = bx * bx + by * by, s3 = cx * cx + cy * cy;
  const ux = (s1 * (by - cy) + s2 * (cy - ay) + s3 * (ay - by)) / D;
  const uy = (s1 * (cx - bx) + s2 * (ax - cx) + s3 * (bx - ax)) / D;
  return { cx: ux, cy: uy, r2: (ax - ux) ** 2 + (ay - uy) ** 2 };
}

// Sutherland-Hodgman polygon clipping
function clipPolygon(poly: Pt[], x0: number, y0: number, x1: number, y1: number): Pt[] {
  if (poly.length < 3) return poly;
  function edge(input: Pt[], inside: (p: Pt) => boolean, isect: (a: Pt, b: Pt) => Pt): Pt[] {
    if (!input.length) return [];
    const out: Pt[] = [];
    for (let i = 0; i < input.length; i++) {
      const cur = input[i];
      const prv = input[(i - 1 + input.length) % input.length];
      const ci = inside(cur), pi = inside(prv);
      if (ci) { if (!pi) out.push(isect(prv, cur)); out.push(cur); }
      else if (pi) out.push(isect(prv, cur));
    }
    return out;
  }
  const lx = (x: number) => (a: Pt, b: Pt): Pt => {
    const t = (x - a.x) / (b.x - a.x); return { x, y: a.y + t * (b.y - a.y) };
  };
  const ly = (y: number) => (a: Pt, b: Pt): Pt => {
    const t = (y - a.y) / (b.y - a.y); return { x: a.x + t * (b.x - a.x), y };
  };
  let p = poly;
  p = edge(p, pt => pt.x >= x0, lx(x0));
  p = edge(p, pt => pt.x <= x1, lx(x1));
  p = edge(p, pt => pt.y >= y0, ly(y0));
  p = edge(p, pt => pt.y <= y1, ly(y1));
  return p;
}

// ─── Bowyer-Watson Delaunay triangulation ────────────────────────────────────
function delaunay(sites: Pt[]): { tris: Tri[]; pts: Pt[] } {
  const n = sites.length;
  // Ghost points frame the canvas to close boundary Voronoi cells
  const ghosts: Pt[] = [
    { x: -0.5, y: -0.5 }, { x: 1.5, y: -0.5 }, { x: 1.5, y: 1.5 }, { x: -0.5, y: 1.5 },
    { x: 0.5, y: -0.8 },  { x: 1.8, y: 0.5 },  { x: 0.5, y: 1.8 }, { x: -0.8, y: 0.5 },
  ];
  const pts: Pt[] = [...sites, ...ghosts];
  const N = pts.length;

  // Super-triangle (contains all pts)
  const ST = N;
  pts.push({ x: -10, y: -10 }, { x: 20, y: -10 }, { x: 5, y: 20 });

  let tris: Tri[] = [[ST, ST + 1, ST + 2]];

  for (let pi = 0; pi < N; pi++) {
    const bad = new Set<number>();
    for (let ti = 0; ti < tris.length; ti++) {
      const [a, b, c] = tris[ti];
      const { cx, cy, r2 } = circumcircle(pts, a, b, c);
      if ((pts[pi].x - cx) ** 2 + (pts[pi].y - cy) ** 2 <= r2 + 1e-10) bad.add(ti);
    }

    const edgeCnt = new Map<string, number>();
    for (const ti of bad) {
      const [a, b, c] = tris[ti];
      for (const [p, q] of [[a, b], [b, c], [c, a]] as [number, number][]) {
        const k = p < q ? `${p},${q}` : `${q},${p}`;
        edgeCnt.set(k, (edgeCnt.get(k) ?? 0) + 1);
      }
    }

    tris = tris.filter((_, i) => !bad.has(i));
    for (const [k, cnt] of edgeCnt) {
      if (cnt === 1) {
        const [p, q] = k.split(',').map(Number);
        tris.push([p, q, pi]);
      }
    }
  }

  // Remove super-triangle triangles; keep those with ghost points (close cells)
  const finalTris = tris.filter(([a, b, c]) => a < N && b < N && c < N);
  return { tris: finalTris, pts };
}

// ─── Voronoi cell from Delaunay ───────────────────────────────────────────────
function voronoiCell(siteIdx: number, tris: Tri[], pts: Pt[]): Pt[] {
  const surrounding = tris.filter(([a, b, c]) => a === siteIdx || b === siteIdx || c === siteIdx);
  if (surrounding.length < 2) return [];
  const site = pts[siteIdx];
  const centers = surrounding.map(([a, b, c]) => {
    const { cx, cy } = circumcircle(pts, a, b, c);
    return { x: cx, y: cy };
  });
  centers.sort((p, q) =>
    Math.atan2(p.y - site.y, p.x - site.x) - Math.atan2(q.y - site.y, q.x - site.x),
  );
  return clipPolygon(centers, 0, 0, 1, 1);
}

// ─── Adjacency from Delaunay ─────────────────────────────────────────────────
function getAdjacency(tris: Tri[], n: number): Set<number>[] {
  const adj = Array.from({ length: n }, () => new Set<number>());
  for (const [a, b, c] of tris) {
    const real = [a, b, c].filter(v => v < n);
    for (let i = 0; i < real.length; i++) {
      for (let j = i + 1; j < real.length; j++) {
        adj[real[i]].add(real[j]);
        adj[real[j]].add(real[i]);
      }
    }
  }
  return adj;
}

// ─── Site generation (grid jitter for good distribution) ─────────────────────
function generateSites(rng: LcgRng, n: number): Pt[] {
  const margin = 0.06;
  const w = 1 - 2 * margin;
  const cols = Math.ceil(Math.sqrt(n * 1.3));
  const rows = Math.ceil(n / cols) + 1;
  const cw = w / cols, ch = w / rows;

  const candidates: Pt[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      candidates.push({
        x: margin + c * cw + rng.range(cw * 0.1, cw * 0.9),
        y: margin + r * ch + rng.range(ch * 0.1, ch * 0.9),
      });
    }
  }
  return rng.shuffle(candidates).slice(0, n);
}

// ─── Zone content pools ───────────────────────────────────────────────────────
const NAME_POOLS: Record<ZoneType, string[]> = {
  residential: ['Colonia del Valle', 'Jardines del Sol', 'Barrio Antiguo', 'Los Pinos', 'Fraccionamiento Las Palmas', 'San Antonio', 'Lomas del Sur', 'El Mirador', 'Colonia Obrera', 'Los Álamos'],
  commercial:  ['Mercado Central', 'Plaza Comercial', 'Zona Bancaria', 'Avenida Principal', 'Corredor Comercial', 'Centro Histórico', 'La Feria', 'Pasaje Morelos', 'Galería del Sur'],
  industrial:  ['Zona Industrial Norte', 'Planta Química', 'Bodega Municipal', 'Parque Industrial', 'Talleres del Sur', 'Refinería Abandonada', 'Depósito de Gas', 'Zona Fabril'],
  medical:     ['Hospital Regional', 'Clínica del IMSS', 'Centro de Salud', 'Sanatorio Civil', 'Cruz Roja Municipal', 'Laboratorio Central'],
  military:    ['Cuartel Militar', 'Base de la GN', 'Depósito Federal', 'Zona Restringida', 'Instalación Clasificada', 'Puesto de Mando'],
  wild:        ['Parque Ecológico', 'Cerro del Muerto', 'Barranca Seca', 'Reserva Natural', 'Bosque Municipal', 'Terreno Baldío', 'Lotes Yermos'],
};

const DESC_POOLS: Record<ZoneType, string[]> = {
  residential: [
    'Casas abandonadas, jardines secos. Pocos zombis, pocos recursos.',
    'Una colonia que alguna vez fue tranquila. Los que quedaron no son amigables.',
    'Fraccionamiento amurallado. Las bardas aún aguantan. Los vecinos, no.',
    'Calles residenciales cubiertas de ceniza. Algo ardió aquí hace poco.',
  ],
  commercial: [
    'Tiendas saqueadas, vitrinas rotas. Hay artículos básicos si miras bien.',
    'Centro comercial vacío. Sus pasillos oscuros guardan sorpresas.',
    'Zona de negocios. Las cajas fuertes aún no han sido abiertas.',
    'Mercado al aire libre. El olor es insoportable. Los recursos también atraen zombis.',
  ],
  industrial: [
    'Maquinaria oxidada, materiales de construcción. Peligroso pero rico en recursos.',
    'Planta industrial abandonada. Los tanques de químicos son una amenaza constante.',
    'Bodega inmensa. Lo que hay aquí vale el riesgo.',
    'Zona fabril. Las naves oscuras son terreno de los muertos.',
  ],
  medical: [
    'El hospital aún tiene suministros médicos. También tiene infestación.',
    'Clínica semiintacta. Los antibióticos son el premio aquí.',
    'Centro de salud improvisado. Alguien dejó medicamentos cuando huyó.',
    'Instalación médica militarizada. Algo salió mal aquí primero.',
  ],
  military: [
    'Zona militarizada. Las armas que quedaron valen el riesgo de entrar.',
    'Puesto de control abandonado. Hay equipo, pero también hay hordas.',
    'Base comprometida hace días. El perímetro cedió.',
    'Instalación gubernamental. Lo que hay aquí es valioso y peligroso.',
  ],
  wild: [
    'Vegetación densa. Los muertos se camuflan entre los arbustos.',
    'Terreno abierto. Fácil de cruzar, difícil de esconderse.',
    'Parque solitario. La naturaleza ya está reclamando lo suyo.',
    'Zona rural al límite de la ciudad. El silencio no es tranquilizador.',
  ],
};

const LORE_POOLS: Record<ZoneType, string[]> = {
  residential: [
    'Una nota en un refrigerador: "Fuimos al estadio. No vengan."',
    'Un perro ladra a lo lejos. O algo que fue un perro.',
    'Fotografías familiares cubiertas de polvo en la sala.',
    'Ropa de niño tirada en el jardín delantero.',
  ],
  commercial: [
    'Las cajas registradoras abiertas. Alguien tomó el dinero primero.',
    '"CERRADO INDEFINIDAMENTE" — el cartel cuelga torcido.',
    'Un carrito del súper volcado bloquea la entrada principal.',
    'Estantes vacíos. Alguien fue muy organizado al saquear esto.',
  ],
  industrial: [
    'En la entrada alguien pintó: "NO ENTRAR — ELLOS SIGUEN AQUÍ".',
    'Un libro de registros muestra el último turno laborado.',
    'Cascos y guantes tirados como si los trabajadores huyeron en pánico.',
    'Una alarma de seguridad suena a intervalos irregulares.',
  ],
  medical: [
    'Una pizarra blanca con un mensaje incompleto: "El protocolo falló—"',
    'Camillas volcadas en los pasillos. Las huellas van hacia adentro.',
    'Frascos de medicamentos rotos cubren el suelo de farmacia.',
    'Archivos clínicos esparcidos. Alguien buscaba algo específico.',
  ],
  military: [
    'Casquillos dispersos en la entrada. El último turno de guardia no sobrevivió.',
    'Un manual de operaciones con la sección "protocolo Z" marcada en rojo.',
    'Radio encendida con estática. Alguien intenta transmitir desde algún lugar.',
    'Vehículos militares abandonados con las llaves puestas.',
  ],
  wild: [
    'Nidos de cuervos en los árboles. No les molesta lo que hay abajo.',
    'Una fogata apagada. Alguien estuvo aquí hace menos de 48 horas.',
    'Huellas en el barro que se adentran en el bosque y no regresan.',
    'El silencio aquí es diferente al de la ciudad. Más antiguo.',
  ],
};

const START_DESC: Record<ZoneType, string> = {
  residential: 'Despiertas en una casa abandonada. El vecindario está tranquilo... demasiado tranquilo.',
  commercial:  'Te refugiaste en una tienda cerrada. Hay recursos, pero el ruido atrae a los muertos.',
  industrial:  'Una bodega como escondite temporal. Hay materiales, pero también sombras que se mueven.',
  medical:     'Un hospital como punto de inicio. Hay medicamentos, pero el peligro es alto.',
  military:    'Una instalación militar comprometida. Alta protección... si puedes mantenerla.',
  wild:        'Las afueras de la ciudad. El camino hasta los recursos es largo y peligroso.',
};

// ─── Type assignment by distance from center ──────────────────────────────────
function assignType(pos: Pt, rng: LcgRng): ZoneType {
  const d = Math.sqrt((pos.x - 0.5) ** 2 + (pos.y - 0.5) ** 2);
  if (d < 0.12) return rng.pick(['commercial', 'commercial', 'medical'] as ZoneType[]);
  if (d < 0.25) return rng.pick(['commercial', 'residential', 'medical'] as ZoneType[]);
  if (d < 0.38) return rng.pick(['residential', 'residential', 'commercial'] as ZoneType[]);
  if (d < 0.52) return rng.pick(['residential', 'industrial'] as ZoneType[]);
  return rng.pick(['industrial', 'military', 'wild'] as ZoneType[]);
}

// ─── Stats by type ────────────────────────────────────────────────────────────
interface ZoneStats {
  danger: number;
  noise: number;
  loot: { abundance: number; quality: LootQuality; depleted: number };
}
function assignStats(type: ZoneType, rng: LcgRng): ZoneStats {
  const base: Record<ZoneType, [number, number, number, LootQuality]> = {
    //                           danger noise  abundance  quality
    residential: [3, 2, 4, 'low'],
    commercial:  [5, 4, 6, 'medium'],
    industrial:  [6, 5, 7, 'medium'],
    medical:     [7, 3, 8, 'high'],
    military:    [8, 4, 7, 'rare'],
    wild:        [4, 2, 3, 'low'],
  };
  const [d, n, a, q] = base[type];
  return {
    danger: Math.max(1, Math.min(10, d + rng.int(-1, 1))),
    noise:  Math.max(0, Math.min(10, n + rng.int(-1, 1))),
    loot: { abundance: Math.max(1, a + rng.int(-1, 1)), quality: q, depleted: 0 },
  };
}

// ─── Travel cost from Euclidean distance ──────────────────────────────────────
function calcTravelCost(a: Pt, b: Pt): number {
  // Account for typical landscape aspect ratio (width > height)
  const dx = (a.x - b.x) * 1.3;
  const dy = a.y - b.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  return Math.max(15, Math.min(90, Math.round(dist * 110)));
}

// ─── Pick unique name from pool ───────────────────────────────────────────────
function pickUnique(pool: string[], used: Set<string>, rng: LcgRng): string {
  const available = pool.filter(n => !used.has(n));
  const name = available.length > 0 ? rng.pick(available) : `${rng.pick(pool)} Sur`;
  used.add(name);
  return name;
}

// ─── Main generator ───────────────────────────────────────────────────────────
export function generateMap(seed: number, zoneCount = 18): ZoneStateDef[] {
  const rng = new LcgRng(seed);

  // 1. Generate well-distributed sites
  const sites = generateSites(rng, zoneCount);

  // 2. Delaunay triangulation (with ghost points to close boundary cells)
  const { tris, pts } = delaunay(sites);

  // 3. Voronoi cells (clipped to [0,1]²)
  const polygons = sites.map((_, i) => voronoiCell(i, tris, pts));

  // 4. Adjacency graph from Delaunay
  const adj = getAdjacency(tris, sites.length);

  // 5. Assign types (center-outward for predictable layout)
  const types: ZoneType[] = sites.map(pos => assignType(pos, rng));

  // 6. Ensure minimum representation of key types
  const counts = types.reduce((acc, t) => ({ ...acc, [t]: (acc[t] ?? 0) + 1 }), {} as Record<string, number>);
  for (const required of ['medical', 'military', 'wild'] as ZoneType[]) {
    if (!counts[required]) {
      // Replace a peripheral industrial/residential zone
      const periphery = sites
        .map((pos, i) => ({ i, d: (pos.x - 0.5) ** 2 + (pos.y - 0.5) ** 2 }))
        .filter(({ i }) => types[i] === 'industrial' || types[i] === 'residential')
        .sort((a, b) => b.d - a.d);
      if (periphery.length > 0) {
        types[periphery[0].i] = required;
      }
    }
  }

  // 7. Build zone definitions
  const usedNames = new Set<string>();
  const zones: ZoneStateDef[] = sites.map((pos, i) => {
    const type = types[i];
    const stats = assignStats(type, rng);
    return {
      id: `zone_${i}`,
      name: pickUnique(NAME_POOLS[type], usedNames, rng),
      type,
      position: pos,
      polygon: polygons[i],
      connections: [...adj[i]].map(j => `zone_${j}`),
      travelCost: Object.fromEntries([...adj[i]].map(j => [`zone_${j}`, calcTravelCost(pos, sites[j])])),
      ...stats,
      fog: 'unknown' as const,
      description: rng.pick(DESC_POOLS[type]),
      lore: rng.chance(0.7) ? [rng.pick(LORE_POOLS[type])] : [],
      canStart: false,
      startDescription: undefined,
    };
  });

  // 8. Designate start zone (safest residential/commercial near center)
  const startCandidates = zones
    .filter(z => z.type === 'residential' || z.type === 'commercial')
    .sort((a, b) => {
      const da = (a.position.x - 0.5) ** 2 + (a.position.y - 0.5) ** 2;
      const db = (b.position.x - 0.5) ** 2 + (b.position.y - 0.5) ** 2;
      return a.danger - b.danger + (da - db) * 5;
    });

  const startZone = startCandidates[0] ?? zones[0];
  const si = zones.findIndex(z => z.id === startZone.id);
  zones[si] = { ...zones[si], canStart: true, startDescription: START_DESC[zones[si].type] };

  return zones;
}
