<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'
import type { CoreTipState } from '@/composables/repoMap/types'
import { OWNER, type MapStats } from '@/composables/useForkMap'
import { plural } from '@/utils/format'

const props = defineProps<{
  tip: CoreTipState
  stats: MapStats
  stageW: number
  stageH: number
}>()

const LIFT = 52
const EDGE = 8

const tipEl = useTemplateRef<HTMLElement>('tipBox')
const boxW = ref(0)
const boxH = ref(0)
let observer: ResizeObserver | null = null

const measure = (): void => {
  if (!tipEl.value) return
  boxW.value = tipEl.value.offsetWidth
  boxH.value = tipEl.value.offsetHeight
}

onMounted(() => {
  measure()
  if (!tipEl.value) return
  observer = new ResizeObserver(measure)
  observer.observe(tipEl.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})

const fit = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), Math.max(min, max))

const style = computed(() => {
  const half = boxW.value / 2
  const left =
    props.stageW > 0 && boxW.value > 0
      ? fit(props.tip.x, EDGE + half, props.stageW - EDGE - half)
      : props.tip.x
  const top =
    props.stageH > 0 && boxH.value > 0
      ? fit(props.tip.y - LIFT, EDGE + boxH.value, props.stageH - EDGE)
      : props.tip.y - LIFT
  return { left: `${left}px`, top: `${top}px` }
})

const cells = computed<[number, string][]>(() => [
  [props.stats.total, plural(props.stats.total, 'репозиторий', 'репозитория', 'репозиториев')],
  [props.stats.stars, plural(props.stats.stars, 'звезда', 'звезды', 'звёзд')],
  [props.stats.merged, 'принятых PR'],
])
</script>

<template>
  <div ref="tipBox" class="coretip" :style="style">
    <div class="nm">@{{ OWNER }}</div>
    <div class="rule"></div>
    <div class="grid">
      <div v-for="[value, label] in cells" :key="label" class="cell">
        <b>{{ value }}</b>
        <span>{{ label }}</span>
      </div>
    </div>
    <div class="meta">
      {{ stats.forked }} форкнуто · {{ stats.contributors }}
      {{ plural(stats.contributors, 'соавтор', 'соавтора', 'соавторов') }} · {{ stats.languages }}
      {{ plural(stats.languages, 'язык', 'языка', 'языков') }}
    </div>
    <div class="hint">клик – вернуться к обзору</div>
  </div>
</template>

<style scoped>
.coretip {
  position: absolute;
  z-index: var(--z-tooltip);
  pointer-events: none;
  background: rgba(24, 24, 27, 0.92);
  -webkit-backdrop-filter: blur(5px);
  backdrop-filter: blur(5px);
  border: 1px solid var(--color-accent);
  border-radius: var(--radius-md);
  padding: 10px 16px 11px;
  text-align: center;
  box-shadow:
    var(--shadow-lg),
    0 0 26px -6px rgba(255, 204, 0, 0.55);
  white-space: nowrap;
  transform: translate(-50%, -100%);
  transform-origin: 50% 100%;
  animation: rise 190ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.nm {
  font-family: var(--font-family-mono);
  font-weight: 700;
  font-size: 13px;
  letter-spacing: 0.14em;
  color: var(--color-accent);
}

.rule {
  height: 1px;
  margin: 8px 0 9px;
  background: linear-gradient(90deg, transparent, var(--color-accent), transparent);
  opacity: 0.6;
}

.grid {
  display: flex;
  gap: 18px;
  justify-content: center;
}

.cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}

.cell b {
  font-family: var(--font-family-mono);
  font-weight: 700;
  font-size: 22px;
  line-height: 1;
  color: var(--color-text-primary);
  font-variant-numeric: tabular-nums;
}

.cell span {
  font-family: var(--font-family-mono);
  font-size: 9px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.meta {
  font-family: var(--font-family-mono);
  font-size: 11px;
  color: var(--color-text-secondary);
  margin-top: 10px;
  font-variant-numeric: tabular-nums;
}

.hint {
  font-family: var(--font-family-mono);
  font-size: 10px;
  color: var(--color-text-muted);
  margin-top: 5px;
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translate(-50%, -100%) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -100%) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .coretip {
    animation: none;
  }
}
</style>
