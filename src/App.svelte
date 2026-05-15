<script lang="ts">
  import MainMenu from './ui/screens/MainMenu.svelte';
  import GameScreen from './ui/screens/GameScreen.svelte';
  import { uiStore } from './stores/uiStore';
  import { gameStore } from './stores/gameStore';

  function handleNewGame() {
    gameStore.newGame();
    uiStore.setScreen('game');
  }
</script>

{#if $uiStore.screen === 'menu'}
  <MainMenu onNewGame={handleNewGame} />
{:else if $uiStore.screen === 'game'}
  <GameScreen />
{/if}
