<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { get } from 'svelte/store';
  import { Application } from 'pixi.js';
  import { StrategicView } from '../../render/StrategicView';
  import { INITIAL_ZONES, type ZoneStateDef } from '../../engine/data/zones';
  import { uiStore } from '../../stores/uiStore';
  import { gameStore } from '../../stores/gameStore';

  const startableZones: ZoneStateDef[] = INITIAL_ZONES.filter((z) => z.canStart);
  let selectedId = $state<string>(startableZones[0]?.id ?? '');
  let selectedZone = $derived(startableZones.find((z) => z.id === selectedId) ?? startableZones[0]);

  const TYPE_LABEL: Record<string, string> = {
    residential: 'Residencial', commercial: 'Comercial', industrial: 'Industrial',
    medical: 'Médico', military: 'Militar', wild: 'Natural',
  };

  const DANGER_LABEL = ['', 'Mínimo', 'Bajo', 'Bajo', 'Moderado', 'Moderado', 'Alto', 'Alto', 'Extremo', 'Extremo', 'Letal'];
  const DANGER_COLOR = ['', '#4a8a4a', '#5a8a4a', '#7a9a4a', '#c9a961', '#c9a961', '#c97a30', '#c97a30', '#aa4444', '#aa4444', '#7a1f1f'];

  // Mini Pixi map
  let mapContainer: HTMLDivElement;
  let view: StrategicView | null = null;
  const unsubs: (() => void)[] = [];

  onMount(async () => {
    const app = new Application();
    await app.init({ resizeTo: mapContainer, background: 0x0d0d0c, antialias: true });
    mapContainer.appendChild(app.canvas as HTMLCanvasElement);

    // Show all zones fully visible (selectionMode = true)
    const allZones = INITIAL_ZONES.map((z) => ({ ...z, fog: 'explored' as const }));
    view = new StrategicView(app);
    view.render(allZones, '', selectedId, (id) => {
      if (startableZones.find((z) => z.id === id)) selectedId = id;
    }, true);

    const ro = new ResizeObserver(() => redraw());
    ro.observe(mapContainer);
    unsubs.push(() => ro.disconnect());
  });

  function redraw() {
    if (!view) return;
    const allZones = INITIAL_ZONES.map((z) => ({ ...z, fog: 'explored' as const }));
    view.render(allZones, '', selectedId, (id) => {
      if (startableZones.find((z) => z.id === id)) selectedId = id;
    }, true);
  }

  $effect(() => {
    selectedId; // track
    redraw();
  });

  onDestroy(() => {
    unsubs.forEach((fn) => fn());
    view?.destroy();
  });

  function startGame() {
    gameStore.newGame(undefined, selectedId);
    uiStore.setScreen('game');
  }
</script>

<div class="select-area">
  <div class="select-area__map" bind:this={mapContainer}></div>

  <aside class="select-area__panel">
    <div class="select-area__header">
      <h2 class="select-area__title">¿Dónde despiertas?</h2>
      <p class="select-area__sub">Elige tu zona de inicio en Aguascalientes</p>
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

  .select-area__map :global(canvas) { display: block; }

  .select-area__panel {
    width: 300px;
    border-left: 1px solid #222;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    flex-shrink: 0;
  }

  .select-area__header {
    padding: 1.25rem 1rem 0.75rem;
    border-bottom: 1px solid #222;
    flex-shrink: 0;
  }

  .select-area__title {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--color-hope);
    letter-spacing: 0.08em;
    margin: 0 0 0.2rem;
  }

  .select-area__sub {
    font-size: 0.65rem;
    letter-spacing: 0.1em;
    opacity: 0.4;
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
    scrollbar-color: #333 transparent;
  }

  .zone-card {
    background: #111110;
    border: 1px solid #2a2a28;
    padding: 0.7rem 0.8rem;
    text-align: left;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s;
    font-family: var(--font-ui);
    color: var(--color-text);
    width: 100%;
  }

  .zone-card:hover { border-color: #444440; background: #161614; }
  .zone-card--active { border-color: var(--color-hope); background: #1a1810; }

  .zone-card__header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 0.3rem;
  }

  .zone-card__name {
    font-size: 0.88rem;
    font-weight: 700;
    color: var(--color-hope);
    letter-spacing: 0.04em;
  }

  .zone-card--active .zone-card__name { color: var(--color-hope); }

  .zone-card__type {
    font-size: 0.56rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    opacity: 0.35;
  }

  .zone-card__desc {
    font-family: var(--font-narrative);
    font-size: 0.72rem;
    line-height: 1.4;
    opacity: 0.65;
    margin: 0 0 0.4rem;
  }

  .zone-card__stats {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .zone-card__danger {
    font-size: 0.6rem;
    letter-spacing: 0.06em;
  }

  .zone-card__loot {
    font-size: 0.58rem;
    letter-spacing: 0.06em;
    opacity: 0.4;
    text-transform: uppercase;
  }

  .select-area__confirm {
    padding: 0.75rem 1rem;
    border-top: 1px solid #222;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    flex-shrink: 0;
  }

  .select-area__selected-info {
    display: flex;
    flex-direction: column;
  }

  .select-area__selected-name {
    font-size: 0.88rem;
    font-weight: 700;
    color: var(--color-hope);
  }

  .select-area__selected-meta {
    font-size: 0.58rem;
    opacity: 0.4;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-top: 0.1rem;
  }

  .select-area__start-btn {
    width: 100%;
    padding: 0.65rem;
    background: var(--color-hope);
    border: none;
    color: var(--color-bg);
    font-family: var(--font-ui);
    font-size: 0.88rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    cursor: pointer;
    transition: opacity 0.15s;
  }

  .select-area__start-btn:hover { opacity: 0.85; }
</style>
