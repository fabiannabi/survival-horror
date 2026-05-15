<script lang="ts">
  import TimeIndicator from '../widgets/TimeIndicator.svelte';
  import LogPanel from '../panels/LogPanel.svelte';
  import { gameStore } from '../../stores/gameStore';
  import { playerStore } from '../../stores/playerStore';
  import { worldStore } from '../../stores/worldStore';

  const ACTIONS = [
    { label: 'Buscar (15 min)', minutes: 15, desc: 'Rebuscas entre los escombros. El silencio te pone nervioso.' },
    { label: 'Explorar (30 min)', minutes: 30, desc: 'Te mueves con cuidado, estudiando los alrededores.' },
    { label: 'Descansar (1h)', minutes: 60, desc: 'Te sientas. El agotamiento cede levemente.' },
    { label: 'Vigía (2h)', minutes: 120, desc: 'Montas guardia. La ciudad permanece en silencio. Por ahora.' },
  ];
</script>

<div class="game">
  <header class="game__hud">
    <TimeIndicator />
    <div class="game__location">
      <span class="game__location-label">ZONA</span>
      <span class="game__location-name">{$worldStore.currentZone}</span>
    </div>
    <div class="game__threat">
      <span class="game__threat-label">AMENAZA</span>
      <div class="game__threat-bar">
        <div
          class="game__threat-fill"
          style="width: {$worldStore.globalThreat}%"
        ></div>
      </div>
    </div>
  </header>

  <div class="game__body">
    <main class="game__main">
      <div class="map-placeholder">
        <p class="map-placeholder__title">[ MAPA TÁCTICO ]</p>
        <p class="map-placeholder__sub">Fase 2 — PixiJS</p>
      </div>

      <div class="game__actions">
        {#each ACTIONS as action}
          <button
            class="action-btn"
            onclick={() => gameStore.playerAction(action.minutes, action.desc)}
          >
            {action.label}
          </button>
        {/each}
      </div>
    </main>

    <aside class="game__sidebar">
      <div class="sidebar__player">
        <span class="sidebar__name">{$playerStore.name}</span>

        <div class="sidebar__stat">
          <span class="sidebar__stat-label">Salud</span>
          <div class="sidebar__stat-track">
            <div
              class="sidebar__stat-fill sidebar__stat-fill--health"
              style="width: {($playerStore.health / $playerStore.maxHealth) * 100}%"
            ></div>
          </div>
          <span class="sidebar__stat-val">{$playerStore.health}</span>
        </div>

        <div class="sidebar__stat">
          <span class="sidebar__stat-label">Hambre</span>
          <div class="sidebar__stat-track">
            <div
              class="sidebar__stat-fill sidebar__stat-fill--hunger"
              style="width: {$playerStore.hunger}%"
            ></div>
          </div>
        </div>

        <div class="sidebar__stat">
          <span class="sidebar__stat-label">Fatiga</span>
          <div class="sidebar__stat-track">
            <div
              class="sidebar__stat-fill sidebar__stat-fill--fatigue"
              style="width: {$playerStore.fatigue}%"
            ></div>
          </div>
        </div>
      </div>

      <LogPanel />
    </aside>
  </div>
</div>

<style>
  .game {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: var(--color-bg);
    color: var(--color-text);
    font-family: var(--font-ui);
    overflow: hidden;
  }

  .game__hud {
    display: flex;
    align-items: stretch;
    border-bottom: 1px solid #2a2a2a;
    flex-shrink: 0;
  }

  .game__location,
  .game__threat {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 1rem;
    border-left: 1px solid #2a2a2a;
  }

  .game__location-label,
  .game__threat-label {
    font-size: 0.55rem;
    letter-spacing: 0.15em;
    opacity: 0.35;
  }

  .game__location-name {
    font-size: 0.8rem;
    letter-spacing: 0.05em;
    color: var(--color-hope);
  }

  .game__threat-bar {
    width: 80px;
    height: 4px;
    background: #2a2a2a;
    margin-top: 4px;
  }

  .game__threat-fill {
    height: 100%;
    background: var(--color-blood);
    transition: width 0.5s;
  }

  .game__body {
    flex: 1;
    display: flex;
    overflow: hidden;
  }

  .game__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .map-placeholder {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    color: #333;
    border: 1px dashed #222;
    margin: 0.5rem;
  }

  .map-placeholder__title {
    font-size: 1rem;
    letter-spacing: 0.25em;
    margin: 0;
  }

  .map-placeholder__sub {
    font-size: 0.65rem;
    opacity: 0.5;
    margin: 0;
    letter-spacing: 0.1em;
  }

  .game__actions {
    display: flex;
    gap: 0.5rem;
    padding: 0.6rem 0.75rem;
    border-top: 1px solid #222;
    flex-wrap: wrap;
    flex-shrink: 0;
  }

  .action-btn {
    padding: 0.45rem 0.9rem;
    background: transparent;
    border: 1px solid var(--color-hope);
    color: var(--color-hope);
    font-family: var(--font-ui);
    font-size: 0.8rem;
    letter-spacing: 0.05em;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }

  .action-btn:hover {
    background: var(--color-hope);
    color: var(--color-bg);
  }

  .game__sidebar {
    width: 260px;
    border-left: 1px solid #222;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    flex-shrink: 0;
  }

  .sidebar__player {
    padding: 0.75rem;
    border-bottom: 1px solid #222;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  .sidebar__name {
    font-weight: 700;
    letter-spacing: 0.1em;
    color: var(--color-hope);
    font-size: 0.9rem;
  }

  .sidebar__stat {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .sidebar__stat-label {
    width: 3.5rem;
    font-size: 0.6rem;
    letter-spacing: 0.08em;
    opacity: 0.5;
    text-transform: uppercase;
  }

  .sidebar__stat-track {
    flex: 1;
    height: 5px;
    background: #2a2a2a;
  }

  .sidebar__stat-fill {
    height: 100%;
    transition: width 0.4s;
  }

  .sidebar__stat-fill--health { background: var(--color-blood); }
  .sidebar__stat-fill--hunger { background: var(--color-hope); }
  .sidebar__stat-fill--fatigue { background: var(--color-infection); }

  .sidebar__stat-val {
    font-size: 0.65rem;
    opacity: 0.5;
    width: 2rem;
    text-align: right;
  }
</style>
