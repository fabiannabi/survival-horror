<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { get } from 'svelte/store';
  import { Application } from 'pixi.js';
  import { TacticalView } from '../../render/TacticalView';
  import { tacticalStore } from '../../stores/tacticalStore';
  import { inventoryStore } from '../../stores/inventoryStore';
  import { playerStore } from '../../stores/playerStore';
  import { worldStore } from '../../stores/worldStore';
  import { gameStore } from '../../stores/gameStore';
  import { uiStore } from '../../stores/uiStore';
  import TimeIndicator from '../widgets/TimeIndicator.svelte';
  import PlayerHUD from '../widgets/PlayerHUD.svelte';
  import LootModal from '../widgets/LootModal.svelte';
  import InventoryPanel from '../widgets/InventoryPanel.svelte';
  import type { TacticalState, ActionResult } from '../../stores/tacticalStore';
  import type { Item } from '../../engine/entities/Item';

  let canvasEl: HTMLDivElement;
  let view: TacticalView | null = null;
  let lastState: TacticalState | null = null;
  const unsubs: (() => void)[] = [];

  let lootItems: Item[] | null = null;
  let showInventory = false;

  function isAdjacent(px: number, py: number, tx: number, ty: number): boolean {
    return Math.abs(tx - px) <= 1 && Math.abs(ty - py) <= 1;
  }

  function handleResult(result: ActionResult) {
    if (get(uiStore).screen === 'gameOver') return;
    if (result.steps > 0) gameStore.playerAction(result.steps);
    if (get(uiStore).screen === 'gameOver') return;

    for (const ev of result.events) {
      if (ev.type === 'zombie_attack') {
        applyZombieDamage(ev.damage, ev.infection);
        if (get(uiStore).screen === 'gameOver') return;
      } else if (ev.type === 'player_hit_zombie') {
        const msg = ev.killed
          ? `Zombi eliminado. (-${ev.damage} HP)`
          : `Golpeaste a un zombi. (-${ev.damage} HP)`;
        gameStore.log(msg);
      }
    }
  }

  function applyZombieDamage(damage: number, infection: number) {
    playerStore.update(p => ({
      ...p,
      health:    Math.max(0, p.health - damage),
      infection: Math.min(100, p.infection + infection),
    }));
    const p = get(playerStore);
    gameStore.log(`Un zombi te atacó. -${damage} HP, +${infection} infección.`);
    if (p.health <= 0)       uiStore.triggerGameOver('injury');
    else if (p.infection >= 100) uiStore.triggerGameOver('infection');
  }

  function handleClick(x: number, y: number) {
    if (!lastState) return;
    const tile = lastState.tiles[y]?.[x];
    if (!tile) return;

    const zombie = lastState.zombies.find(z => z.x === x && z.y === y);

    if (zombie) {
      if (isAdjacent(lastState.playerX, lastState.playerY, x, y)) {
        handleResult(tacticalStore.attack(x, y));
      } else {
        handleResult(tacticalStore.moveAdjacentTo(x, y));
      }
      return;
    }

    if (tile.type === 'container') {
      if (isAdjacent(lastState.playerX, lastState.playerY, x, y)) {
        const { items, ...result } = tacticalStore.loot(x, y);
        if (items && items.length > 0) lootItems = [...items];
        handleResult(result);
      } else {
        handleResult(tacticalStore.moveAdjacentTo(x, y));
      }
      return;
    }

    handleResult(tacticalStore.moveTo(x, y));
  }

  function takeLootItem(item: Item) {
    inventoryStore.add(item);
    lootItems = lootItems?.filter(i => i !== item) ?? null;
    if (lootItems?.length === 0) lootItems = null;
  }

  function takeAllLoot() {
    if (lootItems) { inventoryStore.addMany(lootItems); lootItems = null; }
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
        lastState = state as TacticalState | null;
        if (!view || !state) return;
        view.render(state, handleClick);
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
  $: invCount = $inventoryStore.length;
  $: zombieCount = lastState?.zombies.length ?? 0;
</script>

<div class="tactical">
  <header class="tactical__hud">
    <TimeIndicator />
    <div class="tactical__zone">
      <span class="tactical__zone-label">ZONA TÁCTICA</span>
      <span class="tactical__zone-name">{zoneName}</span>
    </div>
    {#if zombieCount > 0}
      <div class="tactical__threat">
        <span class="tactical__threat-label">AMENAZA</span>
        <span class="tactical__threat-count">{zombieCount}</span>
      </div>
    {/if}
    <button
      class="tactical__inv-btn"
      class:tactical__inv-btn--has={invCount > 0}
      onclick={() => { showInventory = !showInventory; lootItems = null; }}
    >
      MOCHILA{#if invCount > 0} <span class="tactical__inv-count">({invCount})</span>{/if}
    </button>
    <button class="tactical__exit-btn" onclick={exitTactical}>← Salir</button>
  </header>

  <PlayerHUD />

  <div class="tactical__canvas-wrap">
    <div class="tactical__canvas" bind:this={canvasEl}></div>

    {#if lootItems !== null}
      <LootModal
        items={lootItems}
        onTake={takeLootItem}
        onTakeAll={takeAllLoot}
        onClose={() => lootItems = null}
      />
    {/if}

    {#if showInventory}
      <InventoryPanel onClose={() => showInventory = false} />
    {/if}
  </div>

  <div class="tactical__hint">
    Mueve · <span class="tactical__hint--zombie">rojo</span> = zombi (toca para atacar) ·
    <span class="tactical__hint--cont">marrón</span> = contenedor ·
    <span class="tactical__hint--exit">verde</span> = salida
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
    padding: 0 0.75rem;
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

  .tactical__threat {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 0.75rem;
    border-left: 1px solid var(--color-border);
  }

  .tactical__threat-label {
    font-size: 0.5rem;
    letter-spacing: 0.15em;
    opacity: 0.3;
    text-transform: uppercase;
  }

  .tactical__threat-count {
    font-size: 0.82rem;
    color: var(--color-blood);
    font-weight: 700;
  }

  .tactical__inv-btn {
    margin-left: auto;
    padding: 0 0.85rem;
    min-height: 44px;
    background: transparent;
    border: none;
    border-left: 1px solid var(--color-border);
    color: var(--color-text);
    font-family: var(--font-ui);
    font-size: 0.65rem;
    letter-spacing: 0.1em;
    cursor: pointer;
    opacity: 0.45;
    touch-action: manipulation;
    transition: opacity 0.15s, background 0.15s;
    white-space: nowrap;
  }

  .tactical__inv-btn--has { opacity: 0.85; color: var(--color-hope); }
  .tactical__inv-btn:hover { opacity: 1; background: var(--color-surface); }
  .tactical__inv-count { opacity: 0.75; }

  .tactical__exit-btn {
    padding: 0 1rem;
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

  .tactical__canvas-wrap {
    flex: 1;
    overflow: hidden;
    position: relative;
  }

  .tactical__canvas {
    width: 100%;
    height: 100%;
    overflow: hidden;
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

  .tactical__hint--zombie { color: #b82828; opacity: 1; }
  .tactical__hint--exit   { color: #2a7040; opacity: 1; }
  .tactical__hint--cont   { color: #5a3a18; opacity: 1; }

  @media (max-width: 640px) {
    .tactical__zone,
    .tactical__threat { display: none; }
    .tactical__inv-btn { padding: 0 0.6rem; font-size: 0.6rem; }
    .tactical__exit-btn { padding: 0 0.75rem; font-size: 0.72rem; }
    .tactical__hint { font-size: 0.52rem; padding: 0.25rem 0.5rem; }
  }
</style>
