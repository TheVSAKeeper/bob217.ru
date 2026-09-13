<script lang="ts" setup>
import { computed } from 'vue'
import type { MapStats } from '@/composables/useForkMap'
import { plural } from '@/utils/format'

const props = defineProps<{
  counter: number
  stats: MapStats
}>()

const digits = computed(() => String(props.counter).padStart(3, '0').split(''))

const leading = computed(() => {
  const raw = String(props.counter)
  return 3 - raw.length
})

const announce = computed(() =>
  props.counter === props.stats.total
    ? `${props.stats.total} ${plural(props.stats.total, 'репозиторий', 'репозитория', 'репозиториев')}`
    : '',
)
</script>

<template>
  <div class="ov tr">
    <span class="sr-only" aria-live="polite" aria-atomic="true">{{ announce }}</span>
    <div class="cnt">
      <span
        v-for="(d, i) in digits"
        :key="i"
        class="digit"
        :class="{ lead: i < leading }"
        aria-hidden="true"
      >
        <Transition name="roll">
          <span :key="d" class="glyph">{{ d }}</span>
        </Transition>
      </span>
    </div>
    <div class="cnt-lbl">{{ plural(counter, 'репозиторий', 'репозитория', 'репозиториев') }}</div>
    <div class="rule"></div>
    <div class="meta">
      {{ stats.languages }} {{ plural(stats.languages, 'язык', 'языка', 'языков') }} ·
      {{ stats.stars }}★ · {{ stats.forked }}
      {{ plural(stats.forked, 'форк', 'форка', 'форков') }} · {{ stats.merged }} PR ·
      {{ stats.contributors }}
      {{ plural(stats.contributors, 'человек', 'человека', 'человек') }}
    </div>
  </div>
</template>

<style scoped>
.ov {
  position: absolute;
  z-index: 5;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.75);
}

.tr {
  top: var(--spacing-lg);
  right: var(--spacing-lg);
  text-align: right;
}

.cnt {
  display: flex;
  justify-content: flex-end;
  font-family: var(--font-family-mono);
  font-weight: 700;
  font-size: 38px;
  line-height: 1;
  color: var(--color-accent);
}

.digit {
  position: relative;
  display: inline-block;
  width: 0.62em;
  height: 1em;
  overflow: hidden;
}

.digit.lead {
  color: var(--color-text-muted);
  opacity: 0.32;
}

.glyph {
  position: absolute;
  inset: 0;
  display: block;
  text-align: center;
}

.roll-enter-active,
.roll-leave-active {
  transition:
    transform 0.32s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.32s ease;
}

.roll-enter-from {
  transform: translateY(70%);
  opacity: 0;
}

.roll-leave-to {
  transform: translateY(-70%);
  opacity: 0;
}

.cnt-lbl {
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  margin-top: 5px;
}

.rule {
  height: 1px;
  margin: 9px 0 8px auto;
  width: 100%;
  background: linear-gradient(90deg, transparent, var(--color-bg-tertiary));
}

.meta {
  font-family: var(--font-family-mono);
  font-size: 11px;
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
}

@media (prefers-reduced-motion: reduce) {
  .roll-enter-active,
  .roll-leave-active {
    transition: none;
  }
}
</style>
