<script lang="ts">
  import { inventoryStore } from '../../stores/inventoryStore';
  import { playerStore } from '../../stores/playerStore';
  import { gameStore } from '../../stores/gameStore';
  import { InventorySystem } from '../../engine/systems/InventorySystem';

  let { onClose }: { onClose: () => void } = $props();

  function useItem(index: number) {
    const item = $inventoryStore[index];
    if (!item) return;
    const next = InventorySystem.useItem($playerStore, item);
    playerStore.apply(next);
    inventoryStore.remove(index);
    gameStore.playerAction(1);
  }

  function hasEffects(item: import('../../engine/entities/Item').Item): boolean {
    return Object.values(item.effects).some(v => v !== undefined && v !== 0);
  }
</script>

<div class="inv-overlay" role="dialog" aria-modal="true">
  <div class="inv-panel">
    <div class="inv-header">
      <span class="inv-title">MOCHILA</span>
      <span class="inv-count">{$inventoryStore.length} objeto{$inventoryStore.length !== 1 ? 's' : ''}</span>
      <button class="inv-close" onclick={onClose}>×</button>
    </div>

    <div class="inv-list">
      {#if $inventoryStore.length === 0}
        <p class="inv-empty">La mochila está vacía.</p>
      {:else}
        {#each $inventoryStore as item, i}
          <div class="inv-item">
            <div class="inv-item__info">
              <span class="inv-item__name">{item.name}</span>
              <span class="inv-item__fx">{InventorySystem.effectLabel(item)}</span>
            </div>
            {#if hasEffects(item)}
              <button class="inv-item__btn" onclick={() => useItem(i)}>Usar</button>
            {:else}
              <span class="inv-item__equip">EQUIPO</span>
            {/if}
          </div>
        {/each}
      {/if}
    </div>
  </div>
</div>

<style>
  .inv-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: flex-end;
    z-index: 50;
  }

  .inv-panel {
    width: 100%;
    background: var(--color-surface);
    border-top: 1px solid var(--color-border);
    font-family: var(--font-ui);
    max-height: 65%;
    overflow-y: auto;
  }

  .inv-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid var(--color-border);
    position: sticky;
    top: 0;
    background: var(--color-surface);
  }

  .inv-title {
    font-size: 0.6rem;
    letter-spacing: 0.2em;
    opacity: 0.4;
    text-transform: uppercase;
    flex: 1;
  }

  .inv-count {
    font-size: 0.6rem;
    opacity: 0.3;
  }

  .inv-close {
    background: none;
    border: none;
    color: var(--color-text);
    font-size: 1.1rem;
    cursor: pointer;
    opacity: 0.5;
    padding: 0 0.25rem;
    line-height: 1;
    touch-action: manipulation;
  }

  .inv-close:hover { opacity: 1; }

  .inv-list {
    padding: 0.25rem 0;
  }

  .inv-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid var(--color-border);
  }

  .inv-item__info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }

  .inv-item__name {
    font-size: 0.78rem;
  }

  .inv-item__fx {
    font-size: 0.58rem;
    opacity: 0.4;
    letter-spacing: 0.06em;
  }

  .inv-item__btn {
    padding: 0.3rem 0.65rem;
    background: transparent;
    border: 1px solid #5fc88a;
    color: #5fc88a;
    font-family: var(--font-ui);
    font-size: 0.68rem;
    letter-spacing: 0.06em;
    cursor: pointer;
    touch-action: manipulation;
    white-space: nowrap;
    flex-shrink: 0;
    transition: background 0.15s, color 0.15s;
  }

  .inv-item__btn:hover {
    background: #5fc88a;
    color: var(--color-bg);
  }

  .inv-item__equip {
    padding: 0.3rem 0.5rem;
    font-size: 0.6rem;
    letter-spacing: 0.1em;
    opacity: 0.35;
    border: 1px solid var(--color-border);
    flex-shrink: 0;
  }

  .inv-empty {
    font-size: 0.7rem;
    opacity: 0.25;
    text-align: center;
    padding: 1.5rem;
    margin: 0;
    font-style: italic;
    font-family: var(--font-narrative);
  }
</style>
