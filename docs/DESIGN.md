# Proyecto: Survival Horror Narrativo (Zombies)

> Documento de diseño técnico para implementación con Claude Code.
> Objetivo: juego web estático desplegable en GitHub Pages, robusto, con vista híbrida (mapa estratégico + táctica por zona), narrativa ramificada, y sistemas profundos de supervivencia.

---

## 1. Visión del proyecto

### 1.1 Pitch
Un superviviente despierta en una ciudad colapsada tras un brote zombi. El jugador navega un **mapa estratégico** de la ciudad por zonas (barrios, edificios clave, rutas) decidiendo a dónde ir, y al entrar a una zona se abre una **vista táctica** por turnos donde explora, busca recursos, evade o combate, y encuentra eventos narrativos. El tiempo avanza, los recursos escasean, los NPCs tienen sus propias historias, y cada decisión cuenta.

### 1.2 Tono
- **Survival horror clásico**: escasez de recursos, miedo a la noche, decisiones difíciles, muerte permanente opcional.
- **Narrativo**: eventos ramificados, supervivientes con personalidad, consecuencias persistentes, finales múltiples.

### 1.3 Principios de diseño
1. **Cada decisión tiene costo**: tiempo, recursos, ruido, exposición.
2. **Información imperfecta**: niebla de guerra, rumores no confirmados, NPCs que mienten.
3. **Persistencia**: lo que haces queda. Si dejas a alguien morir, se queda muerto.
4. **Sistemas que se cruzan**: hambre afecta moral, moral afecta combate, combate hace ruido, ruido atrae zombis.

---

## 2. Stack técnico

| Capa | Tecnología | Por qué |
|---|---|---|
| Build / dev | **Vite** | HMR, build optimizado, deploy directo a Pages |
| UI / componentes | **Svelte 5** (o React 18) | Reactividad limpia para paneles, fichas, logs |
| Renderizado de mapa | **PixiJS v8** | WebGL, sprites, niebla de guerra, performance |
| Lógica de juego | **rot.js** | FOV, pathfinding A*, RNG con seed, scheduler de turnos |
| Narrativa | **inkjs** (runtime de Ink) | Eventos ramificados, variables persistentes |
| Persistencia | **Dexie.js** (IndexedDB) | Saves robustos, múltiples partidas |
| Compresión saves | **lz-string** | Exportar/importar saves como código |
| Estilos | **CSS modules** + **Tailwind** (opcional) | Estética survival horror custom |
| Tipado | **TypeScript** | Imprescindible para un proyecto de este tamaño |
| Testing | **Vitest** | Tests de lógica del motor (combate, RNG, eventos) |
| Linting | **ESLint** + **Prettier** | Calidad de código |
| CI/CD | **GitHub Actions** | Build + deploy automático a Pages |

**Por qué Svelte sobre React**: menos boilerplate, stores reactivos perfectos para estado global del juego, bundle más pequeño. Si prefieres React, todo el diseño aplica igual cambiando `$store` por `useStore()`.

---

## 3. Arquitectura general

```
┌─────────────────────────────────────────────────────────┐
│                    UI Layer (Svelte)                     │
│  Inventario | Fichas NPC | Diálogos | Logs | HUD | Menús │
└────────────────────┬────────────────────────────────────┘
                     │ stores reactivos
┌────────────────────▼────────────────────────────────────┐
│                  Game State (stores)                     │
│  worldStore | playerStore | timeStore | logStore | ...  │
└────────────────────┬────────────────────────────────────┘
                     │ acciones
┌────────────────────▼────────────────────────────────────┐
│                  Game Engine (core)                      │
│  TurnManager | EventBus | RNG | Scheduler | RuleEngine  │
└──────┬──────────────┬──────────────┬───────────────────┘
       │              │              │
┌──────▼────┐  ┌──────▼─────┐  ┌─────▼────────┐
│  Mapa     │  │  Narrativa │  │  Persistencia│
│  (Pixi)   │  │  (Ink)     │  │  (Dexie)     │
└───────────┘  └────────────┘  └──────────────┘
```

**Patrón clave**: el motor es **headless** (no sabe de UI). La UI solo lee stores y dispara acciones. Esto permite testear toda la lógica sin renderizar nada.

---

## 4. Estructura del repositorio

```
proyecto-zombies/
├── .github/
│   └── workflows/
│       └── deploy.yml              # CI/CD a GitHub Pages
├── public/
│   ├── assets/
│   │   ├── tiles/                  # Tilesets del mapa
│   │   ├── sprites/                # Sprites de personajes/zombies
│   │   ├── ui/                     # Iconos, marcos, decoración
│   │   ├── audio/                  # SFX y música ambiente
│   │   └── maps/                   # Imágenes de mapa estratégico
│   └── favicon.ico
├── src/
│   ├── main.ts                     # Entry point
│   ├── App.svelte                  # Componente raíz
│   ├── engine/                     # MOTOR (headless, testeable)
│   │   ├── core/
│   │   │   ├── EventBus.ts         # Pub/sub interno
│   │   │   ├── RNG.ts              # Wrapper de rot.js RNG con seed
│   │   │   ├── TurnManager.ts      # Cola de turnos, prioridades
│   │   │   ├── TimeSystem.ts       # Días, horas, día/noche
│   │   │   └── Logger.ts           # Log narrativo del juego
│   │   ├── world/
│   │   │   ├── Zone.ts             # Definición de zona
│   │   │   ├── ZoneMap.ts          # Mapa táctico de una zona (grid)
│   │   │   ├── StrategicMap.ts     # Mapa estratégico de la ciudad
│   │   │   ├── FogOfWar.ts         # Visibilidad descubierta
│   │   │   └── Travel.ts           # Costo de viaje entre zonas
│   │   ├── entities/
│   │   │   ├── Entity.ts           # Base
│   │   │   ├── Player.ts
│   │   │   ├── NPC.ts              # Supervivientes
│   │   │   ├── Zombie.ts
│   │   │   └── factories/          # Generadores de entidades
│   │   ├── systems/
│   │   │   ├── CombatSystem.ts     # Resolución de combate por turnos
│   │   │   ├── InventorySystem.ts  # Items, peso, equipamiento
│   │   │   ├── NeedsSystem.ts      # Hambre, sed, sueño, salud
│   │   │   ├── MoraleSystem.ts     # Moral del grupo
│   │   │   ├── NoiseSystem.ts      # Propagación de ruido
│   │   │   ├── ScavengeSystem.ts   # Búsqueda de recursos
│   │   │   ├── BaseSystem.ts       # Mejoras del refugio
│   │   │   └── AISystem.ts         # Comportamiento de zombis/NPCs
│   │   ├── narrative/
│   │   │   ├── EventEngine.ts      # Triggers de eventos
│   │   │   ├── InkRunner.ts        # Wrapper de inkjs
│   │   │   └── ChoiceResolver.ts   # Aplica consecuencias
│   │   └── data/                   # CONTENIDO del juego (JSON/TS)
│   │       ├── items.ts            # Catálogo de items
│   │       ├── zombies.ts          # Tipos de zombis (bestiario)
│   │       ├── zones.ts            # Definiciones de zonas
│   │       ├── npcs.ts             # NPCs predefinidos
│   │       ├── recipes.ts          # Crafting
│   │       └── ink/                # Archivos .ink compilados
│   │           ├── events/         # Eventos aleatorios
│   │           ├── characters/     # Diálogos de NPCs
│   │           └── main.ink        # Hilo narrativo principal
│   ├── stores/                     # Estado reactivo (Svelte stores)
│   │   ├── gameStore.ts            # Estado global del juego
│   │   ├── playerStore.ts
│   │   ├── worldStore.ts
│   │   ├── timeStore.ts
│   │   ├── logStore.ts
│   │   └── uiStore.ts              # Modales, pantallas activas
│   ├── render/                     # Capa de renderizado (PixiJS)
│   │   ├── PixiApp.ts              # Setup de Pixi
│   │   ├── StrategicView.ts        # Renderiza mapa estratégico
│   │   ├── TacticalView.ts         # Renderiza mapa táctico
│   │   ├── FogRenderer.ts
│   │   └── sprites/                # Sprite managers
│   ├── ui/                         # Componentes Svelte
│   │   ├── screens/
│   │   │   ├── MainMenu.svelte
│   │   │   ├── StrategicScreen.svelte
│   │   │   ├── TacticalScreen.svelte
│   │   │   ├── BaseScreen.svelte
│   │   │   ├── CombatScreen.svelte
│   │   │   └── GameOver.svelte
│   │   ├── panels/
│   │   │   ├── InventoryPanel.svelte
│   │   │   ├── NPCSheet.svelte
│   │   │   ├── BestiaryPanel.svelte
│   │   │   ├── JournalPanel.svelte
│   │   │   └── LogPanel.svelte
│   │   ├── widgets/
│   │   │   ├── ResourceBar.svelte
│   │   │   ├── TimeIndicator.svelte
│   │   │   ├── DiceRoll.svelte
│   │   │   └── ChoiceButton.svelte
│   │   └── modals/
│   │       ├── EventModal.svelte
│   │       └── SaveLoadModal.svelte
│   ├── persistence/
│   │   ├── db.ts                   # Setup de Dexie
│   │   ├── SaveManager.ts          # Guardar/cargar partidas
│   │   ├── Serializer.ts           # Serializar estado completo
│   │   └── migrations.ts           # Migración de saves entre versiones
│   ├── styles/
│   │   ├── global.css
│   │   ├── theme.css               # Variables CSS
│   │   └── fonts.css
│   └── utils/
│       ├── math.ts
│       ├── format.ts
│       └── debug.ts
├── tests/
│   ├── engine/
│   │   ├── combat.test.ts
│   │   ├── needs.test.ts
│   │   ├── rng.test.ts
│   │   └── fog.test.ts
│   └── narrative/
│       └── eventEngine.test.ts
├── docs/
│   ├── DESIGN.md                   # Este documento
│   ├── CONTENT-GUIDE.md            # Cómo añadir items/zombis/eventos
│   ├── INK-SCRIPTING.md            # Guía de escritura narrativa
│   └── ARCHITECTURE.md             # Diagramas técnicos
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── svelte.config.js
├── tailwind.config.js
├── .eslintrc.json
├── .prettierrc
├── .gitignore
└── README.md
```

---

## 5. Modelo de datos

### 5.1 Estado global del juego

```typescript
interface GameState {
  meta: {
    version: string;              // Versión del juego
    seed: string;                 // Seed del RNG (reproducibilidad)
    startedAt: number;            // Timestamp del inicio
    playtime: number;             // Segundos jugados
    difficulty: 'easy' | 'normal' | 'hard' | 'iron';
    permadeath: boolean;
  };
  time: {
    day: number;                  // Día desde el inicio
    hour: number;                 // 0-23
    minute: number;               // 0-59
    phase: 'dawn' | 'day' | 'dusk' | 'night';
  };
  player: PlayerState;
  world: WorldState;
  npcs: Record<string, NPCState>;
  base: BaseState;
  narrative: {
    flags: Record<string, boolean | number | string>;  // Flags de Ink
    completedEvents: string[];
    activeQuests: Quest[];
    knownRumors: Rumor[];
  };
  log: LogEntry[];                // Últimos N eventos para UI
  rng: {
    state: string;                // Estado del RNG para save/load
  };
}
```

### 5.2 Jugador

```typescript
interface PlayerState {
  name: string;
  portrait: string;
  position: {
    zoneId: string;               // En qué zona está
    x: number; y: number;         // Posición táctica si está en zona
    mode: 'strategic' | 'tactical' | 'base';
  };
  stats: {
    health: number; maxHealth: number;
    stamina: number; maxStamina: number;
    hunger: number;               // 0-100, 100 = lleno
    thirst: number;
    fatigue: number;
    infection: number;            // 0-100, si llega a 100 = zombi
    morale: number;
  };
  skills: {
    melee: number;                // 0-10
    ranged: number;
    stealth: number;
    scavenge: number;
    medicine: number;
    crafting: number;
    persuasion: number;
  };
  inventory: InventorySlot[];
  equipment: {
    weapon: Item | null;
    armor: Item | null;
    accessory: Item | null;
  };
  conditions: Condition[];        // Heridas, infecciones, buffs
  journal: JournalEntry[];        // Notas del jugador (estilo Señal Muerta)
}
```

### 5.3 Mundo

```typescript
interface WorldState {
  cityName: string;
  zones: Record<string, ZoneState>;
  currentZoneId: string;
  fogOfWar: Record<string, FogLevel>;  // zoneId -> nivel de conocimiento
  weather: 'clear' | 'rain' | 'storm' | 'fog';
  globalThreat: number;           // 0-100, escala el peligro general
}

type FogLevel = 'unknown' | 'rumored' | 'scouted' | 'explored';

interface ZoneState {
  id: string;
  name: string;
  type: 'residential' | 'commercial' | 'industrial' | 'medical' | 'military' | 'wild';
  position: { x: number; y: number };  // En el mapa estratégico
  connections: string[];          // IDs de zonas conectadas
  travelCost: Record<string, number>;  // Tiempo en minutos por conexión
  danger: number;                 // 0-10
  noise: number;                  // 0-10
  loot: {
    abundance: number;            // 0-10
    quality: 'low' | 'medium' | 'high' | 'rare';
    depleted: number;             // Cuánto se ha saqueado
  };
  zombies: ZombieSpawn[];         // Tipos y cantidades
  npcs: string[];                 // IDs de NPCs presentes
  tacticalMap: {
    width: number; height: number;
    tiles: Tile[][];              // Grid táctico
    pointsOfInterest: POI[];
  };
  description: string;
  lore: string[];                 // Lore que se descubre explorando
}
```

### 5.4 NPC

```typescript
interface NPCState {
  id: string;
  name: string;
  portrait: string;
  background: string;
  personality: {
    traits: string[];             // 'loyal', 'paranoid', 'pragmatic', etc.
    quirks: string[];
  };
  stats: PlayerState['stats'];    // Misma estructura
  skills: PlayerState['skills'];
  inventory: InventorySlot[];
  relationship: number;           // -100 a 100 con el jugador
  status: 'alive' | 'wounded' | 'dying' | 'dead' | 'zombified' | 'missing';
  location: { zoneId: string | null };  // null si está contigo
  joinedAt: number | null;        // Día en que se unió al grupo
  inkKnot: string;                // Punto de entrada en Ink para sus diálogos
  history: NPCEvent[];            // Cosas que han pasado con este NPC
}
```

### 5.5 Items

```typescript
interface Item {
  id: string;
  name: string;
  description: string;
  category: 'weapon' | 'armor' | 'food' | 'medicine' | 'tool' | 'material' | 'key' | 'misc';
  weight: number;
  stackable: boolean;
  maxStack: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'unique';
  // Específicos según categoría:
  weaponStats?: { damage: number; noise: number; durability: number; range: 'melee' | 'short' | 'long'; ammo?: string };
  foodStats?: { hunger: number; thirst: number; spoilage: number };
  medicineStats?: { healing: number; infectionCure: number; sideEffects?: string[] };
}
```

### 5.6 Zombis (bestiario)

```typescript
interface ZombieType {
  id: string;
  name: string;
  description: string;
  stats: {
    health: number;
    damage: number;
    speed: number;                // Acciones por turno
    sight: number;                // Rango de visión
    hearing: number;              // Rango de oído
    armor: number;
  };
  behaviors: {
    aggression: 'passive' | 'reactive' | 'aggressive' | 'hunting';
    pack: boolean;                // Se mueve en grupo
    nocturnal: boolean;
    special: string[];            // 'climber', 'screamer', 'spitter', etc.
  };
  loot: LootTable;
  sprite: string;
  sound: string;
}
```

---

## 6. Sistemas

### 6.1 Sistema de turnos

**Diseño**: scheduler por puntos de acción. Cada acción cuesta tiempo en minutos. El jugador actúa, el mundo avanza.

```typescript
class TurnManager {
  schedule(entity: Entity, delay: number): void;
  next(): Entity;                 // Siguiente entidad en actuar
  advance(minutes: number): void; // Avanza el reloj global
}
```

**Acciones típicas y su costo**:
- Moverse 1 tile táctico: 1 min
- Buscar un contenedor: 5-15 min
- Atacar cuerpo a cuerpo: 1 min
- Curar herida: 10 min
- Viajar entre zonas: 15-120 min según distancia
- Descansar: 1 hora bloques
- Construir mejora de base: 2-8 horas

### 6.2 Día/noche

- **Amanecer (5-7)**: visibilidad creciente, zombis nocturnos se retiran
- **Día (7-19)**: visibilidad máxima, NPCs activos, menos zombis en movimiento
- **Crepúsculo (19-21)**: visibilidad cae, riesgo aumenta
- **Noche (21-5)**: visibilidad muy baja, zombis más activos, hordas posibles, mejor para sigilo pero peor para combate

**Reglas**:
- Algunas acciones solo de noche/día (negociar con ciertos NPCs, eventos específicos)
- Dormir avanza tiempo y restaura fatiga, pero la base puede ser atacada
- La luz (linterna, fogata) atrae zombis pero permite ver

### 6.3 Combate

**Por turnos, basado en tiradas con modificadores**:

```
Tirada de ataque = d20 + skill_arma + bonus_situacionales
Defensa zombi = 10 + armor + bonus_situacionales
Si ataque >= defensa: golpe, daño = arma + skill - armor_zombi
```

**Modificadores situacionales**:
- Sigilo previo: +5 al ataque, +daño crítico
- Oscuridad sin luz: -3 al ataque
- Cansancio (fatiga > 70): -2 al ataque
- Herida en brazo: -3 a ataque cuerpo a cuerpo
- Munición baja: posibles fallos
- Ruido del arma: cada arma genera nivel de ruido que atrae más zombis

**Resolución**: cada combate genera un `CombatLog` que la UI muestra en tiempo real con animaciones simples.

### 6.4 Niebla de guerra

**Tres capas**:
1. **Mapa estratégico**: zonas marcadas como `unknown` / `rumored` / `scouted` / `explored`. Solo ves info parcial de zonas no exploradas.
2. **Mapa táctico**: dentro de una zona, las celdas tienen visibilidad `never_seen` / `previously_seen` / `currently_visible`. Las "previamente vistas" muestran terreno pero no entidades (memoria).
3. **FOV**: el campo de visión se calcula con rot.js `FOV.PreciseShadowcasting`. Rango depende de skill, hora del día, clima.

### 6.5 Necesidades

- **Hambre/sed**: bajan cada hora. Bajo 30 = penalizaciones. 0 = empieza a perder salud.
- **Fatiga**: sube con actividad, baja con descanso. >80 = penalizaciones de skills.
- **Infección**: si te muerden, sube. Hay medicinas que la bajan. Si llega a 100, mueres y te conviertes en zombi.
- **Moral**: afecta efectividad. Sube viendo victorias, comida buena, NPCs sanos. Baja con muertes, hambre, desesperanza.

### 6.6 Base/refugio

**Sistema de mejoras**:
- **Barricadas**: defensa pasiva contra ataques nocturnos
- **Almacén**: aumenta capacidad de items
- **Huerto**: produce comida lentamente
- **Banco de trabajo**: permite crafting
- **Enfermería**: cura más rápido, reduce infección
- **Radio**: descubre rumores, eventos a distancia
- **Vigía**: avisa de hordas con antelación

Cada mejora cuesta materiales (madera, metal, tela, electrónica) y tiempo.

### 6.7 Eventos narrativos (Ink)

**Triggers**:
- Por tiempo (día X, hora Y)
- Por ubicación (al entrar a zona Z)
- Por estado (moral < 20, NPC X muerto, flag Y activa)
- Aleatorios con peso (cada turno, dado de eventos)

**Estructura en Ink**:
```ink
=== encuentro_hospital_dia3 ===
{ time.day == 3 && currentZone == "hospital_central" }
Encuentras a una mujer agachada tras un mostrador volcado.
"No te acerques," susurra. "Hay algo en el piso de arriba."

* [Acercarse despacio] -> acercarse
* [Preguntar quién es] -> preguntar
* [Irse en silencio] -> irse

=== acercarse ===
~ player.morale += 5
~ flags.lara_meeting = true
...
```

El runtime de Ink lleva las variables; nuestro código aplica los efectos en el estado del juego cuando Ink emite "tags" (`# +morale 5`, `# meet npc lara`).

### 6.8 Save/load

**Estrategia**:
- Estado completo serializable a JSON
- Comprimido con lz-string
- Guardado en IndexedDB vía Dexie (3 slots + autosave)
- Exportable como string base64 para compartir
- Versionado con migraciones (si cambia el schema, se aplican transformaciones)

```typescript
interface SaveSlot {
  id: string;
  name: string;
  timestamp: number;
  thumbnail: string;              // Resumen del estado
  state: GameState;               // Comprimido
  version: string;
}
```

---

## 7. Plan de implementación por fases

Diseñado para que Claude Code pueda implementarlo incrementalmente, con cada fase **jugable** o **testeable** al terminar.

### Fase 0: Setup (1-2 sesiones)
- [ ] Inicializar repo con Vite + Svelte + TS
- [ ] Instalar dependencias (pixi.js, rot-js, inkjs, dexie, lz-string)
- [ ] Configurar ESLint + Prettier + Vitest
- [ ] Configurar GitHub Actions para deploy a Pages
- [ ] Estructura de carpetas según sección 4
- [ ] Pantalla "Hola mundo" funcionando en local y en Pages

### Fase 1: Motor base (3-5 sesiones)
- [ ] `EventBus`, `RNG` (con seed), `Logger`
- [ ] `TurnManager` y `TimeSystem`
- [ ] Stores básicos (`gameStore`, `timeStore`, `logStore`)
- [ ] Pantalla de menú principal + nueva partida
- [ ] Test del motor: que un turno avance correctamente y el tiempo progrese

### Fase 2: Mapa estratégico (3-4 sesiones)
- [ ] `StrategicMap` con zonas y conexiones (data en `zones.ts`)
- [ ] Renderizado con Pixi: zonas como nodos, conexiones como líneas
- [ ] Niebla de guerra a nivel zona
- [ ] Sistema de viaje entre zonas con costo de tiempo
- [ ] UI: panel de info de zona seleccionada, botón "viajar"

### Fase 3: Vista táctica básica (4-6 sesiones)
- [ ] `ZoneMap` con grid de tiles
- [ ] Movimiento del jugador tile a tile
- [ ] FOV con rot.js
- [ ] Niebla de guerra a nivel táctico
- [ ] Renderizado Pixi de la vista táctica
- [ ] Transición fluida estratégico ↔ táctico

### Fase 4: Entidades y necesidades (3-4 sesiones)
- [ ] `Entity`, `Player`, `Zombie` con stats
- [ ] `NeedsSystem` (hambre, sed, fatiga, infección, moral)
- [ ] UI: HUD con barras de necesidades
- [ ] Penalizaciones por necesidades bajas
- [ ] Game over por muerte/infección

### Fase 5: Inventario y items (3-4 sesiones)
- [ ] `InventorySystem` con peso y slots
- [ ] Catálogo inicial de items en `items.ts`
- [ ] UI: `InventoryPanel` con drag/drop, usar, equipar, descartar
- [ ] Recoger items en el mapa táctico
- [ ] Equipamiento (arma, armadura)

### Fase 6: Combate (5-7 sesiones)
- [ ] `CombatSystem` con tiradas y modificadores
- [ ] IA básica de zombis (perseguir si te ven, deambular si no)
- [ ] `NoiseSystem` y propagación
- [ ] `Bestiary` inicial: 4-5 tipos de zombi con comportamientos distintos
- [ ] UI: `CombatScreen` con log de combate, animaciones simples
- [ ] Sigilo y ataques sorpresa

### Fase 7: Saqueo y exploración (3-4 sesiones)
- [ ] `ScavengeSystem` con tablas de loot por tipo de zona
- [ ] Contenedores en el mapa táctico
- [ ] Depleción de zonas (saqueas mucho → menos loot)
- [ ] POIs (puntos de interés) con eventos especiales

### Fase 8: NPCs y diálogos (5-7 sesiones)
- [ ] `NPC` con estados, relaciones, inventario propio
- [ ] Integración de inkjs
- [ ] 3-5 NPCs iniciales con sus historias en Ink
- [ ] UI: `NPCSheet`, `DialogueModal` con choices
- [ ] Sistema de "compañeros" (NPCs que viajan contigo)
- [ ] Muerte/pérdida persistente de NPCs

### Fase 9: Base y crafting (4-5 sesiones)
- [ ] `BaseSystem` con mejoras
- [ ] `Recipes` y crafting
- [ ] UI: `BaseScreen` con vista de la base, mejoras disponibles
- [ ] Eventos de ataque a la base
- [ ] Asignar NPCs a tareas

### Fase 10: Eventos narrativos (4-6 sesiones)
- [ ] `EventEngine` con triggers (tiempo, lugar, estado, aleatorio)
- [ ] 15-25 eventos iniciales en Ink
- [ ] Sistema de rumores
- [ ] Sistema de quests con seguimiento
- [ ] UI: `EventModal`, `JournalPanel`

### Fase 11: Persistencia (2-3 sesiones)
- [ ] `SaveManager` con Dexie
- [ ] Serializador completo del estado
- [ ] UI: `SaveLoadModal` con 3 slots + autosave
- [ ] Export/import de saves como string
- [ ] Sistema de migraciones de saves

### Fase 12: Pulido y contenido (continuo)
- [ ] Sonido (música ambiente, SFX)
- [ ] Animaciones de transición
- [ ] Tutorial integrado
- [ ] Múltiples finales según decisiones
- [ ] Más contenido: zonas, NPCs, eventos, items
- [ ] Balance y dificultad
- [ ] Accesibilidad (atajos de teclado, tamaños de texto)

---

## 8. Estética y dirección de arte

**Paleta sugerida** (survival horror):
- Fondo: `#0f0f0d` (casi negro)
- Texto principal: `#d4d4c8` (hueso desgastado)
- Acento sangre: `#7a1f1f`
- Acento infección: `#5c6e2e` (verde enfermo)
- Acento esperanza: `#c9a961` (ámbar pálido)
- Niebla: `#2a2a28` con `rgba(0,0,0,0.6)`

**Tipografía**:
- UI: una sans-serif condensada (e.g., **Oswald**, **Barlow Condensed**)
- Notas del jugador / diálogos: una serif tipo máquina de escribir (**Special Elite**, **Courier Prime**)
- Títulos: una display rota/grunge (e.g., **Rubik Glitch**, **Nosifer** — usar con moderación)

**Arte de sprites**:
- Pixel art 16x16 o 32x32 para el mapa táctico
- Iconos vectoriales para UI
- Retratos: ilustración estilizada o silueta con paleta limitada

---

## 9. Deploy a GitHub Pages

### `vite.config.ts`
```typescript
export default defineConfig({
  base: '/nombre-del-repo/',     // CRÍTICO para Pages
  build: { outDir: 'dist', assetsDir: 'assets' }
});
```

### `.github/workflows/deploy.yml`
```yaml
name: Deploy to Pages
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/deploy-pages@v4
        id: deployment
```

En el repo: Settings → Pages → Source: "GitHub Actions".

---

## 10. Consideraciones de robustez

1. **Determinismo**: el RNG con seed permite reproducir partidas (útil para debug y bug reports).
2. **Inmutabilidad parcial**: los stores se actualizan con nuevos objetos, no mutación. Facilita undo y debug.
3. **Tests del motor**: toda la lógica sin UI debe tener tests. Combate, FOV, save/load son críticos.
4. **Schema versioning**: cada save guarda su versión; al cargar, se aplican migraciones.
5. **Separación motor/render**: el motor no importa nada de Pixi ni Svelte. Esto permite cambiar el render sin tocar lógica.
6. **Data-driven content**: items, zombis, zonas, eventos viven en archivos de data (JSON/TS/Ink). Añadir contenido nuevo no requiere tocar el motor.
7. **Performance**: usar Pixi para todo lo que sea mapa/sprites (WebGL). Svelte solo para UI estática/reactiva.
8. **Tamaño del bundle**: code-splitting por pantalla. La pantalla táctica no se carga hasta que se usa.

---

## 11. Primer prompt sugerido para Claude Code

Cuando arranques con Claude Code, pásale este documento completo y luego:

> Lee `DESIGN.md`. Vamos a empezar por la **Fase 0** completa: inicializa el proyecto con Vite + Svelte + TypeScript, instala todas las dependencias listadas en la sección 2, crea la estructura de carpetas de la sección 4 (con archivos placeholder donde aplique), configura ESLint, Prettier, Vitest, y el workflow de GitHub Actions de la sección 9. Termina con una pantalla de "Hola mundo" estilizada con la paleta de la sección 8 que sirva como menú principal placeholder. Confirma cada paso antes de seguir al siguiente.

Después, en cada sesión nueva con Claude Code, puedes decir simplemente:

> Continuamos con la Fase X de DESIGN.md.

---

## 12. Apéndice: comandos clave

```bash
# Setup inicial
npm create vite@latest . -- --template svelte-ts
npm install pixi.js rot-js inkjs dexie lz-string
npm install -D vitest @testing-library/svelte eslint prettier

# Desarrollo
npm run dev                  # Servidor local con HMR
npm run test                 # Tests del motor
npm run test:watch           # Tests en modo watch
npm run lint                 # Linter
npm run build                # Build para producción
npm run preview              # Previsualizar el build
```
