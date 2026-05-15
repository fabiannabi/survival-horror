<script lang="ts">
  import { uiStore } from '../../stores/uiStore';
  import StrategicScreen from './StrategicScreen.svelte';
</script>

{#if $uiStore.playerMode === 'strategic'}
  <StrategicScreen />
{:else}
  <!-- Fase 3: TacticalScreen -->
  <div class="placeholder">
    <p>[ VISTA TÁCTICA — Fase 3 pendiente ]</p>
  </div>
{/if}

<style>
  .placeholder {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #333;
    font-family: var(--font-ui);
    font-size: 1rem;
    letter-spacing: 0.2em;
  }
</style>
