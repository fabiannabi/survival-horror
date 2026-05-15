<script lang="ts">
  import { uiStore } from '../../stores/uiStore';
  import StrategicScreen from './StrategicScreen.svelte';
  import TacticalScreen from './TacticalScreen.svelte';
</script>

{#if $uiStore.playerMode === 'strategic'}
  <StrategicScreen />
{:else if $uiStore.playerMode === 'tactical'}
  <TacticalScreen />
{:else}
  <div class="placeholder">
    <p>[ VISTA BASE — Fase 9 ]</p>
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
