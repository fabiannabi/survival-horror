<script lang="ts">
  import { playerStore } from '../../stores/playerStore';

  $: p = $playerStore;

  function barColor(value: number, inverted = false): string {
    const pct = inverted ? 100 - value : value;
    if (pct > 60) return 'var(--color-hope)';
    if (pct > 30) return '#b87a20';
    return 'var(--color-blood)';
  }
</script>

<div class="phud">
  <div class="phud__row">
    <div class="phud__stat">
      <span class="phud__label">HP</span>
      <div class="phud__bar">
        <div class="phud__fill" style="width:{p.health}%;background:{barColor(p.health)}"></div>
      </div>
      <span class="phud__num">{Math.round(p.health)}</span>
    </div>

    <div class="phud__stat">
      <span class="phud__label">HAM</span>
      <div class="phud__bar">
        <div class="phud__fill" style="width:{p.hunger}%;background:{barColor(p.hunger)}"></div>
      </div>
    </div>

    <div class="phud__stat">
      <span class="phud__label">SED</span>
      <div class="phud__bar">
        <div class="phud__fill" style="width:{p.thirst}%;background:{barColor(p.thirst)}"></div>
      </div>
    </div>

    <div class="phud__stat">
      <span class="phud__label">FAT</span>
      <div class="phud__bar">
        <div class="phud__fill" style="width:{p.fatigue}%;background:{barColor(p.fatigue, true)}"></div>
      </div>
    </div>

    {#if p.infection > 0}
      <div class="phud__stat">
        <span class="phud__label phud__label--inf">INF</span>
        <div class="phud__bar">
          <div class="phud__fill phud__fill--inf" style="width:{p.infection}%"></div>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .phud {
    padding: 0.4rem 0.75rem;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-surface);
    flex-shrink: 0;
  }

  .phud__row {
    display: flex;
    gap: 0.65rem;
    align-items: center;
  }

  .phud__stat {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    flex: 1;
    min-width: 0;
  }

  .phud__label {
    font-family: var(--font-ui);
    font-size: 0.72rem;
    letter-spacing: 0.1em;
    opacity: 0.55;
    text-transform: uppercase;
    flex-shrink: 0;
    width: 2.2rem;
  }

  .phud__label--inf {
    color: var(--color-infection);
    opacity: 0.9;
  }

  .phud__bar {
    flex: 1;
    height: 5px;
    background: var(--color-border);
    min-width: 0;
  }

  .phud__fill {
    height: 100%;
    transition: width 0.6s;
  }

  .phud__fill--inf {
    background: #4a9e3a;
  }

  .phud__num {
    font-family: var(--font-ui);
    font-size: 0.72rem;
    opacity: 0.55;
    width: 1.8rem;
    text-align: right;
    flex-shrink: 0;
  }
</style>
