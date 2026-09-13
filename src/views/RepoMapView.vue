<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import ContributorTip from '@/components/repomap/ContributorTip.vue'
import CoreTip from '@/components/repomap/CoreTip.vue'
import MapBoot from '@/components/repomap/MapBoot.vue'
import MapControls from '@/components/repomap/MapControls.vue'
import MapCounter from '@/components/repomap/MapCounter.vue'
import MapLegend from '@/components/repomap/MapLegend.vue'
import MapNodeList from '@/components/repomap/MapNodeList.vue'
import RepoTip from '@/components/repomap/RepoTip.vue'
import { useForkMap, type SizeBy } from '@/composables/useForkMap'
import { useRepoMapScene } from '@/composables/useRepoMapScene'

const {
  repos,
  stats,
  langCounts,
  load,
  error,
  loadCommits,
  commitsState,
  commitsDone,
  stage: loadStage,
  foundRepos,
  foundPulls,
  staleAt,
} = useForkMap()

const filt = ref<'all' | 'forked'>('all')
const flowLayer = ref(false)
const langOff = ref<Set<string>>(new Set())
const sizeBy = ref<SizeBy>('stars')

const { tip, satTip, coreTip, counter, mount, pulse, rebuild, focusRepo, resetHome } =
  useRepoMapScene({
    repos,
    filt,
    flowLayer,
    langOff,
    sizeBy,
  })

const canvas = ref<HTMLCanvasElement | null>(null)
const stage = ref<HTMLElement | null>(null)
const stageW = ref(0)
const stageH = ref(0)
let cleanup: (() => void) | null = null

const measure = (): void => {
  if (!stage.value) return
  stageW.value = stage.value.clientWidth
  stageH.value = stage.value.clientHeight
}

const setFilt = (v: 'all' | 'forked'): void => {
  filt.value = v
  pulse()
}

const toggleFlow = (): void => {
  flowLayer.value = !flowLayer.value
  pulse()
}

const setSize = (v: SizeBy): void => {
  if (v === 'commits') void loadCommits()
  if (sizeBy.value === v) return
  sizeBy.value = v
  pulse()
}

const toggleLang = (lang: string): void => {
  const next = new Set(langOff.value)
  if (next.has(lang)) next.delete(lang)
  else next.add(lang)
  langOff.value = next
}

const SIZE_HINT: Record<SizeBy, string> = {
  stars: 'радиус узла = число звёзд',
  forks: 'радиус узла = число форков',
  merged: 'радиус узла = принятых PR',
  size: 'радиус узла = вес репозитория',
  commits: 'радиус узла = число коммитов',
}

const sizeHint = computed(() => {
  if (sizeBy.value !== 'commits') return SIZE_HINT[sizeBy.value]
  if (commitsState.value === 'loading')
    return `считаю коммиты: ${commitsDone.value} / ${repos.value.length}`
  if (commitsState.value === 'partial')
    return 'коммиты частично: часть запросов не прошла, клик повторит'
  return SIZE_HINT.commits
})

const forkedCount = computed(() => repos.value.filter((r) => r.forks > 0).length)

const visibleRepos = computed(() =>
  repos.value.filter((r) => {
    if (filt.value === 'forked' && r.forks === 0) return false
    return !(langOff.value.size > 0 && langOff.value.has(r.lang))
  }),
)

const booting = computed(() => loadStage.value === 'repos' || loadStage.value === 'pulls')

let scanTimer: number | undefined
watch(booting, (on) => {
  if (on) scanTimer = window.setInterval(pulse, 1100)
  else {
    window.clearInterval(scanTimer)
    scanTimer = undefined
  }
})

onMounted(() => {
  measure()
  window.addEventListener('resize', measure)
  if (canvas.value) cleanup = mount(canvas.value)
  load()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', measure)
  window.clearInterval(scanTimer)
  cleanup?.()
})
</script>

<template>
  <div ref="stage" class="stage">
    <canvas
      ref="canvas"
      class="map-canvas"
      role="img"
      aria-label="карта репозиториев: узлы – репозитории, спутники – соавторы"
    ></canvas>

    <Transition name="boot">
      <MapBoot v-if="booting" :repos="foundRepos" :pulls="foundPulls" />
    </Transition>

    <MapControls
      :filt="filt"
      :flow-layer="flowLayer"
      :size-by="sizeBy"
      :total="stats.total"
      :forked="forkedCount"
      :size-hint="sizeHint"
      :error="error"
      :stale-at="staleAt"
      @update:filt="setFilt"
      @update:size-by="setSize"
      @toggle-flow="toggleFlow"
      @rebuild="rebuild"
    />

    <MapCounter :counter="counter" :stats="stats" />

    <MapLegend :langs="langCounts" :off="langOff" @toggle="toggleLang" />

    <MapNodeList :repos="visibleRepos" @focus="focusRepo" @home="resetHome" />

    <div class="ov br">scroll – зум · drag – пан · клик по узлу – фокус · клик по ядру – обзор</div>

    <RepoTip v-if="tip" :tip="tip" :stage-w="stageW" :stage-h="stageH" />

    <ContributorTip v-if="satTip && !tip" :tip="satTip" :stage-w="stageW" :stage-h="stageH" />

    <CoreTip
      v-if="coreTip && !tip && !satTip"
      :tip="coreTip"
      :stats="stats"
      :stage-w="stageW"
      :stage-h="stageH"
    />
  </div>
</template>

<style scoped>
.stage {
  position: relative;
  width: 100%;
  height: calc(100dvh - var(--nav-height));
  overflow: hidden;
  background: radial-gradient(circle at 50% 46%, #1b1c22 0%, #131316 55%, #0e0e10 100%);
}

.map-canvas {
  position: absolute;
  inset: 0;
  display: block;
  cursor: grab;
  touch-action: none;
}

.map-canvas.grabbing {
  cursor: grabbing;
}

.map-canvas.pointing {
  cursor: pointer;
}

.ov {
  position: absolute;
  z-index: 5;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.75);
}

.br {
  bottom: var(--spacing-md);
  right: var(--spacing-lg);
  font-family: var(--font-family-mono);
  font-size: 11px;
  color: var(--color-text-tertiary);
  text-align: right;
  max-width: 46%;
}

.boot-enter-active,
.boot-leave-active {
  transition: opacity var(--transition-base);
}

.boot-enter-from,
.boot-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .boot-enter-active,
  .boot-leave-active {
    transition: none;
  }
}

@media (max-width: 720px) {
  .br {
    font-size: 10px;
    max-width: 60%;
  }
}
</style>
