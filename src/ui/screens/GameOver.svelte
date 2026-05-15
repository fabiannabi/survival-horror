<script lang="ts">
  import { uiStore } from '../../stores/uiStore';
  import { gameStore } from '../../stores/gameStore';
  import { timeStore } from '../../stores/timeStore';
  import { TimeSystem } from '../../engine/core/TimeSystem';

  const CAUSE_TEXT: Record<string, { title: string; line: string }> = {
    starvation: {
      title: 'MUERTE POR INANICIÓN',
      line: 'El cuerpo no pudo resistir más sin alimento.',
    },
    dehydration: {
      title: 'MUERTE POR DESHIDRATACIÓN',
      line: 'La sed te consumió antes de encontrar agua.',
    },
    infection: {
      title: 'TE HAS CONVERTIDO',
      line: 'La infección completó su obra. Ya no eres tú.',
    },
    injury: {
      title: 'CAÍSTE EN COMBATE',
      line: 'Las heridas fueron demasiado profundas.',
    },
  };

  $: reason = $uiStore.gameOverReason ?? 'injury';
  $: cause = CAUSE_TEXT[reason] ?? CAUSE_TEXT.injury;
  $: elapsed = TimeSystem.formatTime(TimeSystem.fromMinutes($timeStore));

  function restart() {
    gameStore.newGame();
    uiStore.setScreen('game');
  }

  function menu() {
    uiStore.setScreen('menu');
  }
</script>

<div class="over">
  <div class="over__card">
    <p class="over__day">{elapsed}</p>
    <h1 class="over__title">{cause.title}</h1>
    <p class="over__line">{cause.line}</p>

    <div class="over__actions">
      <button class="over__btn over__btn--restart" onclick={restart}>
        Intentar de nuevo
      </button>
      <button class="over__btn over__btn--menu" onclick={menu}>
        Menú principal
      </button>
    </div>
  </div>
</div>

<style>
  .over {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #050608;
    font-family: var(--font-ui);
  }

  .over__card {
    max-width: 340px;
    width: 100%;
    padding: 2rem 1.5rem;
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    border: 1px solid var(--color-blood);
  }

  .over__day {
    font-size: 0.62rem;
    letter-spacing: 0.2em;
    opacity: 0.35;
    margin: 0;
    text-transform: uppercase;
  }

  .over__title {
    font-size: 1.1rem;
    letter-spacing: 0.12em;
    color: var(--color-blood);
    margin: 0;
    font-weight: 700;
  }

  .over__line {
    font-family: var(--font-narrative);
    font-size: 0.82rem;
    line-height: 1.5;
    opacity: 0.55;
    margin: 0;
  }

  .over__actions {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .over__btn {
    width: 100%;
    padding: 0.65rem 1rem;
    background: transparent;
    font-family: var(--font-ui);
    font-size: 0.78rem;
    letter-spacing: 0.1em;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
    touch-action: manipulation;
  }

  .over__btn--restart {
    border: 1px solid var(--color-hope);
    color: var(--color-hope);
  }

  .over__btn--restart:hover {
    background: var(--color-hope);
    color: var(--color-bg);
  }

  .over__btn--menu {
    border: 1px solid var(--color-border);
    color: var(--color-text);
    opacity: 0.5;
  }

  .over__btn--menu:hover {
    opacity: 1;
    background: var(--color-surface);
  }
</style>
