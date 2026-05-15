<script lang="ts">
  import { inventoryStore } from '../../stores/inventoryStore';
  import { Travel, ALL_MODES, type TravelMode } from '../../engine/world/Travel';
  import type { ZoneState } from '../../engine/world/Zone';

  let {
    targetZone,
    baseCost,
    onConfirm,
    onClose,
  }: {
    targetZone: ZoneState;
    baseCost: number;
    onConfirm: (mode: TravelMode) => void;
    onClose: () => void;
  } = $props();

  let selectedMode = $state<TravelMode>('foot');

  const DANGER_COLOR: Record<number, string> = {
    1: '#4a8a4a', 2: '#4a8a4a', 3: '#5a8a4a', 4: '#7a9a4a',
    5: '#4a8fb5', 6: '#c97a30', 7: '#c97a30', 8: '#aa4444', 9: '#aa4444', 10: '#7a1f1f',
  };

  const TYPE_LABEL: Record<string, string> = {
    residential: 'Residencial', commercial: 'Comercial', industrial: 'Industrial',
    medical: 'Médico', military: 'Militar', wild: 'Natural',
  };

  const NOISE_LABEL = ['Silencioso', 'Leve', 'Moderado', 'Alto', 'Muy alto', 'Extremo'];

  function available(mode: TravelMode): boolean {
    return Travel.availableModes($inventoryStore).includes(mode);
  }

  function timeFor(mode: TravelMode): string {
    const mins = Travel.travelTime(baseCost, mode);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m > 0 ? `${m}m` : ''}`.trim() : `${m} min`;
  }

  function fatigueFor(mode: TravelMode): number {
    return Travel.extraFatigue(baseCost, mode);
  }

  function confirm() {
    onConfirm(selectedMode);
  }

  function handleKey(e: KeyboardEvent) {
    if (e.key === 'Escape') onClose();
    if (e.key === 'Enter') confirm();
  }
</script>

<svelte:window onkeydown={handleKey} />

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="tm-backdrop" onclick={onClose}>
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="tm-modal" onclick={(e) => e.stopPropagation()}>
    <div class="tm-header">
      <div class="tm-dest">
        <span class="tm-dest__name">{targetZone.name}</span>
        <span class="tm-dest__meta">
          {TYPE_LABEL[targetZone.type]} ·
          <span style="color:{DANGER_COLOR[targetZone.danger] ?? '#aaa'}">
            Peligro {targetZone.danger}/10
          </span>
        </span>
      </div>
      <button class="tm-close" onclick={onClose}>×</button>
    </div>

    <div class="tm-label">¿Cómo llegas?</div>

    <div class="tm-modes">
      {#each ALL_MODES as mode}
        {@const avail = available(mode)}
        {@const cfg = Travel.modeConfig(mode)}
        <button
          class="tm-mode"
          class:tm-mode--selected={selectedMode === mode}
          class:tm-mode--disabled={!avail}
          disabled={!avail}
          onclick={() => { if (avail) selectedMode = mode; }}
        >
          <span class="tm-mode__icon">{cfg.icon}</span>
          <div class="tm-mode__info">
            <span class="tm-mode__label">{cfg.label}</span>
            {#if avail}
              <span class="tm-mode__stats">
                {timeFor(mode)} ·
                {#if fatigueFor(mode) > 0}
                  <span class="tm-mode__fatigue">+{fatigueFor(mode)} fatiga</span>
                {/if}
                {#if cfg.noiseFactor > 0}
                  <span class="tm-mode__noise" class:tm-mode__noise--high={cfg.noiseFactor >= 3}>
                    · ruido {NOISE_LABEL[cfg.noiseFactor]}
                  </span>
                {/if}
              </span>
            {:else}
              <span class="tm-mode__unavail">Sin {cfg.label.toLowerCase()} en mochila</span>
            {/if}
          </div>
          {#if selectedMode === mode && avail}
            <span class="tm-mode__check">✓</span>
          {/if}
        </button>
      {/each}
    </div>

    <div class="tm-actions">
      <button class="tm-btn tm-btn--cancel" onclick={onClose}>Cancelar</button>
      <button class="tm-btn tm-btn--confirm" onclick={confirm}>
        Viajar — {timeFor(selectedMode)}
      </button>
    </div>
  </div>
</div>

<style>
  .tm-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.75);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
    padding: 1rem;
  }

  .tm-modal {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    width: 100%;
    max-width: 380px;
    font-family: var(--font-ui);
    color: var(--color-text);
  }

  .tm-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 0.9rem 1rem 0.75rem;
    border-bottom: 1px solid var(--color-border);
  }

  .tm-dest { display: flex; flex-direction: column; gap: 0.15rem; }

  .tm-dest__name {
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--color-hope);
    letter-spacing: 0.04em;
  }

  .tm-dest__meta {
    font-size: 0.75rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    opacity: 0.6;
  }

  .tm-close {
    background: none;
    border: none;
    color: var(--color-text);
    font-size: 1.2rem;
    cursor: pointer;
    opacity: 0.4;
    padding: 0 0.2rem;
    line-height: 1;
    flex-shrink: 0;
  }
  .tm-close:hover { opacity: 1; }

  .tm-label {
    padding: 0.6rem 1rem 0.3rem;
    font-size: 0.72rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    opacity: 0.4;
  }

  .tm-modes {
    display: flex;
    flex-direction: column;
    padding: 0 0.5rem 0.5rem;
    gap: 0.25rem;
  }

  .tm-mode {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.6rem 0.75rem;
    background: transparent;
    border: 1px solid var(--color-border);
    color: var(--color-text);
    font-family: var(--font-ui);
    cursor: pointer;
    text-align: left;
    transition: border-color 0.12s, background 0.12s;
    width: 100%;
  }

  .tm-mode:hover:not(.tm-mode--disabled) {
    border-color: var(--color-hope);
    background: rgba(160, 140, 80, 0.05);
  }

  .tm-mode--selected {
    border-color: var(--color-hope) !important;
    background: rgba(160, 140, 80, 0.08) !important;
  }

  .tm-mode--disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .tm-mode__icon {
    font-size: 1.3rem;
    flex-shrink: 0;
    width: 1.6rem;
    text-align: center;
  }

  .tm-mode__info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    min-width: 0;
  }

  .tm-mode__label {
    font-size: 0.88rem;
    font-weight: 600;
    letter-spacing: 0.04em;
  }

  .tm-mode__stats {
    font-size: 0.72rem;
    opacity: 0.55;
    letter-spacing: 0.04em;
  }

  .tm-mode__unavail {
    font-size: 0.7rem;
    opacity: 0.4;
    font-style: italic;
  }

  .tm-mode__fatigue { color: #c97a30; opacity: 1; }
  .tm-mode__noise { }
  .tm-mode__noise--high { color: #aa4444; opacity: 1; }

  .tm-mode__check {
    color: var(--color-hope);
    font-size: 0.9rem;
    flex-shrink: 0;
  }

  .tm-actions {
    display: flex;
    border-top: 1px solid var(--color-border);
  }

  .tm-btn {
    flex: 1;
    padding: 0.7rem 1rem;
    background: transparent;
    border: none;
    font-family: var(--font-ui);
    font-size: 0.85rem;
    letter-spacing: 0.08em;
    cursor: pointer;
    transition: background 0.12s, color 0.12s;
  }

  .tm-btn--cancel {
    color: var(--color-text);
    opacity: 0.4;
    border-right: 1px solid var(--color-border);
  }
  .tm-btn--cancel:hover { opacity: 0.8; background: var(--color-surface); }

  .tm-btn--confirm {
    color: var(--color-hope);
    font-weight: 700;
  }
  .tm-btn--confirm:hover { background: var(--color-hope); color: var(--color-bg); }
</style>
