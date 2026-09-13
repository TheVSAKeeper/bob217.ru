<script lang="ts" setup>
import MapCallout from '@/components/repomap/MapCallout.vue'
import type { SatTipState } from '@/composables/repoMap/types'
import { fmtDate, plural } from '@/utils/format'

defineProps<{
  tip: SatTipState
  stageW: number
  stageH: number
}>()
</script>

<template>
  <MapCallout
    :x="tip.x"
    :y="tip.y"
    :stage-w="stageW"
    :stage-h="stageH"
    accent="var(--color-accent)"
    :width="226"
  >
    <div class="head">
      <span class="cap">соавтор</span>
      <span class="who">
        <b>{{ tip.login }}</b>
        <span class="role">в {{ tip.repo }}</span>
      </span>
    </div>
    <div class="big">
      <b class="num">{{ tip.merged }}</b>
      <span class="lbl">{{ plural(tip.merged, 'принятый PR', 'принятых PR', 'принятых PR') }}</span>
    </div>
    <div v-if="tip.people > 1" class="share">
      <div class="bar"><i :style="{ width: `${tip.share}%` }"></i></div>
      <div class="srow">
        <span class="pct">{{ tip.share }} %</span>
        <span class="of">
          из {{ tip.people }} {{ plural(tip.people, 'соавтора', 'соавторов', 'соавторов') }}
        </span>
      </div>
    </div>
    <div v-else class="solo">единственный соавтор</div>
    <div v-if="tip.last" class="last">последний {{ fmtDate(tip.last) }}</div>
    <div class="hint">клик – профиль на github</div>
  </MapCallout>
</template>

<style scoped>
.head {
  font-family: var(--font-family-mono);
  font-size: 12px;
  color: var(--color-text-muted);
  word-break: break-word;
}

.who {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 2px 6px;
}

.cap {
  display: block;
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--tip-accent);
  margin-bottom: 3px;
}

b {
  color: var(--color-text-primary);
  font-weight: 600;
}

.role {
  color: var(--color-text-muted);
}

.big {
  display: flex;
  align-items: baseline;
  gap: 7px;
  margin-top: 8px;
  font-family: var(--font-family-mono);
}

.num {
  font-size: 24px;
  font-weight: 700;
  line-height: 1;
  color: var(--tip-accent);
  font-variant-numeric: tabular-nums;
}

.lbl {
  font-size: 11px;
  color: var(--color-text-secondary);
}

.share {
  margin-top: 9px;
}

.bar {
  height: 4px;
  border-radius: 2px;
  background: var(--color-bg-tertiary);
  overflow: hidden;
}

.bar i {
  display: block;
  height: 100%;
  border-radius: 2px;
  background: var(--tip-accent);
  box-shadow: 0 0 10px -2px var(--tip-accent);
  transform-origin: left;
  animation: grow 420ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.srow {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-top: 4px;
  font-family: var(--font-family-mono);
  font-size: 11px;
}

.pct {
  color: var(--color-text-primary);
  font-variant-numeric: tabular-nums;
}

.of,
.solo,
.last,
.hint {
  font-family: var(--font-family-mono);
  font-size: 11px;
  color: var(--color-text-muted);
}

.solo {
  margin-top: 9px;
}

.last {
  margin-top: 6px;
  color: var(--color-text-secondary);
}

.hint {
  margin-top: 7px;
  font-size: 10px;
  opacity: 0.75;
}

@keyframes grow {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .bar i {
    animation: none;
  }
}
</style>
