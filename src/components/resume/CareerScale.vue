<script lang="ts" setup>
import { computed } from 'vue'
import type { CareerScale, ScaleSegment } from '@/composables/useResume'

const props = defineProps<{
  scale: CareerScale
  active: string | null
}>()

const emit = defineEmits<{
  (e: 'pick', id: string | null): void
}>()

const picked = computed<ScaleSegment | undefined>(() =>
  props.scale.segments.find((segment) => segment.id === props.active),
)
</script>

<template>
  <figure class="scale">
    <div class="track">
      <a
        v-for="(segment, i) in scale.segments"
        :key="segment.id"
        class="seg"
        :class="{ 'is-current': segment.current, 'is-active': segment.id === active }"
        :href="`#job-${segment.id}`"
        :style="{
          left: `${segment.left}%`,
          width: `${segment.width}%`,
          '--n': scale.segments.length - 1 - i,
        }"
        @mouseenter="emit('pick', segment.id)"
        @mouseleave="emit('pick', null)"
        @focus="emit('pick', segment.id)"
        @blur="emit('pick', null)"
      >
        <span class="seg-label">{{ segment.label }}</span>
        <span class="sr-only">, {{ segment.period }}, {{ segment.span }}</span>
      </a>
    </div>

    <div class="ticks" aria-hidden="true">
      <span
        v-for="(tick, i) in scale.ticks"
        :key="tick.key"
        class="tick"
        :class="{ 'is-labelled': tick.labelled, 'is-now': tick.key === 'now' }"
        :style="{ left: `${tick.left}%`, '--n': scale.ticks.length - 1 - i }"
      >
        <i></i>
        <b v-if="tick.label">{{ tick.label }}</b>
      </span>
    </div>

    <figcaption class="caption typed">
      <span :key="active ?? 'idle'" class="caption-line">
        <template v-if="picked">
          <span class="ref" :class="{ 'is-current': picked.current }">job/{{ picked.label }}</span>
          {{ picked.period }} · {{ picked.span }}
        </template>
        <slot v-else />
      </span>
    </figcaption>
  </figure>
</template>

<style scoped>
.scale {
  margin: 0 0 var(--spacing-xl);
}

.track {
  position: relative;
  height: 26px;
  border-radius: var(--radius-sm);
  background: var(--color-bg-secondary);
  overflow: hidden;
}

.seg {
  position: absolute;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  padding: 0 var(--spacing-sm);
  overflow: hidden;
  background: #4a4a4a;
  border-left: 2px solid var(--color-bg-primary);
  text-decoration: none;
  transition: filter var(--transition-fast);
  transform-origin: right center;
  animation: seg-grow 0.42s cubic-bezier(0.16, 1, 0.3, 1) backwards;
  animation-delay: calc(140ms + var(--n) * 110ms);
}

.seg:first-child {
  border-left: 0;
}

.seg.is-current {
  background: var(--color-accent);
  box-shadow: var(--shadow-glow);
}

.seg.is-active {
  filter: brightness(1.3);
}

.seg:focus-visible {
  outline: 2px solid var(--color-link);
  outline-offset: -2px;
}

@keyframes seg-grow {
  from {
    transform: scaleX(0);
  }
}

.seg-label {
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
  letter-spacing: 0.04em;
  white-space: nowrap;
  color: var(--color-text-secondary);
}

.seg.is-current .seg-label {
  font-weight: 700;
  color: var(--color-bg-primary);
}

.ticks {
  position: relative;
  height: 20px;
}

.tick {
  position: absolute;
  top: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
  animation: tick-in 0.3s ease-out backwards;
  animation-delay: calc(200ms + var(--n) * 24ms);
}

@keyframes tick-in {
  from {
    opacity: 0;
  }
}

.tick i {
  width: 1px;
  height: 4px;
  background: var(--color-bg-tertiary);
}

.tick.is-labelled i {
  height: 6px;
  background: var(--color-text-muted);
}

.tick b {
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
  font-weight: 400;
  color: var(--color-text-muted);
}

.tick.is-now {
  align-items: flex-end;
  transform: translateX(-100%);
}

.tick.is-now i {
  background: var(--color-accent);
}

.tick.is-now b {
  color: var(--color-accent);
}

.caption {
  --trail: 520ms;
  margin: var(--spacing-md) 0 0;
  padding-bottom: var(--spacing-md);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  border-bottom: 1px solid var(--color-bg-tertiary);
}

.caption-line {
  animation: line-swap 0.18s ease-out;
}

@keyframes line-swap {
  from {
    opacity: 0.25;
  }
}

.ref {
  margin-right: var(--spacing-xs);
  color: var(--color-link);
}

.ref.is-current {
  color: var(--color-accent);
}

@media (max-width: 720px) {
  .track {
    height: 18px;
  }

  .seg-label {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .seg,
  .tick,
  .caption-line {
    animation: none;
  }
}
</style>
