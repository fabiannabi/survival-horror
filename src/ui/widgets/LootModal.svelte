<script lang="ts">
  import type { Item } from '../../engine/entities/Item';
  import { InventorySystem } from '../../engine/systems/InventorySystem';

  let { items, onTake, onTakeAll, onClose }: {
    items: Item[];
    onTake: (item: Item) => void;
    onTakeAll: () => void;
    onClose: () => void;
  } = $props();
</script>

<div class="loot-overlay" role="dialog" aria-modal="true">
  <div class="loot-panel">
    <div class="loot-header">
      <span class="loot-title">CONTENEDOR</span>
      <button class="loot-close" onclick={onClose}>×</button>
    </div>

    <div class="loot-list">
      {#each items as item}
        <div class="loot-item">
          <div class="loot-item__info">
            <span class="loot-item__name">{item.name}</span>
            <span class="loot-item__fx">{InventorySystem.effectLabel(item)}</span>
          </div>
          <button class="loot-item__btn" onclick={() => onTake(item)}>Tomar</button>
        </div>
      {/each}
    </div>

    {#if items.length > 1}
      <button class="loot-all-btn" onclick={onTakeAll}>Tomar todo</button>
    {/if}
  </div>
</div>

<style>
  .loot-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: flex-end;
    z-index: 50;
  }

  .loot-panel {
    width: 100%;
    background: var(--color-surface);
    border-top: 1px solid var(--color-border);
    font-family: var(--font-ui);
    max-height: 60%;
    overflow-y: auto;
  }

  .loot-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid var(--color-border);
  }

  .loot-title {
    font-size: 0.6rem;
    letter-spacing: 0.2em;
    opacity: 0.4;
    text-transform: uppercase;
  }

  .loot-close {
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

  .loot-close:hover { opacity: 1; }

  .loot-list {
    padding: 0.25rem 0;
  }

  .loot-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid var(--color-border);
  }

  .loot-item__info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }

  .loot-item__name {
    font-size: 0.78rem;
    color: var(--color-text);
  }

  .loot-item__fx {
    font-size: 0.58rem;
    opacity: 0.4;
    letter-spacing: 0.06em;
  }

  .loot-item__btn {
    padding: 0.3rem 0.65rem;
    background: transparent;
    border: 1px solid var(--color-hope);
    color: var(--color-hope);
    font-family: var(--font-ui);
    font-size: 0.68rem;
    letter-spacing: 0.06em;
    cursor: pointer;
    touch-action: manipulation;
    white-space: nowrap;
    transition: background 0.15s, color 0.15s;
    flex-shrink: 0;
  }

  .loot-item__btn:hover {
    background: var(--color-hope);
    color: var(--color-bg);
  }

  .loot-all-btn {
    width: 100%;
    padding: 0.55rem 0.75rem;
    background: transparent;
    border: none;
    border-top: 1px solid var(--color-border);
    color: var(--color-hope);
    font-family: var(--font-ui);
    font-size: 0.72rem;
    letter-spacing: 0.08em;
    cursor: pointer;
    touch-action: manipulation;
    transition: background 0.15s;
  }

  .loot-all-btn:hover { background: var(--color-surface); }
</style>
