<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Application } from 'pixi.js';
  import { StrategicView } from '../../render/StrategicView';
  import { generateMap } from '../../engine/world/ProceduralMapGen';
  import type { ZoneStateDef } from '../../engine/data/zones';
  import { uiStore } from '../../stores/uiStore';
  import { gameStore } from '../../stores/gameStore';

  const TYPE_LABEL: Record<string, string> = {
    residential: 'Residencial', commercial: 'Comercial', industrial: 'Industrial',
    medical: 'Médico', military: 'Militar', wild: 'Natural',
  };
  const DANGER_LABEL = ['', 'Mínimo', 'Bajo', 'Bajo', 'Moderado', 'Moderado', 'Alto', 'Alto', 'Extremo', 'Extremo', 'Letal'];
  const DANGER_COLOR = ['', '#4a8a4a', '#5a8a4a', '#7a9a4a', '#4a8fb5', '#4a8fb5', '#c97a30', '#c97a30', '#aa4444', '#aa4444', '#7a1f1f'];

  // Generate a map preview with a random seed on load
  const previewSeed = Math.floor(Math.random() * 2_147_483_647);
  let allZones = $state<ZoneStateDef[]>([]);
  let startableZones = $state<ZoneStateDef[]>([]);
  let selectedId = $state<string>('');
  let selectedZone = $derived(startableZones.find(z => z.id === selectedId) ?? startableZones[0]);

  let canvasEl: HTMLDivElement;
  let app: Application | null = null;
  let view: StrategicView | null = null;

  function redraw() {
    if (!view || !allZones.length) return;
    const zones = allZones.map(z => ({ ...z, fog: 'explored' as const }));
    const startableIds = new Set(startableZones.map(z => z.id));
    view.render(zones, '', selectedId, id => { selectedId = id; }, true, startableIds);
  }

  onMount(async () => {
    allZones = generateMap(previewSeed);
    startableZones = allZones.filter(z => z.canStart);
    selectedId = startableZones[0]?.id ?? '';

    app = new Application();
    await app.init({
      resizeTo: canvasEl,
      backgroundColor: 0x0d0d0c,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });
    canvasEl.appendChild(app.canvas);
    view = new StrategicView(app);
    redraw();
  });

  onDestroy(() => {
    view?.destroy();
  });

  $effect(() => {
    selectedId;
    redraw();
  });

  function startGame() {
    gameStore.newGame(previewSeed, selectedId);
    uiStore.setScreen('game');
  }
</script>

<div class="select-area">
  <div class="select-area__map" bind:this={canvasEl}></div>

  <aside class="select-area__panel">
    <div class="select-area__header">
      <h2 class="select-area__title">¿Dónde despiertas?</h2>
      <p class="select-area__sub">Elige tu zona de inicio</p>
    </div>

    <div class="select-area__list">
      {#each startableZones as zone}
        <button
          class="zone-card"
          class:zone-card--active={selectedId === zone.id}
          onclick={() => (selectedId = zone.id)}
        >
          <div class="zone-card__header">
            <span class="zone-card__name">{zone.name}</span>
            <span class="zone-card__type">{TYPE_LABEL[zone.type]}</span>
          </div>
          <p class="zone-card__desc">{zone.startDescription}</p>
          <div class="zone-card__stats">
            <span class="zone-card__danger" style="color:{DANGER_COLOR[zone.danger]}">
              ● {DANGER_LABEL[zone.danger]}
            </span>
            <span class="zone-card__loot">Botín: {zone.loot.quality}</span>
          </div>
        </button>
      {/each}
    </div>

    {#if selectedZone}
      <div class="select-area__confirm">
        <div class="select-area__selected-info">
          <span class="select-area__selected-name">{selectedZone.name}</span>
          <span class="select-area__selected-meta">
            Peligro {selectedZone.danger}/10 · {TYPE_LABEL[selectedZone.type]}
          </span>
        </div>
        <button class="select-area__start-btn" onclick={startGame}>
          Comenzar aquí
        </button>
      </div>
    {/if}
  </aside>
</div>

<style>
  .select-area {
    height: 100%;
    display: flex;
    background: var(--color-bg);
    color: var(--color-text);
    font-family: var(--font-ui);
    overflow: hidden;
  }

  .select-area__map {
    flex: 1;
    position: relative;
    overflow: hidden;
  }

  .select-area__panel {
    width: 300px;
    border-left: 1px solid var(--color-border);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    flex-shrink: 0;
    background: var(--color-surface);
  }

  .select-area__header {
    padding: 1.25rem 1rem 0.75rem;
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
  }

  .select-area__title {
    font-size: 1.3rem;
    font-weight: 700;
    color: var(--color-hope);
    letter-spacing: 0.08em;
    margin: 0 0 0.2rem;
  }

  .select-area__sub {
    font-size: 0.82rem;
    letter-spacing: 0.1em;
    opacity: 0.5;
    margin: 0;
    text-transform: uppercase;
  }

  .select-area__list {
    flex: 1;
    overflow-y: auto;
    padding: 0.6rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    scrollbar-width: thin;
    scrollbar-color: var(--color-border) transparent;
  }

  .zone-card {
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    padding: 0.7rem 0.8rem;
    text-align: left;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s;
    font-family: var(--font-ui);
    color: var(--color-text);
    width: 100%;
  }

  .zone-card:hover { border-color: #2e4460; background: #111820; }
  .zone-card--active { border-color: var(--color-hope); background: #101c28; }

  .zone-card__header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 0.3rem;
  }

  .zone-card__name {
    font-size: 1.0rem;
    font-weight: 700;
    color: var(--color-hope);
    letter-spacing: 0.04em;
  }

  .zone-card__type {
    font-size: 0.75rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    opacity: 0.45;
  }

  .zone-card__desc {
    font-family: var(--font-narrative);
    font-size: 0.9rem;
    line-height: 1.45;
    opacity: 0.7;
    margin: 0 0 0.4rem;
  }

  .zone-card__stats {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .zone-card__danger { font-size: 0.8rem; letter-spacing: 0.06em; }
  .zone-card__loot { font-size: 0.78rem; letter-spacing: 0.06em; opacity: 0.5; text-transform: uppercase; }

  .select-area__confirm {
    padding: 0.75rem 1rem;
    border-top: 1px solid var(--color-border);
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    flex-shrink: 0;
  }

  .select-area__selected-info { display: flex; flex-direction: column; }

  .select-area__selected-name {
    font-size: 1.0rem;
    font-weight: 700;
    color: var(--color-hope);
  }

  .select-area__selected-meta {
    font-size: 0.8rem;
    opacity: 0.5;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-top: 0.1rem;
  }

  .select-area__start-btn {
    width: 100%;
    padding: 0.75rem;
    background: var(--color-hope);
    border: none;
    color: var(--color-bg);
    font-family: var(--font-ui);
    font-size: 1.0rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    cursor: pointer;
    transition: opacity 0.15s;
  }

  .select-area__start-btn:hover { opacity: 0.85; }

  @media (max-width: 640px) {
    .select-area { flex-direction: column; }
    .select-area__map { flex: none; height: 42svh; }
    .select-area__panel {
      width: 100%;
      border-left: none;
      border-top: 1px solid var(--color-border);
      flex: 1;
      min-height: 0;
    }
    .select-area__list {
      flex-direction: row;
      flex-wrap: nowrap;
      overflow-x: auto;
      overflow-y: hidden;
      padding: 0.5rem;
    }
    .zone-card { min-width: 200px; flex-shrink: 0; }
  }
</style>
