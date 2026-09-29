<script lang="ts" setup>
import type { AgeDot } from '@/composables/useIssues'

const TICKS = [0.25, 0.5, 0.75]

defineProps<{
  dots: AgeDot[]
  oldestLabel: string
}>()
</script>

<template>
  <figure class="scale">
    <figcaption class="cap">
      <span>возраст открытых задач</span>
      <span class="hint">каждая точка – задача</span>
    </figcaption>

    <div class="track typed" aria-hidden="true">
      <i class="axis"></i>
      <i v-for="tick in TICKS" :key="tick" class="tick" :style="{ '--x': tick }"></i>
      <i
        v-for="dot in dots"
        :key="dot.id"
        class="dot"
        :class="{ stale: dot.level > 0.66 }"
        :style="{ '--x': dot.x, '--row': dot.row, '--lvl': dot.level }"
      >
        <b class="tip">{{ dot.label }}</b>
      </i>
    </div>

    <div class="ends">
      <span>сегодня</span>
      <span class="old">{{ oldestLabel }}</span>
    </div>

    <p class="sr-only">
      шкала возраста: {{ dots.length }} задач, самая старая открыта {{ oldestLabel }} назад
    </p>
  </figure>
</template>

<style scoped>
.scale {
  margin: 0;
}

.cap,
.ends {
  display: flex;
  justify-content: space-between;
  gap: var(--spacing-md);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.cap {
  margin-bottom: var(--spacing-sm);
}

.hint {
  color: var(--color-text-tertiary);
}

.ends {
  margin-top: var(--spacing-xs);
}

.old {
  color: var(--color-danger);
}

.track {
  position: relative;
  height: 54px;
  padding: 0 5px;
  animation-duration: 0.8s;
  animation-timing-function: steps(28, end);
}

.axis {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 9px;
  height: 2px;
  border-radius: var(--radius-full);
  background: linear-gradient(
    90deg,
    var(--color-link),
    color-mix(in srgb, var(--color-danger) 70%, var(--color-link)),
    var(--color-danger)
  );
  opacity: 0.45;
}

.tick {
  position: absolute;
  bottom: 4px;
  left: calc(var(--x) * 100%);
  width: 1px;
  height: 12px;
  background: var(--color-bg-tertiary);
}

.dot {
  position: absolute;
  bottom: calc(5px + var(--row) * 12px);
  left: calc(var(--x) * (100% - 10px));
  width: 10px;
  height: 10px;
  border-radius: 50%;
  color: color-mix(in srgb, var(--color-danger) calc(var(--lvl) * 100%), var(--color-link));
  background: currentcolor;
  box-shadow:
    0 0 0 2px var(--color-bg-primary),
    0 0 10px color-mix(in srgb, currentcolor 55%, transparent);
  transition: transform var(--transition-fast);
}

.dot::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 8px;
  width: 1px;
  height: calc(var(--row) * 12px);
  background: currentcolor;
  opacity: 0.4;
  transform: translateX(-50%);
}

.dot:hover {
  z-index: var(--z-dropdown);
  transform: scale(1.4);
}

.dot.stale::after {
  content: '';
  position: absolute;
  inset: -4px;
  border: 1px solid currentcolor;
  border-radius: 50%;
  opacity: 0.55;
}

.tip {
  position: absolute;
  bottom: calc(100% + 6px);
  left: calc(var(--x) * 100%);
  padding: 2px var(--spacing-sm);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
  font-weight: 400;
  white-space: nowrap;
  color: var(--color-text-primary);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-bg-tertiary);
  border-radius: var(--radius-sm);
  opacity: 0;
  transform: translate(calc(var(--x) * -100%), 4px);
  transform-origin: calc(var(--x) * 100%) 100%;
  pointer-events: none;
  transition:
    opacity var(--transition-fast),
    transform var(--transition-fast);
}

.dot:hover .tip {
  opacity: 1;
  transform: translate(calc(var(--x) * -100%), 0) scale(0.72);
}
</style>
