<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { get } from 'svelte/store';
  import { Application } from 'pixi.js';
  import { StrategicView } from '../../render/StrategicView';
  import { worldStore } from '../../stores/worldStore';
  import { uiStore } from '../../stores/uiStore';
  import TimeIndicator from '../widgets/TimeIndicator.svelte';
  import ZonePanel from '../panels/ZonePanel.svelte';
  import LogPanel from '../panels/LogPanel.svelte';

  let mapContainer: HTMLDivElement;
  let view: StrategicView | null = null;
  const unsubs: (() => void)[] = [];

  function rerender() {
    if (!view) return;
    const world = get(worldStore);
    const ui = get(uiStore);
    view.render(
      Object.values(world.zones),
      world.currentZoneId,
      ui.selectedZoneId,
      (id) => uiStore.selectZone(id),
    );
  }

  onMount(async () => {
    const app = new Application();
    await app.init({
      resizeTo: mapContainer,
      background: 0x0f0f0d,
      antialias: true,
    });
    mapContainer.appendChild(app.canvas as HTMLCanvasElement);

    view = new StrategicView(app);
    rerender();

    unsubs.push(worldStore.subscribe(rerender));
    unsubs.push(uiStore.subscribe(rerender));

    const ro = new ResizeObserver(rerender);
    ro.observe(mapContainer);
    unsubs.push(() => ro.disconnect());
  });

  onDestroy(() => {
    unsubs.forEach((fn) => fn());
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
        <div
          class="strategic__threat-fill"
          style="width:{$worldStore.globalThreat}%"
        ></div>
      </div>
    </div>
  </header>

  <div class="strategic__body">
    <div class="strategic__map" bind:this={mapContainer}></div>

    <aside class="strategic__sidebar">
      <ZonePanel />
      <LogPanel />
    </aside>
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
    border-bottom: 1px solid #222;
    flex-shrink: 0;
  }

  .strategic__city,
  .strategic__threat {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 1rem;
    border-left: 1px solid #222;
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
    background: #2a2a2a;
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
  }

  .strategic__map {
    flex: 1;
    position: relative;
    overflow: hidden;
  }

  .strategic__map :global(canvas) {
    display: block;
  }

  .strategic__sidebar {
    width: 260px;
    border-left: 1px solid #222;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    flex-shrink: 0;
  }
</style>
