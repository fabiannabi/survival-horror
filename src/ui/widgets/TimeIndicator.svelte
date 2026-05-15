<script lang="ts">
  import { gameTime } from '../../stores/timeStore';
  import { TimeSystem } from '../../engine/core/TimeSystem';

  const PHASE_ICON: Record<string, string> = {
    dawn: '↑',
    day: '●',
    dusk: '↓',
    night: '○',
  };
</script>

<div class="time-indicator" data-phase={$gameTime.phase}>
  <span class="time-indicator__icon">{PHASE_ICON[$gameTime.phase]}</span>
  <div class="time-indicator__center">
    <span class="time-indicator__day">DÍA {$gameTime.day}</span>
    <span class="time-indicator__clock">
      {String($gameTime.hour).padStart(2, '0')}:{String($gameTime.minute).padStart(2, '0')}
    </span>
  </div>
  <span class="time-indicator__phase">{TimeSystem.phaseLabel($gameTime.phase)}</span>
</div>

<style>
  .time-indicator {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.6rem 1rem;
    background: var(--color-fog);
    border-bottom: 1px solid var(--color-hope);
    font-family: var(--font-ui);
    user-select: none;
  }

  .time-indicator__icon {
    font-size: 1.1rem;
    color: var(--color-hope);
    width: 1rem;
    text-align: center;
  }

  .time-indicator__center {
    display: flex;
    flex-direction: column;
  }

  .time-indicator__day {
    font-size: 0.6rem;
    letter-spacing: 0.15em;
    color: var(--color-text);
    opacity: 0.5;
  }

  .time-indicator__clock {
    font-size: 1.35rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: var(--color-hope);
    line-height: 1;
  }

  .time-indicator__phase {
    font-size: 0.7rem;
    letter-spacing: 0.12em;
    color: var(--color-text);
    opacity: 0.6;
    text-transform: uppercase;
    margin-left: auto;
  }

  [data-phase='night'] { border-color: #5a5a8a; }
  [data-phase='night'] .time-indicator__icon,
  [data-phase='night'] .time-indicator__clock { color: #8888cc; }

  [data-phase='dawn'],
  [data-phase='dusk'] { border-color: #c97a30; }
  [data-phase='dawn'] .time-indicator__icon,
  [data-phase='dawn'] .time-indicator__clock,
  [data-phase='dusk'] .time-indicator__icon,
  [data-phase='dusk'] .time-indicator__clock { color: #c97a30; }
</style>
