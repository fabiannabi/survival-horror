<script lang="ts">
  let { onNewGame } = $props<{ onNewGame: () => void }>();
</script>

<div class="menu">
  <header class="menu__header">
    <h1 class="menu__title">ZONA CERO</h1>
    <p class="menu__subtitle">Survival Horror Narrativo</p>
  </header>

  <nav class="menu__nav">
    <button class="menu__btn menu__btn--primary" onclick={onNewGame}>
      Nueva Partida
    </button>
    <button class="menu__btn" disabled>
      Continuar
    </button>
    <button class="menu__btn" disabled>
      Cargar Partida
    </button>
  </nav>

  <footer class="menu__footer">
    <span>Día 0 — La ciudad ha caído</span>
  </footer>
</div>

<style>
  .menu {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3rem;
    background:
      radial-gradient(ellipse at center, #1a1a16 0%, var(--color-bg) 70%);
  }

  .menu__header {
    text-align: center;
  }

  .menu__title {
    font-family: var(--font-ui);
    font-size: clamp(3rem, 10vw, 6rem);
    font-weight: 700;
    letter-spacing: 0.3em;
    color: var(--color-hope);
    text-shadow: 0 0 40px rgba(74, 143, 181, 0.3);
  }

  .menu__subtitle {
    font-family: var(--font-narrative);
    font-size: 1rem;
    letter-spacing: 0.2em;
    color: var(--color-text);
    opacity: 0.6;
    margin-top: 0.5rem;
  }

  .menu__nav {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    width: min(320px, 90vw);
  }

  .menu__btn {
    padding: 0.9rem 2rem;
    min-height: 52px;
    background: transparent;
    border: 1px solid var(--color-hope);
    color: var(--color-hope);
    font-family: var(--font-ui);
    font-size: 1.1rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    cursor: pointer;
    transition: background 0.2s, color 0.2s;
    touch-action: manipulation;
  }

  .menu__btn:hover:not(:disabled) {
    background: var(--color-hope);
    color: var(--color-bg);
  }

  .menu__btn--primary {
    border-color: var(--color-hope);
  }

  .menu__btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
    border-color: var(--color-text);
    color: var(--color-text);
  }

  .menu__footer {
    font-family: var(--font-narrative);
    font-size: 0.8rem;
    color: var(--color-blood);
    letter-spacing: 0.15em;
    opacity: 0.7;
  }
</style>
