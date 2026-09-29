<script lang="ts" setup>
import { computed, onMounted } from 'vue'
import CmdLine from '@/components/CmdLine.vue'
import ActivitySpark from '@/components/log/ActivitySpark.vue'
import GraphLanes from '@/components/log/GraphLanes.vue'
import LogEntry from '@/components/log/LogEntry.vue'
import StatStrip from '@/components/stats/StatStrip.vue'
import TermLines from '@/components/TermLines.vue'
import { useCmdRun } from '@/composables/useCmdRun'
import { useCommitLog } from '@/composables/useCommitLog'
import type { StatItem } from '@/types/stat'
import { plural } from '@/utils/format'

type LogState = 'boot' | 'error' | 'empty' | 'ready'

const BOOT_LINES = [
  'remote: Enumerating objects…',
  'remote: Counting objects…',
  'Receiving objects…',
]

const { rows, laneCount, spark, stats, total, loading, loaded, error, hasMore, load, more } =
  useCommitLog()

const railWidth = computed(() => `calc(var(--lane-w) * ${Math.max(laneCount.value, 2)})`)

const view = computed<LogState>(() => {
  if (rows.value.length) return 'ready'
  if (error.value) return 'error'
  return loaded.value ? 'empty' : 'boot'
})

const headKey = computed(() => rows.value.find((row) => row.kind === 'commit')?.key ?? '')

const metrics = computed<StatItem[]>(() => [
  { key: 'commits', value: stats.value.commits, label: 'коммитов в окне', accent: true },
  { key: 'repos', value: stats.value.repos, label: 'репозиториев' },
  { key: 'authors', value: stats.value.authors, label: 'авторов' },
  { key: 'days', value: stats.value.days, label: 'дней с коммитами' },
])

const peakDay = computed(() => spark.value.reduce((max, bar) => Math.max(max, bar.count), 0))

const progress = computed(() =>
  total.value ? Math.max(1, Math.round((stats.value.commits / total.value) * 100)) : 0,
)

const { runKey, running, begin, finish } = useCmdRun()

onMounted(load)
</script>

<template>
  <div class="log">
    <div class="log-container" :style="{ '--rail-w': railWidth }">
      <header class="log-header">
        <CmdLine @run="begin" @done="finish"
          >git log --graph --oneline --all --author-date-order</CmdLine
        >
        <h1>Лента коммитов</h1>
        <p class="lede">
          всё, что попадает в репозитории
          <a href="https://github.com/MaxNagibator" target="_blank" rel="noopener noreferrer"
            >MaxNagibator</a
          >, включая коммиты соавторов – свежие сверху
        </p>
      </header>

      <div class="stage" :class="{ running }">
        <TermLines v-if="view === 'boot' || running" :lines="BOOT_LINES" class="boot" />

        <div :key="runKey" class="out">
          <template v-if="view === 'ready'">
            <StatStrip :items="metrics" class="strip" />
            <ActivitySpark :bars="spark" class="spark" />
          </template>

          <p class="status">
            <template v-if="view === 'ready'">
              пик – {{ peakDay }} {{ plural(peakDay, 'коммит', 'коммита', 'коммитов') }} за день
              <span v-if="error" class="stale">· {{ error }}</span>
            </template>
          </p>

          <ol class="graph">
            <template v-for="(row, i) in rows" :key="row.key">
              <li
                v-if="row.kind === 'day'"
                class="row day"
                :style="{ '--i': i, '--trail': `min(calc(${i} * 22ms), 520ms)` }"
              >
                <GraphLanes :lanes="row.lanes" />
                <p class="day-label typed">
                  <span class="hash">##</span>
                  <span class="date">{{ row.label }}</span>
                  <i class="fill" aria-hidden="true"></i>
                  <span class="count" :class="{ busy: row.count >= 10 }"
                    >{{ row.count }} {{ plural(row.count, 'коммит', 'коммита', 'коммитов') }}</span
                  >
                </p>
              </li>
              <LogEntry v-else :row="row" :index="i" :head="row.key === headKey" />
            </template>

            <li v-if="view === 'error'" class="row fail">
              <span class="rail" aria-hidden="true"></span>
              <div class="fail-body">
                <p class="fatal"><span class="kw">fatal:</span> {{ error }}</p>
                <button class="cmd-btn" @click="load">
                  <span class="p">$</span> {{ loading ? 'повторяю…' : 'повторить' }}
                </button>
              </div>
            </li>

            <li v-else-if="view === 'empty'" class="row note">
              <span class="rail" aria-hidden="true"></span>
              <p class="note-text"># история пуста – ни одного коммита за период</p>
            </li>

            <li v-else-if="view === 'ready'" class="row tail">
              <span class="rail" aria-hidden="true"><i class="dots"></i></span>
              <p class="tail-text">история продолжается за горизонтом страницы</p>
            </li>
          </ol>

          <div v-if="view === 'ready'" class="foot">
            <p class="receive">
              <span class="line"
                >Receiving objects: <span class="pct">{{ progress }}%</span> ({{ stats.commits }}/{{
                  total
                }})</span
              >
              <i class="track" aria-hidden="true"
                ><i :key="progress" class="bar" :style="{ '--w': `${progress}%` }"></i
              ></i>
            </p>
            <button v-if="hasMore" class="cmd-btn" :disabled="loading" @click="more">
              <span class="p">$</span> {{ loading ? 'читаю…' : 'ещё 100 коммитов' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.log {
  min-height: 100vh;
  padding: var(--spacing-xl);
}

.log-container {
  --lane-w: 15px;
  --node-y: 15px;

  width: 100%;
  max-width: 860px;
  margin: 0 auto;
}

.log-header {
  margin-bottom: var(--spacing-lg);
}

.log-header h1 {
  margin: 0;
}

.lede {
  max-width: 58ch;
  margin: var(--spacing-sm) auto 0;
  text-align: center;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.stage {
  position: relative;
  min-height: 120px;
}

.stage .boot {
  position: absolute;
  top: 0;
  left: 0;
}

.stage.running .out {
  visibility: hidden;
}

.strip {
  margin-bottom: var(--spacing-lg);
}

.spark {
  margin-bottom: var(--spacing-sm);
}

.status {
  min-height: 1.4em;
  margin: 0 0 var(--spacing-lg);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.stale {
  color: var(--color-danger);
}

.graph {
  margin: 0;
  padding: 0;
  list-style: none;
}

.row {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--spacing-md);
}

.rail {
  width: var(--rail-w);
}

.day {
  margin-top: var(--spacing-lg);
}

.day:first-child {
  margin-top: 0;
}

.day-label {
  position: sticky;
  top: calc(var(--nav-height) + var(--spacing-xs));
  z-index: 1;
  display: flex;
  align-items: baseline;
  gap: var(--spacing-sm);
  margin: 0;
  padding: var(--spacing-xs) 0;
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  background: var(--color-bg-primary);
}

.hash {
  color: var(--color-accent);
  font-weight: 700;
}

.date {
  color: var(--color-text-secondary);
  letter-spacing: 0.04em;
}

.fill {
  flex: 1;
  min-width: var(--spacing-md);
  height: 0;
  border-bottom: 1px dotted currentcolor;
  opacity: 0.35;
  transform: translateY(-3px);
}

.count {
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.count.busy {
  color: var(--color-accent);
}

.boot {
  padding-left: calc(var(--rail-w) + var(--spacing-md));
}

.fail-body {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-md);
  padding: var(--spacing-md) 0;
  font-family: var(--font-family-mono);
}

.fatal {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-danger);
}

.fatal .kw {
  font-weight: 700;
}

.note-text,
.tail-text {
  margin: 0;
  padding: var(--spacing-md) 0;
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.tail .rail {
  position: relative;
}

.dots {
  position: absolute;
  left: calc(var(--lane-w) / 2);
  top: 0;
  bottom: 0;
  width: 2px;
  transform: translateX(-50%);
  background: repeating-linear-gradient(
    to bottom,
    var(--color-bg-tertiary) 0 3px,
    transparent 3px 9px
  );
}

.foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-md) var(--spacing-lg);
  margin: var(--spacing-lg) 0 0;
  padding-left: calc(var(--rail-w) + var(--spacing-md));
}

.receive {
  flex: 1;
  min-width: 240px;
  margin: 0;
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
}

.pct {
  color: var(--color-text-secondary);
  font-weight: 700;
}

.track {
  display: block;
  height: 3px;
  margin-top: var(--spacing-xs);
  border-radius: var(--radius-full);
  background: var(--color-bg-secondary);
  overflow: hidden;
}

.track .bar {
  display: block;
  width: var(--w);
  height: 100%;
  border-radius: var(--radius-full);
  background: linear-gradient(90deg, var(--color-link), var(--color-accent));
  box-shadow: 0 0 10px rgba(255, 204, 0, 0.35);
  animation: receive 0.7s steps(18, end) backwards;
}

@keyframes receive {
  from {
    width: 0;
  }
}

.cmd-btn {
  padding: var(--spacing-xs) var(--spacing-md);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  background: transparent;
  border: 1px solid var(--color-bg-tertiary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.cmd-btn .p {
  color: var(--color-accent);
}

.cmd-btn:hover:not(:disabled) {
  color: var(--color-text-primary);
  border-color: var(--color-accent);
  box-shadow: var(--shadow-glow);
}

.cmd-btn:disabled {
  cursor: default;
  opacity: 0.6;
}

@media (max-width: 720px) {
  .log {
    padding: var(--spacing-lg);
  }

  .log-container {
    --lane-w: 12px;
  }

  .row {
    gap: var(--spacing-sm);
  }

  .foot,
  .boot {
    padding-left: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .track .bar {
    animation: none;
  }
}
</style>
