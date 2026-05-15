<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { get } from 'svelte/store';
  import L from 'leaflet';
  import { worldStore } from '../../stores/worldStore';
  import { uiStore } from '../../stores/uiStore';
  import { FogOfWar } from '../../engine/world/FogOfWar';
  import type { FogLevel } from '../../engine/world/Zone';
  import TimeIndicator from '../widgets/TimeIndicator.svelte';
  import ZonePanel from '../panels/ZonePanel.svelte';
  import LogPanel from '../panels/LogPanel.svelte';
  import PlayerHUD from '../widgets/PlayerHUD.svelte';
  import InventoryPanel from '../widgets/InventoryPanel.svelte';
  import { inventoryStore } from '../../stores/inventoryStore';

  let showInventory = false;

  let mapEl: HTMLDivElement;
  let map: L.Map | null = null;
  let markers: Record<string, L.Marker> = {};
  let connLines: L.Polyline[] = [];
  const unsubs: (() => void)[] = [];

  const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
  const TILE_ATTR =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

  function markerHtml(name: string, fog: FogLevel, isCurrent: boolean, isSelected: boolean): string {
    const cls = ['zm', `zm--${fog}`, isCurrent && 'zm--current', isSelected && 'zm--selected']
      .filter(Boolean)
      .join(' ');
    const visible = FogOfWar.isVisible(fog);
    return `<div class="${cls}">
      <div class="zm__dot">${isCurrent ? '<div class="zm__ring"></div>' : ''}</div>
      ${visible ? `<div class="zm__label">${name}</div>` : ''}
      ${isCurrent ? '<div class="zm__you">TÚ</div>' : ''}
    </div>`;
  }

  function redraw() {
    if (!map) return;
    const world = get(worldStore);
    const ui = get(uiStore);

    connLines.forEach((l) => map!.removeLayer(l));
    connLines = [];
    Object.values(markers).forEach((m) => map!.removeLayer(m));
    markers = {};

    const zones = Object.values(world.zones);
    const drawn = new Set<string>();

    for (const zone of zones) {
      if (!FogOfWar.isVisible(zone.fog)) continue;
      for (const cid of zone.connections) {
        const c = world.zones[cid];
        if (!c || !FogOfWar.isVisible(c.fog)) continue;
        const key = [zone.id, cid].sort().join('|');
        if (drawn.has(key)) continue;
        drawn.add(key);
        connLines.push(
          L.polyline([zone.coords as L.LatLngTuple, c.coords as L.LatLngTuple], {
            color: '#2a4060',
            weight: 2,
            opacity: 0.8,
            dashArray: '6 4',
          }).addTo(map!),
        );
      }
    }

    for (const zone of zones) {
      if (zone.fog === 'unknown') continue;
      const isCurrent = zone.id === world.currentZoneId;
      const isSelected = zone.id === ui.selectedZoneId;
      const icon = L.divIcon({
        html: markerHtml(zone.name, zone.fog, isCurrent, isSelected),
        className: '',
        iconSize: [0, 0],
        iconAnchor: [5, 5],
      });
      const m = L.marker(zone.coords as L.LatLngTuple, { icon, interactive: true }).addTo(map!);
      m.on('click', () => uiStore.selectZone(zone.id));
      markers[zone.id] = m;
    }
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
    redraw();
    unsubs.push(worldStore.subscribe(redraw));
    unsubs.push(uiStore.subscribe(redraw));
  });

  onDestroy(() => {
    unsubs.forEach((fn) => fn());
    map?.remove();
  });
</script>

<div class="strategic">
  <header class="strategic__hud">
    <TimeIndicator />
    <div class="strategic__city">
      <span class="strategic__city-label">CIUDAD</span>
      <span class="strategic__city-name">{$worldStore.cityName}</span>
    </div>
    <div class="strategic__threat">
      <span class="strategic__threat-label">AMENAZA</span>
      <div class="strategic__threat-bar">
        <div class="strategic__threat-fill" style="width:{$worldStore.globalThreat}%"></div>
      </div>
    </div>
    <button
      class="strategic__inv-btn"
      class:strategic__inv-btn--has={$inventoryStore.length > 0}
      onclick={() => showInventory = !showInventory}
    >
      MOCHILA{#if $inventoryStore.length > 0} ({$inventoryStore.length}){/if}
    </button>
  </header>

  <PlayerHUD />

  <div class="strategic__body" style="position:relative">
    <div class="strategic__map" bind:this={mapEl}></div>
    <aside class="strategic__sidebar">
      <ZonePanel />
      <LogPanel />
    </aside>

    {#if showInventory}
      <InventoryPanel onClose={() => showInventory = false} />
    {/if}
  </div>
</div>

<style>
  .strategic {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: var(--color-bg);
    color: var(--color-text);
    font-family: var(--font-ui);
    overflow: hidden;
  }

  .strategic__hud {
    display: flex;
    align-items: stretch;
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
  }

  .strategic__inv-btn {
    margin-left: auto;
    padding: 0 0.9rem;
    background: transparent;
    border: none;
    border-left: 1px solid var(--color-border);
    color: var(--color-text);
    font-family: var(--font-ui);
    font-size: 0.65rem;
    letter-spacing: 0.1em;
    cursor: pointer;
    opacity: 0.4;
    touch-action: manipulation;
    transition: opacity 0.15s, background 0.15s;
    white-space: nowrap;
  }

  .strategic__inv-btn--has { opacity: 0.85; color: var(--color-hope); }
  .strategic__inv-btn:hover { opacity: 1; background: var(--color-surface); }

  .strategic__city,
  .strategic__threat {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 1rem;
    border-left: 1px solid var(--color-border);
  }

  .strategic__city-label,
  .strategic__threat-label {
    font-size: 0.55rem;
    letter-spacing: 0.15em;
    opacity: 0.3;
    text-transform: uppercase;
  }

  .strategic__city-name {
    font-size: 0.82rem;
    color: var(--color-hope);
    letter-spacing: 0.05em;
  }

  .strategic__threat-bar {
    width: 72px;
    height: 4px;
    background: var(--color-border);
    margin-top: 4px;
  }

  .strategic__threat-fill {
    height: 100%;
    background: var(--color-blood);
    transition: width 0.5s;
  }

  .strategic__body {
    flex: 1;
    display: flex;
    overflow: hidden;
    min-height: 0;
  }

  .strategic__map {
    flex: 1;
    position: relative;
    overflow: hidden;
  }

  .strategic__sidebar {
    width: 260px;
    border-left: 1px solid var(--color-border);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    flex-shrink: 0;
  }

  @media (max-width: 640px) {
    .strategic__hud {
      font-size: 0.88em;
    }

    .strategic__city,
    .strategic__threat {
      padding: 0 0.5rem;
    }

    .strategic__body {
      flex-direction: column;
    }

    .strategic__map {
      flex: none;
      height: 52svh;
    }

    .strategic__sidebar {
      width: 100%;
      border-left: none;
      border-top: 1px solid var(--color-border);
      flex: 1;
      flex-direction: row;
      min-height: 0;
    }
  }
</style>
