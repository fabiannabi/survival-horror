<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { get } from 'svelte/store';
  import { Application } from 'pixi.js';
  import { StrategicView } from '../../render/StrategicView';
  import { worldStore } from '../../stores/worldStore';
  import { uiStore } from '../../stores/uiStore';
  import { gameStore } from '../../stores/gameStore';
  import TimeIndicator from '../widgets/TimeIndicator.svelte';
  import ZonePanel from '../panels/ZonePanel.svelte';
  import LogPanel from '../panels/LogPanel.svelte';
  import PlayerHUD from '../widgets/PlayerHUD.svelte';
  import InventoryPanel from '../widgets/InventoryPanel.svelte';
  import { inventoryStore } from '../../stores/inventoryStore';

  let showInventory = false;
  let canvasEl: HTMLDivElement;
  let app: Application | null = null;
  let view: StrategicView | null = null;
  const unsubs: (() => void)[] = [];

  function redraw() {
    if (!view) return;
    const world = get(worldStore);
    const ui = get(uiStore);
    const zones = Object.values(world.zones);
    view.render(zones, world.currentZoneId, ui.selectedZoneId, (id) => {
      uiStore.selectZone(id);
    });
  }

  onMount(async () => {
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
    unsubs.push(worldStore.subscribe(redraw));
    unsubs.push(uiStore.subscribe(redraw));
  });

  onDestroy(() => {
    unsubs.forEach(fn => fn());
    view?.destroy();
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

  <div class="strategic__body">
    <div class="strategic__map" bind:this={canvasEl}></div>
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
    font-size: 0.85rem;
    letter-spacing: 0.1em;
    cursor: pointer;
    opacity: 0.5;
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
    font-size: 0.72rem;
    letter-spacing: 0.15em;
    opacity: 0.45;
    text-transform: uppercase;
  }

  .strategic__city-name {
    font-size: 0.98rem;
    color: var(--color-hope);
    letter-spacing: 0.05em;
  }

  .strategic__threat-bar {
    width: 80px;
    height: 6px;
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
    position: relative;
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
    .strategic__hud { font-size: 0.88em; }
    .strategic__city, .strategic__threat { padding: 0 0.5rem; }
    .strategic__body { flex-direction: column; }
    .strategic__map { flex: none; height: 52svh; }
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
