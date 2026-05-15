<script lang="ts">
  import { afterUpdate } from 'svelte';
  import { logStore } from '../../stores/logStore';
  import { TimeSystem } from '../../engine/core/TimeSystem';

  let logContainer: HTMLDivElement;

  afterUpdate(() => {
    if (logContainer) logContainer.scrollTop = logContainer.scrollHeight;
  });

  const TYPE_COLOR: Record<string, string> = {
    info: 'var(--color-text)',
    combat: 'var(--color-blood)',
    narrative: 'var(--color-hope)',
    warning: '#c4883a',
    danger: '#cc4444',
  };
</script>

<div class="log">
  <div class="log__header">DIARIO</div>
  <div class="log__entries" bind:this={logContainer}>
    {#each $logStore as entry (entry.id)}
      <div class="log__entry" style="color: {TYPE_COLOR[entry.type] ?? 'inherit'}">
        <span class="log__time">
          {TimeSystem.formatTime(TimeSystem.fromMinutes(entry.timestamp))}
        </span>
        <p class="log__msg">{entry.message}</p>
      </div>
    {/each}
    {#if $logStore.length === 0}
      <p class="log__empty">Sin registros.</p>
    {/if}
  </div>
</div>

<style>
  .log {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-height: 0;
  }

  .log__header {
    padding: 0.4rem 0.75rem;
    font-family: var(--font-ui);
    font-size: 0.78rem;
    letter-spacing: 0.2em;
    opacity: 0.45;
    border-bottom: 1px solid var(--color-border);
    text-transform: uppercase;
    flex-shrink: 0;
  }

  .log__entries {
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
    scrollbar-width: thin;
    scrollbar-color: #333 transparent;
  }

  .log__entry {
    font-family: var(--font-narrative);
    font-size: 0.92rem;
    line-height: 1.5;
  }

  .log__time {
    display: block;
    font-family: var(--font-ui);
    font-size: 0.72rem;
    opacity: 0.4;
    letter-spacing: 0.08em;
    margin-bottom: 0.15rem;
  }

  .log__msg {
    margin: 0;
  }

  .log__empty {
    font-family: var(--font-narrative);
    font-size: 0.9rem;
    opacity: 0.3;
    margin: 0;
  }
</style>
