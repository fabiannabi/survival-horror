<script lang="ts">
  import { worldStore } from '../../stores/worldStore';
  import { uiStore } from '../../stores/uiStore';
  import { gameStore } from '../../stores/gameStore';
  import { StrategicMap } from '../../engine/world/StrategicMap';
  import { Travel, type TravelMode } from '../../engine/world/Travel';
  import { ZONE_POIS, POI_META } from '../../engine/data/zonePois';
  import TravelModeModal from '../modals/TravelModeModal.svelte';

  let showTravelModal = false;

  const TYPE_LABEL: Record<string, string> = {
    residential: 'Residencial',
    commercial: 'Comercial',
    industrial: 'Industrial',
    medical: 'Médico',
    military: 'Militar',
    wild: 'Salvaje',
  };

  const FOG_LABEL: Record<string, string> = {
    unknown: 'Desconocida',
    rumored: 'Rumoreada',
    scouted: 'Avistada',
    explored: 'Explorada',
  };

  $: selectedZone = $uiStore.selectedZoneId ? $worldStore.zones[$uiStore.selectedZoneId] : null;
  $: currentZoneId = $worldStore.currentZoneId;
  $: isCurrentZone = selectedZone?.id === currentZoneId;
  $: canTravel =
    selectedZone && !isCurrentZone
      ? StrategicMap.isConnected($worldStore.zones, currentZoneId, selectedZone.id)
      : false;
  $: travelCost =
    selectedZone && canTravel
      ? Travel.cost($worldStore.zones, currentZoneId, selectedZone.id)
      : 0;
</script>

<div class="zone-panel">
  {#if selectedZone}
    <div class="zone-panel__header">
      <span class="zone-panel__name">{selectedZone.name}</span>
      <span class="zone-panel__type">{TYPE_LABEL[selectedZone.type]}</span>
    </div>

    <div class="zone-panel__body">
      {#if isCurrentZone}
        <p class="zone-panel__current">← Zona actual</p>
      {/if}

      <div class="zone-panel__stats">
        <div class="zone-panel__stat">
          <span class="zone-panel__stat-label">Peligro</span>
          <div class="zone-panel__bar">
            <div
              class="zone-panel__bar-fill zone-panel__bar-fill--danger"
              style="width:{selectedZone.danger * 10}%"
            ></div>
          </div>
          <span class="zone-panel__stat-num">{selectedZone.danger}/10</span>
        </div>
        <div class="zone-panel__stat">
          <span class="zone-panel__stat-label">Botín</span>
          <div class="zone-panel__bar">
            <div
              class="zone-panel__bar-fill zone-panel__bar-fill--loot"
              style="width:{selectedZone.loot.abundance * 10}%"
            ></div>
          </div>
        </div>
        <span class="zone-panel__fog">{FOG_LABEL[selectedZone.fog]}</span>
      </div>

      {#if selectedZone.fog === 'explored' || selectedZone.fog === 'scouted'}
        <p class="zone-panel__desc">{selectedZone.description}</p>
        {@const pois = ZONE_POIS[selectedZone.id] ?? []}
        {#if pois.length > 0}
          <div class="zone-panel__pois">
            {#each pois as poi}
              <div class="zone-panel__poi" style="border-left-color:{POI_META[poi.category].color}">
                <span class="zone-panel__poi-badge" style="color:{POI_META[poi.category].color}">{POI_META[poi.category].badge}</span>
                <span class="zone-panel__poi-label">{poi.label}</span>
              </div>
            {/each}
          </div>
        {/if}
      {:else}
        <p class="zone-panel__desc zone-panel__desc--unknown">Zona sin explorar.</p>
      {/if}
    </div>

    <div class="zone-panel__actions">
      {#if isCurrentZone}
        <button
          class="zone-panel__btn zone-panel__btn--enter"
          onclick={() => gameStore.enterTactical()}
        >
          Entrar a zona
        </button>
      {:else if canTravel}
        <button
          class="zone-panel__btn zone-panel__btn--travel"
          onclick={() => showTravelModal = true}
        >
          Viajar (~{travelCost} min a pie)
        </button>
      {:else}
        <p class="zone-panel__no-access">Sin ruta directa desde aquí</p>
      {/if}
    </div>
  {:else}
    <div class="zone-panel__empty">
      <p>Selecciona una zona en el mapa</p>
    </div>
  {/if}
</div>

{#if showTravelModal && selectedZone && canTravel}
  <TravelModeModal
    targetZone={selectedZone}
    baseCost={travelCost}
    onConfirm={(mode: TravelMode) => {
      gameStore.travel(selectedZone!.id, mode);
      showTravelModal = false;
    }}
    onClose={() => showTravelModal = false}
  />
{/if}

<style>
  .zone-panel {
    border-bottom: 1px solid var(--color-border);
    font-family: var(--font-ui);
    display: flex;
    flex-direction: column;
    min-height: 190px;
    flex-shrink: 0;
  }

  .zone-panel__header {
    padding: 0.6rem 0.75rem 0.3rem;
    border-bottom: 1px solid var(--color-border);
  }

  .zone-panel__name {
    display: block;
    font-weight: 700;
    font-size: 1.05rem;
    color: var(--color-hope);
    letter-spacing: 0.05em;
  }

  .zone-panel__type {
    font-size: 0.78rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    opacity: 0.45;
  }

  .zone-panel__body {
    padding: 0.5rem 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
    flex: 1;
  }

  .zone-panel__current {
    font-size: 0.85rem;
    color: var(--color-hope);
    opacity: 0.7;
    margin: 0;
  }

  .zone-panel__stats {
    display: flex;
    flex-direction: column;
    gap: 0.28rem;
  }

  .zone-panel__stat {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .zone-panel__stat-label {
    width: 3.5rem;
    font-size: 0.78rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    opacity: 0.5;
  }

  .zone-panel__bar {
    flex: 1;
    height: 6px;
    background: var(--color-border);
  }

  .zone-panel__bar-fill {
    height: 100%;
    transition: width 0.4s;
  }

  .zone-panel__bar-fill--danger { background: var(--color-blood); }
  .zone-panel__bar-fill--loot { background: var(--color-hope); }

  .zone-panel__stat-num {
    font-size: 0.78rem;
    opacity: 0.5;
    width: 2.2rem;
    text-align: right;
  }

  .zone-panel__fog {
    font-size: 0.78rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    opacity: 0.45;
  }

  .zone-panel__desc {
    font-family: var(--font-narrative);
    font-size: 0.9rem;
    line-height: 1.5;
    opacity: 0.7;
    margin: 0;
  }

  .zone-panel__desc--unknown { font-style: italic; opacity: 0.3; }

  .zone-panel__pois {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    margin-top: 0.1rem;
  }

  .zone-panel__poi {
    display: flex;
    align-items: baseline;
    gap: 0.4rem;
    padding-left: 0.4rem;
    border-left: 2px solid;
    border-left-color: var(--color-border);
  }

  .zone-panel__poi-badge {
    font-family: var(--font-ui);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    flex-shrink: 0;
  }

  .zone-panel__poi-label {
    font-family: var(--font-ui);
    font-size: 0.78rem;
    opacity: 0.65;
    line-height: 1.3;
  }

  .zone-panel__actions {
    padding: 0.5rem 0.75rem 0.6rem;
  }

  .zone-panel__btn {
    width: 100%;
    padding: 0.55rem 0.75rem;
    min-height: 48px;
    background: transparent;
    font-family: var(--font-ui);
    font-size: 0.92rem;
    letter-spacing: 0.08em;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
    touch-action: manipulation;
  }

  @media (max-width: 640px) {
    .zone-panel__btn {
      padding: 0.4rem 0.75rem;
      min-height: 44px;
      font-size: 0.85rem;
    }

    .zone-panel {
      min-height: 0;
    }

    .zone-panel__actions {
      padding: 0.35rem 0.75rem 0.4rem;
    }
  }

  .zone-panel__btn--travel {
    border: 1px solid var(--color-hope);
    color: var(--color-hope);
  }

  .zone-panel__btn--travel:hover {
    background: var(--color-hope);
    color: var(--color-bg);
  }

  .zone-panel__btn--enter {
    border: 1px solid #5fc88a;
    color: #5fc88a;
  }

  .zone-panel__btn--enter:hover {
    background: #5fc88a;
    color: var(--color-bg);
  }

  .zone-panel__no-access {
    font-size: 0.82rem;
    opacity: 0.35;
    text-align: center;
    margin: 0;
    letter-spacing: 0.06em;
  }

  .zone-panel__empty {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }

  .zone-panel__empty p {
    font-size: 0.88rem;
    opacity: 0.3;
    text-align: center;
    letter-spacing: 0.05em;
    margin: 0;
  }
</style>
