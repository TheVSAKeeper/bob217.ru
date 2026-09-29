<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'

const props = defineProps<{
  x: number
  y: number
  stageW: number
  stageH: number
  accent: string
  width: number
  pinned?: boolean
}>()

const LEAD_X = 34
const LEAD_Y = 24
const GAP = 13
const EDGE = 8

const cardEl = useTemplateRef<HTMLElement>('cardBox')
const cardW = ref(0)
const cardH = ref(0)
let observer: ResizeObserver | null = null

const measure = (): void => {
  if (!cardEl.value) return
  cardW.value = cardEl.value.offsetWidth
  cardH.value = cardEl.value.offsetHeight
}

onMounted(() => {
  measure()
  if (!cardEl.value) return
  observer = new ResizeObserver(measure)
  observer.observe(cardEl.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})

const size = computed(() => ({
  w: cardW.value || props.width,
  h: cardH.value,
}))

const flip = computed(() => ({
  x: props.stageW > 0 && props.x + LEAD_X + size.value.w > props.stageW,
  y: props.stageH > 0 && props.y + LEAD_Y + size.value.h > props.stageH,
}))

const lead = computed(() => ({
  x: flip.value.x ? -LEAD_X - size.value.w : LEAD_X,
  y: flip.value.y ? -LEAD_Y - size.value.h : LEAD_Y,
}))

const clampAxis = (near: number, extent: number, stage: number): number => {
  if (stage <= 0 || extent <= 0) return 0
  const far = near + extent
  if (far > stage - EDGE) return Math.max(stage - EDGE - far, EDGE - near)
  if (near < EDGE) return Math.min(EDGE - near, stage - EDGE - far)
  return 0
}

const shift = computed(() => ({
  x: clampAxis(props.x + lead.value.x, size.value.w, props.stageW),
  y: clampAxis(props.y + lead.value.y, size.value.h, props.stageH),
}))

const root = computed(() => ({
  left: `${props.x}px`,
  top: `${props.y}px`,
  '--tip-accent': props.accent,
  '--tip-w': `${props.width}px`,
}))

const card = computed(() => ({
  left: `${flip.value.x ? -LEAD_X : LEAD_X}px`,
  top: `${flip.value.y ? -LEAD_Y : LEAD_Y}px`,
  transform: `translate(calc(${flip.value.x ? '-100%' : '0px'} + ${shift.value.x}px), calc(${
    flip.value.y ? '-100%' : '0px'
  } + ${shift.value.y}px))`,
}))

const wire = computed(() => {
  const x0 = lead.value.x + shift.value.x
  const y0 = lead.value.y + shift.value.y
  const x1 = x0 + size.value.w
  const y1 = y0 + size.value.h
  const dx = Math.abs(x0) <= Math.abs(x1) ? x0 : x1
  const dy = Math.abs(y0) <= Math.abs(y1) ? y0 : y1
  const len = Math.hypot(dx, dy)
  if (len === 0) return { x1: 0, y1: 0, x2: 0, y2: 0 }
  const k = Math.min(GAP / len, 1)
  return { x1: dx * k, y1: dy * k, x2: dx, y2: dy }
})
</script>

<template>
  <div class="callout" :style="root">
    <svg class="wire" width="1" height="1" aria-hidden="true">
      <line :x1="wire.x1" :y1="wire.y1" :x2="wire.x2" :y2="wire.y2" />
    </svg>
    <div ref="cardBox" class="card" :class="{ pin: pinned }" :style="card">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.callout {
  position: absolute;
  z-index: var(--z-tooltip);
  width: 0;
  height: 0;
  pointer-events: none;
  transform-origin: 0 0;
  animation: pop 170ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.wire {
  position: absolute;
  left: 0;
  top: 0;
  overflow: visible;
}

.wire line {
  stroke: var(--tip-accent);
  stroke-width: 1.2;
  opacity: 0.8;
  stroke-dasharray: 64;
  animation: draw 280ms ease both;
}

.card {
  position: absolute;
  width: var(--tip-w);
  padding: 10px 13px 11px;
  background: rgba(24, 24, 27, 0.92);
  -webkit-backdrop-filter: blur(5px);
  backdrop-filter: blur(5px);
  border: 1px solid var(--color-bg-tertiary);
  border-radius: var(--radius-md);
  box-shadow:
    var(--shadow-lg),
    0 0 24px -8px var(--tip-accent);
  overflow: hidden;
}

.card.pin {
  pointer-events: auto;
  border-color: var(--tip-accent);
  animation: snap 460ms ease both;
}

@keyframes pop {
  from {
    opacity: 0;
    transform: scale(0.94);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes draw {
  from {
    stroke-dashoffset: 64;
  }
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes snap {
  0% {
    box-shadow:
      var(--shadow-lg),
      0 0 0 3px rgba(255, 204, 0, 0.45);
  }
  100% {
    box-shadow:
      var(--shadow-lg),
      0 0 24px -8px var(--tip-accent);
  }
}

@media (max-width: 720px) {
  .card {
    width: min(var(--tip-w), 74vw);
  }
}

@media (prefers-reduced-motion: reduce) {
  .callout,
  .wire line,
  .card.pin {
    animation: none;
  }
}
</style>
