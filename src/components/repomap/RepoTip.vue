<script lang="ts" setup>
import { computed } from 'vue'
import MapCallout from '@/components/repomap/MapCallout.vue'
import type { TipState } from '@/composables/repoMap/types'
import { langColor } from '@/utils/lang'
import { fmtSize } from '@/utils/format'

const props = defineProps<{
  tip: TipState
  stageW: number
  stageH: number
}>()

const accent = computed(() => langColor(props.tip.repo.lang))

const rows = computed<[string, string][]>(() => {
  const r = props.tip.repo
  const list: [string, string][] = [
    ['звёздная величина', (6 - 2.5 * Math.log10(r.stars + 1)).toFixed(1)],
    ['звёзды', String(r.stars)],
    ['язык', r.lang],
    ['форки', String(r.forks)],
    ['объём', fmtSize(r.sizeKb)],
  ]
  if (r.commits !== null) list.push(['коммиты', String(r.commits)])
  if (r.merged) list.push(['принято PR', String(r.merged)])
  return list
})
</script>

<template>
  <MapCallout
    :x="tip.x"
    :y="tip.y"
    :stage-w="stageW"
    :stage-h="stageH"
    :accent="accent"
    :width="292"
    :pinned="tip.pinned"
  >
    <div class="head">
      <span class="code">{{ tip.code }}</span>
      <span class="dom">{{ tip.repo.domainLabel }}</span>
    </div>
    <div class="nm">
      <i class="bullet"></i>
      {{ tip.repo.name }}
    </div>
    <div class="rule"></div>
    <div v-if="tip.repo.desc" class="ds">{{ tip.repo.desc }}</div>
    <dl class="tbl">
      <div v-for="[key, value] in rows" :key="key" class="row">
        <dt>{{ key }}</dt>
        <i class="fill"></i>
        <dd>{{ value }}</dd>
      </div>
    </dl>
    <div v-if="tip.repo.contributors.length" class="fk">
      <span class="cap">соавторы</span>
      {{ tip.repo.contributors.map((c) => `${c.login} ×${c.merged}`).join(' · ') }}
    </div>
    <a v-if="tip.pinned" class="go" :href="tip.repo.url" target="_blank" rel="noopener noreferrer">
      Открыть на GitHub →
    </a>
  </MapCallout>
</template>

<style scoped>
.head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-family: var(--font-family-mono);
  font-size: 10px;
}

.code {
  font-weight: 700;
  letter-spacing: 0.18em;
  color: color-mix(in srgb, var(--tip-accent) 75%, var(--color-text-primary));
}

.dom {
  letter-spacing: 0.06em;
  color: var(--color-text-muted);
}

.nm {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 4px;
  font-family: var(--font-family-heading);
  font-weight: 600;
  font-size: 14px;
  color: var(--color-text-primary);
  word-break: break-word;
}

.bullet {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--tip-accent);
  box-shadow: 0 0 8px var(--tip-accent);
  flex: none;
}

.rule {
  height: 1px;
  margin: 8px 0;
  background: linear-gradient(90deg, var(--tip-accent), transparent);
  opacity: 0.55;
  transform-origin: left;
  animation: rule 340ms ease both;
}

.ds {
  font-size: 12px;
  line-height: 1.45;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tbl {
  margin: 0;
  font-family: var(--font-family-mono);
  font-size: 11px;
}

.row {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.row + .row {
  margin-top: 3px;
}

dt {
  color: var(--color-text-muted);
  white-space: nowrap;
}

.fill {
  flex: 1;
  height: 0;
  border-bottom: 1px dotted var(--color-text-muted);
  opacity: 0.4;
  transform: translateY(-3px);
}

dd {
  margin: 0;
  color: var(--color-text-primary);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.fk {
  font-family: var(--font-family-mono);
  font-size: 11px;
  color: var(--color-link);
  margin-top: 9px;
  padding-top: 8px;
  border-top: 1px solid var(--color-bg-tertiary);
  line-height: 1.5;
  word-break: break-word;
}

.cap {
  display: block;
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  margin-bottom: 2px;
}

.go {
  display: inline-block;
  margin-top: 10px;
  font-family: var(--font-family-mono);
  font-size: 12px;
  color: var(--color-link);
  text-decoration: none;
  border: 1px solid var(--color-bg-tertiary);
  border-radius: var(--radius-sm);
  padding: 4px 9px;
  transition: border-color var(--transition-fast);
}

.go:hover,
.go:focus-visible {
  border-color: var(--color-link);
}

@keyframes rule {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .rule {
    animation: none;
  }
}
</style>
