<script lang="ts" setup>
import { computed, onMounted } from 'vue'
import CmdLine from '@/components/CmdLine.vue'
import AgeScale from '@/components/issues/AgeScale.vue'
import IssueLine from '@/components/issues/IssueLine.vue'
import StatStrip from '@/components/stats/StatStrip.vue'
import TermLines from '@/components/TermLines.vue'
import { useCmdRun } from '@/composables/useCmdRun'
import { useIssues } from '@/composables/useIssues'
import type { StatItem } from '@/types/stat'
import { plural } from '@/utils/format'

type IssuesState = 'boot' | 'error' | 'empty' | 'ready'

const BOOT_LINES = ['gh: querying api.github.com…', 'Receiving issues…']

const { groups, dots, stats, loading, loaded, error, load } = useIssues()

const view = computed<IssuesState>(() => {
  if (groups.value.length) return 'ready'
  if (error.value) return 'error'
  return loaded.value ? 'empty' : 'boot'
})

const oldestLabel = computed(() => {
  const days = stats.value.oldest
  if (days < 45) return `${days} ${plural(days, 'день', 'дня', 'дней')}`
  if (days < 365) {
    const months = Math.round(days / 30)
    return `${months} ${plural(months, 'месяц', 'месяца', 'месяцев')}`
  }
  const years = Math.floor(days / 365)
  return `${years} ${plural(years, 'год', 'года', 'лет')}`
})

const metrics = computed<StatItem[]>(() => [
  { key: 'total', value: stats.value.total, label: 'задач открыто', accent: true },
  { key: 'repos', value: stats.value.repos, label: 'репозиториев' },
  { key: 'discussed', value: stats.value.discussed, label: 'с обсуждением' },
  { key: 'oldest', text: oldestLabel.value, label: 'ждёт самая старая' },
])

const { runKey, running, begin, finish } = useCmdRun()

onMounted(load)
</script>

<template>
  <div class="issues">
    <div class="issues-container">
      <header class="issues-header">
        <CmdLine @run="begin" @done="finish">gh issue list --state open --limit 100</CmdLine>
        <h1>Открытые задачи</h1>
        <p class="lede">
          что висит в репозиториях
          <a href="https://github.com/MaxNagibator" target="_blank" rel="noopener noreferrer"
            >MaxNagibator</a
          >
          – рабочее дерево, которое ещё не закоммичено
        </p>
      </header>

      <div class="stage" :class="{ running }">
        <TermLines v-if="view === 'boot' || running" :lines="BOOT_LINES" class="boot" />

        <div :key="runKey" class="out">
          <template v-if="view === 'ready'">
            <StatStrip :items="metrics" class="strip" />
            <AgeScale :dots="dots" :oldest-label="oldestLabel" class="scale" />
          </template>

          <p class="legend">
            <template v-if="view === 'ready'">
              <span class="key"><i class="code">??</i> не тронута</span>
              <span class="key"><i class="code talk">M</i> идёт обсуждение</span>
              <span class="key"
                ><i class="heat" aria-hidden="true"></i> полоса растёт с возрастом</span
              >
              <span v-if="error" class="stale">· {{ error }}</span>
            </template>
          </p>

          <div class="tree">
            <section
              v-for="group in groups"
              :key="group.repo"
              class="group"
              :style="{ '--repo-color': group.color }"
            >
              <h2 class="repo-head">
                <span class="hash">##</span>
                <a class="repo" :href="group.repoUrl" target="_blank" rel="noopener noreferrer">{{
                  group.repo
                }}</a>
                <i class="fill" aria-hidden="true"></i>
                <span class="count"
                  >{{ group.rows.length }}
                  {{ plural(group.rows.length, 'задача', 'задачи', 'задач') }}</span
                >
              </h2>
              <i
                class="share"
                aria-hidden="true"
                :style="{ '--w': `${(group.rows.length / stats.total) * 100}%` }"
              ></i>
              <ul class="lines">
                <IssueLine
                  v-for="(row, i) in group.rows"
                  :key="row.issue.id"
                  :row="row"
                  :index="group.offset + i"
                />
              </ul>
            </section>

            <div v-if="view === 'error'" class="fail">
              <p class="fatal"><span class="kw">fatal:</span> {{ error }}</p>
              <button class="cmd-btn" @click="load">
                <span class="p">$</span> {{ loading ? 'повторяю…' : 'повторить' }}
              </button>
            </div>

            <p v-else-if="view === 'empty'" class="note">
              # рабочее дерево чистое – открытых задач нет
            </p>
          </div>

          <p v-if="view === 'ready'" class="foot">
            <button class="cmd-btn" :disabled="loading" @click="load">
              <span class="p">$</span> {{ loading ? 'обновляю…' : 'обновить' }}
            </button>
            <span v-if="stats.discussed" class="foot-note"
              >{{ stats.discussed }} с обсуждением из {{ stats.total }}</span
            >
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.issues {
  min-height: 100vh;
  padding: var(--spacing-xl);
}

.issues-container {
  width: 100%;
  max-width: 820px;
  margin: 0 auto;
}

.issues-header {
  margin-bottom: var(--spacing-lg);
}

.issues-header h1 {
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

.scale {
  margin-bottom: var(--spacing-lg);
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm) var(--spacing-lg);
  min-height: 1.4em;
  margin: 0 0 var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  border-bottom: 1px solid var(--color-bg-tertiary);
}

.key {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.legend .code {
  font-style: normal;
  letter-spacing: 0.06em;
}

.legend .code.talk {
  color: var(--color-accent);
}

.stale {
  color: var(--color-danger);
}

.heat {
  width: 28px;
  height: 2px;
  border-radius: var(--radius-full);
  background: linear-gradient(to right, var(--color-text-muted), var(--color-danger));
  opacity: 0.7;
}

.group + .group {
  margin-top: var(--spacing-xl);
}

.repo-head {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-sm);
  margin: 0;
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  font-weight: 400;
  color: var(--color-text-muted);
}

.hash {
  color: var(--color-accent);
  font-weight: 700;
}

.repo {
  color: color-mix(in srgb, var(--repo-color) 75%, var(--color-text-primary));
  text-decoration: none;
  letter-spacing: 0.03em;
}

.repo:hover {
  text-decoration: underline;
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
  font-size: var(--font-size-xs);
  font-variant-numeric: tabular-nums;
}

.share {
  display: block;
  width: var(--w);
  height: 2px;
  margin: var(--spacing-xs) 0 var(--spacing-sm);
  border-radius: var(--radius-full);
  background: var(--repo-color);
  opacity: 0.55;
  transform-origin: left;
  animation: share-grow 0.5s steps(14, end) 0.15s backwards;
}

@keyframes share-grow {
  from {
    transform: scaleX(0);
  }
}

.lines {
  margin: 0;
  padding: 0;
  list-style: none;
}

.fail {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-md);
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

.note {
  margin: 0;
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.foot {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin: var(--spacing-xl) 0 0;
}

.foot-note {
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
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
  .issues {
    padding: var(--spacing-lg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .share {
    animation: none;
  }
}
</style>
