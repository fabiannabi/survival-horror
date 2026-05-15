<script lang="ts">
  import MainMenu from './ui/screens/MainMenu.svelte';
  import StartingAreaScreen from './ui/screens/StartingAreaScreen.svelte';
  import GameScreen from './ui/screens/GameScreen.svelte';
  import GameOver from './ui/screens/GameOver.svelte';
  import { uiStore } from './stores/uiStore';
</script>

{#if $uiStore.screen === 'menu'}
  <MainMenu onNewGame={() => uiStore.setScreen('selectArea')} />
{:else if $uiStore.screen === 'selectArea'}
  <StartingAreaScreen />
{:else if $uiStore.screen === 'game'}
  <GameScreen />
{:else if $uiStore.screen === 'gameOver'}
  <GameOver />
{/if}
