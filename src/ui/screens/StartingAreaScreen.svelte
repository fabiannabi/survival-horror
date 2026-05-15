<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import L from 'leaflet';
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
  const DANGER_COLOR = ['', '#4a8a4a', '#5a8a4a', '#7a9a4a', '#4a8fb5', '#4a8fb5', '#c97a30', '#c97a30', '#aa4444', '#aa4444', '#7a1f1f'];

  const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
  const TILE_ATTR =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

  let mapEl: HTMLDivElement;
  let map: L.Map | null = null;
  let markers: Record<string, L.Marker> = {};

  function markerHtml(zone: ZoneStateDef, isSelected: boolean): string {
    const cls = [
      'zm',
      'zm--explored',
      zone.canStart && 'zm--startable',
      isSelected && 'zm--selected',
    ]
      .filter(Boolean)
      .join(' ');
    return `<div class="${cls}">
      <div class="zm__dot">${isSelected ? '<div class="zm__ring"></div>' : ''}</div>
      <div class="zm__label">${zone.name}</div>
    </div>`;
  }

  function drawMarkers() {
    if (!map) return;
    Object.values(markers).forEach((m) => map!.removeLayer(m));
    markers = {};

    for (const zone of INITIAL_ZONES) {
      const isSelected = zone.id === selectedId;
      const icon = L.divIcon({
        html: markerHtml(zone as ZoneStateDef, isSelected),
        className: '',
        iconSize: [0, 0],
        iconAnchor: [5, 5],
      });
      const m = L.marker(zone.coords as L.LatLngTuple, { icon, interactive: zone.canStart }).addTo(map!);
      if (zone.canStart) {
        m.on('click', () => { selectedId = zone.id; });
      }
      markers[zone.id] = m;
    }

    // Pan to selected zone
    const sel = INITIAL_ZONES.find((z) => z.id === selectedId);
    if (sel) map.panTo(sel.coords as L.LatLngTuple, { animate: true });
  }

  onMount(() => {
    map = L.map(mapEl, { zoomControl: true, attributionControl: true }).setView(
      [21.882, -102.296],
      13,
    );
    L.tileLayer(TILE_URL, {
      attribution: TILE_ATTR,
      subdomains: 'abcd',
      maxZoom: 17,
    }).addTo(map);
    drawMarkers();
  });

  onDestroy(() => { map?.remove(); });

  $effect(() => {
    selectedId;
    drawMarkers();
  });

  function startGame() {
    gameStore.newGame(undefined, selectedId);
    uiStore.setScreen('game');
  }
</script>

<div class="select-area">
  <div class="select-area__map" bind:this={mapEl}></div>

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
    font-size: 0.88rem;
    font-weight: 700;
    color: var(--color-hope);
    letter-spacing: 0.04em;
  }

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

  .zone-card__danger { font-size: 0.6rem; letter-spacing: 0.06em; }
  .zone-card__loot { font-size: 0.58rem; letter-spacing: 0.06em; opacity: 0.4; text-transform: uppercase; }

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
