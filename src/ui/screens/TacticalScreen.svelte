<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Application } from 'pixi.js';
  import { TacticalView } from '../../render/TacticalView';
  import { tacticalStore } from '../../stores/tacticalStore';
  import { worldStore } from '../../stores/worldStore';
  import { gameStore } from '../../stores/gameStore';
  import { uiStore } from '../../stores/uiStore';
  import TimeIndicator from '../widgets/TimeIndicator.svelte';
  import type { ZoneMapState } from '../../engine/world/ZoneMap';

  let canvasEl: HTMLDivElement;
  let view: TacticalView | null = null;
  let lastState: ZoneMapState | null = null;
  const unsubs: (() => void)[] = [];

  function handleClick(x: number, y: number) {
    const steps = tacticalStore.moveTo(x, y);
    if (steps > 0) gameStore.playerAction(steps);
  }

  function exitTactical() {
    tacticalStore.exit();
    uiStore.setPlayerMode('strategic');
  }

  onMount(async () => {
    const app = new Application();
    await app.init({ resizeTo: canvasEl, background: 0x000000, antialias: false });
    canvasEl.appendChild(app.canvas as HTMLCanvasElement);
    view = new TacticalView(app);

    unsubs.push(
      tacticalStore.subscribe((state) => {
        lastState = state;
        if (!view || !state) return;
        view.render(state, handleClick);
        // Auto-exit when player steps on the exit tile
        if (state.tiles[state.playerY]?.[state.playerX]?.type === 'exit') exitTactical();
      }),
    );

    const ro = new ResizeObserver(() => {
      if (view && lastState) view.render(lastState, handleClick);
    });
    ro.observe(canvasEl);
    unsubs.push(() => ro.disconnect());
  });

  onDestroy(() => {
    unsubs.forEach(fn => fn());
    view?.destroy();
  });

  $: zoneName = $worldStore.zones[$worldStore.currentZoneId]?.name ?? '';
</script>

<div class="tactical">
  <header class="tactical__hud">
    <TimeIndicator />
    <div class="tactical__zone">
      <span class="tactical__zone-label">ZONA TÁCTICA</span>
      <span class="tactical__zone-name">{zoneName}</span>
    </div>
    <button class="tactical__exit-btn" onclick={exitTactical}>← Salir al mapa</button>
  </header>

  <div class="tactical__canvas" bind:this={canvasEl}></div>

  <div class="tactical__hint">
    Toca un tile para moverte · El tile <span class="tactical__hint--exit">verde</span> es la salida
  </div>
</div>

<style>
  .tactical {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: #000;
    color: var(--color-text);
    font-family: var(--font-ui);
    overflow: hidden;
  }

  .tactical__hud {
    display: flex;
    align-items: stretch;
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
    background: var(--color-bg);
  }

  .tactical__zone {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 1rem;
    border-left: 1px solid var(--color-border);
  }

  .tactical__zone-label {
    font-size: 0.55rem;
    letter-spacing: 0.15em;
    opacity: 0.3;
    text-transform: uppercase;
  }

  .tactical__zone-name {
    font-size: 0.82rem;
    color: var(--color-hope);
    letter-spacing: 0.05em;
  }

  .tactical__exit-btn {
    margin-left: auto;
    padding: 0 1.2rem;
    min-height: 44px;
    background: transparent;
    border: none;
    border-left: 1px solid var(--color-border);
    color: var(--color-text);
    font-family: var(--font-ui);
    font-size: 0.8rem;
    letter-spacing: 0.06em;
    cursor: pointer;
    opacity: 0.6;
    touch-action: manipulation;
    transition: opacity 0.15s, background 0.15s;
  }

  .tactical__exit-btn:hover { opacity: 1; background: var(--color-surface); }

  .tactical__canvas {
    flex: 1;
    overflow: hidden;
    position: relative;
  }

  .tactical__canvas :global(canvas) { display: block; }

  .tactical__hint {
    padding: 0.3rem 0.75rem;
    font-size: 0.6rem;
    letter-spacing: 0.06em;
    opacity: 0.25;
    text-align: center;
    background: var(--color-bg);
    border-top: 1px solid var(--color-border);
    flex-shrink: 0;
  }

  .tactical__hint--exit { color: #2a7040; opacity: 1; }
</style>
