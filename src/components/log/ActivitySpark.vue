<script lang="ts" setup>
import { computed } from 'vue'
import type { SparkBar } from '@/composables/useCommitLog'
import { plural } from '@/utils/format'

const props = defineProps<{
  bars: SparkBar[]
}>()

const peak = computed(() => props.bars.reduce((max, bar) => Math.max(max, bar.count), 0))

const span = computed(() => {
  const first = props.bars[0]
  const last = props.bars[props.bars.length - 1]
  return first && last ? `${first.label} … ${last.label}` : ''
})
</script>

<template>
  <figure class="spark">
    <figcaption class="cap">
      <span class="dim">активность по дням</span>
      <span class="range">{{ span }}</span>
    </figcaption>

    <div class="bars typed" aria-hidden="true" :style="{ '--n': bars.length }">
      <i
        v-for="(bar, i) in bars"
        :key="bar.key"
        class="bar"
        :class="{ peak: bar.count === peak }"
        :style="{
          '--h': `${Math.max(bar.level * 100, 7)}%`,
          '--lvl': bar.level,
          '--x': bars.length > 1 ? i / (bars.length - 1) : 0.5,
        }"
      >
        <b class="tip">{{ bar.label }} · {{ bar.count }}</b>
      </i>
    </div>

    <p class="sr-only">
      пик – {{ peak }} {{ plural(peak, 'коммит', 'коммита', 'коммитов') }} за день, окно
      {{ span }}
    </p>
  </figure>
</template>

<style scoped>
.spark {
  margin: 0;
}

.cap {
  display: flex;
  justify-content: space-between;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xs);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.range {
  white-space: nowrap;
  color: var(--color-text-tertiary);
}

.bars {
  display: flex;
  align-items: flex-end;
  gap: min(2px, 100% / var(--n, 1) / 3);
  height: 58px;
  padding-bottom: 1px;
  border-bottom: 1px solid var(--color-bg-tertiary);
  animation-duration: 0.8s;
  animation-timing-function: steps(28, end);
}

.bar {
  position: relative;
  flex: 1;
  min-width: 0;
  height: var(--h);
  border-radius: 1px 1px 0 0;
  background: color-mix(
    in srgb,
    var(--color-accent) calc(22% + var(--lvl) * 78%),
    var(--color-bg-tertiary)
  );
  opacity: 0.8;
  transition:
    opacity var(--transition-fast),
    filter var(--transition-fast);
}

.bar.peak {
  box-shadow: 0 0 12px rgba(255, 204, 0, 0.35);
}

.bar:hover {
  opacity: 1;
  filter: brightness(1.35);
}

.tip {
  position: absolute;
  bottom: calc(100% + 6px);
  left: calc(var(--x) * 100%);
  z-index: var(--z-tooltip);
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
  pointer-events: none;
  transition:
    opacity var(--transition-fast),
    transform var(--transition-fast);
}

.bar:hover .tip {
  opacity: 1;
  transform: translate(calc(var(--x) * -100%), 0);
}

@media (max-width: 720px) {
  .bars {
    height: 44px;
  }

  .range {
    display: none;
  }
}
</style>
