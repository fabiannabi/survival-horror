<script lang="ts">
  import '../src/styles/global.css';
  import MainMenu from './ui/screens/MainMenu.svelte';

  let screen = $state<'menu' | 'game'>('menu');

  function handleNewGame() {
    screen = 'game';
  }
</script>

{#if screen === 'menu'}
  <MainMenu onNewGame={handleNewGame} />
{:else}
  <div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--color-hope);font-family:var(--font-ui);font-size:2rem;letter-spacing:0.2em;">
    [JUEGO — Fase 1 pendiente]
  </div>
{/if}
