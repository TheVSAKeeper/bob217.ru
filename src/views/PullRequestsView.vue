<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import CmdLine from '@/components/CmdLine.vue'
import PullBranch from '@/components/pulls/PullBranch.vue'
import { useCmdReplay } from '@/composables/useCmdReplay'
import { usePullRequests } from '@/composables/usePullRequests'
import { fmtDate, plural } from '@/utils/format'

type GraphView = 'boot' | 'error' | 'empty' | 'ready'

const { rows, total, stats, loading, loaded, error, load } = usePullRequests()

const view = computed<GraphView>(() => {
  if (rows.value.length) return 'ready'
  if (error.value) return 'error'
  return loaded.value ? 'empty' : 'boot'
})

const today = computed(() => fmtDate(new Date().toISOString()))

const logKey = ref(0)
const { phaseClass, start, print } = useCmdReplay(() => 1100)

const replay = (): void => {
  print()
  logKey.value += 1
}

onMounted(load)
</script>

<template>
  <div class="pulls" :class="[phaseClass, { booting: view === 'boot' }]">
    <div class="pulls-container">
      <header class="pulls-header">
        <CmdLine @run="start" @done="replay"
          >gh pr list --author
          <a href="https://github.com/MaxNagibator" target="_blank" rel="noopener noreferrer"
            >MaxNagibator</a
          >
          --state open</CmdLine
        >
        <h1 class="cmd-out">Открытые Pull Request</h1>
      </header>

      <p class="status cmd-out" style="--print-delay: 80ms">
        <template v-if="view === 'ready'">
          <span class="n accent">{{ stats.total }}</span>
          PR {{ plural(stats.total, 'открыт', 'открыто', 'открыто') }} в
          <span class="n">{{ stats.repos }}</span>
          {{ plural(stats.repos, 'репозитории', 'репозиториях', 'репозиториях')
          }}<template v-if="stats.draft"
            >, <span class="n">{{ stats.draft }}</span>
            {{ plural(stats.draft, 'черновик', 'черновика', 'черновиков') }}</template
          >
          <span v-if="error" class="stale">· {{ error }}</span>
        </template>
        <template v-else-if="view === 'boot'">спрашиваю у GitHub…</template>
      </p>

      <ul :key="logKey" class="graph cmd-out" style="--print-delay: 160ms">
        <template v-if="view === 'boot'">
          <li v-for="i in 3" :key="i" class="row ghost" :style="{ '--i': i - 1 }">
            <span class="rail" aria-hidden="true">
              <i class="trunk"></i>
              <i class="node"></i>
            </span>
            <span class="bars" aria-hidden="true">
              <i class="bar w-short"></i>
              <i class="bar w-long"></i>
            </span>
          </li>
        </template>

        <PullBranch v-for="(row, i) in rows" :key="row.pr.id" :row="row" :index="i" />

        <li v-if="view === 'error'" class="row fail">
          <span class="rail" aria-hidden="true">
            <i class="trunk"></i>
            <i class="node"></i>
          </span>
          <div class="fail-body">
            <p class="fatal"><span class="kw">fatal:</span> {{ error }}</p>
            <button class="cmd-btn" @click="load">
              <span class="p">$</span> {{ loading ? 'повторяю…' : 'повторить' }}
            </button>
          </div>
        </li>

        <li v-else-if="view === 'empty'" class="row note">
          <span class="rail" aria-hidden="true">
            <i class="trunk"></i>
            <i class="node"></i>
          </span>
          <p class="note-text"># ничего не висит – всё уже в master</p>
        </li>

        <li class="row head" :style="{ '--i': rows.length }">
          <span class="rail" aria-hidden="true">
            <i class="trunk"></i>
            <i class="node"></i>
          </span>
          <p class="head-label">
            <span class="ref">master</span>
            <span class="tag">HEAD</span>
            <i class="fill" aria-hidden="true"></i>
            <span class="when">{{ today }}</span>
          </p>
        </li>
      </ul>

      <p v-if="view !== 'error'" class="foot cmd-out" style="--print-delay: 1050ms">
        <button class="cmd-btn" :disabled="loading" @click="load">
          <span class="p">$</span> {{ loading ? 'обновляю…' : 'обновить' }}
        </button>
        <span v-if="view === 'ready' && total > rows.length" class="foot-note">
          показаны {{ rows.length }} из {{ total }}
        </span>
      </p>
    </div>
  </div>
</template>

<style scoped>
.pulls {
  min-height: 100vh;
  padding: var(--spacing-xl);
}

.pulls-container {
  --rail-tick: #5c5c5c;
  --rail-w: 58px;
  --lane-a: 15px;
  --lane-b: 40px;
  --base-y: 12px;
  --tip-y: 32px;
  --curve: 12px;

  width: 100%;
  max-width: 760px;
  margin: 0 auto;
}

.pulls-header {
  margin-bottom: var(--spacing-lg);
}

.pulls-header h1 {
  margin: 0;
}

.cmd a {
  color: var(--color-link);
}

.cmd a:hover {
  text-decoration: underline;
}

.status {
  min-height: 1.6em;
  margin: 0 0 var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  border-bottom: 1px solid var(--color-bg-tertiary);
}

.n {
  font-weight: 700;
  color: var(--color-text-secondary);
}

.n.accent {
  color: var(--color-accent);
}

.stale {
  color: var(--color-danger);
}

.graph {
  margin: 0;
  padding: 0;
  list-style: none;
}

.pulls.cmd-clearing .graph,
.pulls.cmd-printing .graph {
  animation: none;
}

.pulls.cmd-clearing :deep(.tip) {
  animation: tip-back 0.28s cubic-bezier(0.55, 0, 1, 0.45) both;
  animation-delay: calc(var(--i, 0) * 30ms);
}

@keyframes tip-back {
  to {
    opacity: 0;
    transform: translate(-50%, -50%)
      translate(calc(var(--lane-a) - var(--lane-b)), calc(var(--base-y) - var(--tip-y))) scale(0.3);
  }
}

.pulls.cmd-clearing :deep(.fork) {
  animation: fork-back 0.3s cubic-bezier(0.55, 0, 1, 0.45) both;
  animation-delay: calc(var(--i, 0) * 30ms);
}

@keyframes fork-back {
  to {
    clip-path: inset(0 100% 0 0);
  }
}

.pulls.cmd-clearing :deep(.trunk) {
  transform-origin: bottom;
  animation: trunk-zip 0.3s ease-in both;
  animation-delay: calc(var(--i, 0) * 30ms + 140ms);
}

@keyframes trunk-zip {
  to {
    transform: scaleY(0);
  }
}

.pulls.cmd-clearing .row:not(.head) .node,
.pulls.cmd-clearing :deep(.base) {
  animation: node-back 0.24s ease-in both;
  animation-delay: calc(var(--i, 0) * 30ms + 120ms);
}

@keyframes node-back {
  to {
    transform: translate(-50%, -50%) scale(0);
  }
}

.pulls.cmd-clearing :deep(.body),
.pulls.cmd-clearing .bars,
.pulls.cmd-clearing .fail-body,
.pulls.cmd-clearing .note-text,
.pulls.cmd-clearing .head-label {
  animation: body-back 0.26s ease-in both;
  animation-delay: calc(var(--i, 0) * 30ms);
}

@keyframes body-back {
  to {
    opacity: 0;
    transform: translateX(14px);
  }
}

.pulls.cmd-clearing .head .node {
  animation: swallow 0.42s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  animation-delay: calc(var(--i, 0) * 30ms + 160ms);
}

@keyframes swallow {
  45% {
    transform: translate(-50%, -50%) scale(1.8);
    box-shadow: 0 0 0 14px rgba(255, 204, 0, 0.26);
  }
  100% {
    transform: translate(-50%, -50%) scale(0);
    box-shadow: 0 0 0 0 rgba(255, 204, 0, 0);
  }
}

.row {
  --trail: min(calc(var(--i, 0) * 70ms), 420ms);
  display: grid;
  grid-template-columns: var(--rail-w) 1fr;
}

.row .trunk {
  animation: draw-down 0.4s ease backwards;
  animation-delay: var(--trail);
}

.row .node {
  animation: pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
  animation-delay: calc(var(--trail) + 90ms);
}

.bars,
.fail-body,
.note-text,
.head-label {
  animation: settle 0.45s cubic-bezier(0.16, 1, 0.3, 1) backwards;
  animation-delay: calc(var(--trail) + 60ms);
}

@keyframes pop {
  from {
    transform: translate(-50%, -50%) scale(0);
  }
}

@keyframes settle {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
}

.rail {
  position: relative;
}

.trunk {
  position: absolute;
  left: var(--lane-a);
  top: 0;
  bottom: 0;
  width: 2px;
  background: repeating-linear-gradient(to bottom, var(--rail-tick) 0 3px, transparent 3px 7px);
}

.node {
  position: absolute;
  left: calc(var(--lane-a) + 1px);
  top: var(--base-y);
  width: 7px;
  height: 7px;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: var(--color-text-muted);
}

.bars {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding-top: 4px;
  padding-bottom: 74px;
}

.bar {
  height: 10px;
  border-radius: var(--radius-sm);
  background: var(--color-bg-secondary);
  animation: breathe 1.8s ease-in-out infinite;
  animation-delay: calc(var(--i) * 140ms);
}

.w-short {
  width: 26%;
}

.w-long {
  width: 62%;
}

@keyframes breathe {
  50% {
    opacity: 0.45;
  }
}

@keyframes draw-down {
  from {
    transform: scaleY(0);
  }
}

.fail .node {
  background: var(--color-danger);
}

.fail-body {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-md);
  padding-bottom: var(--spacing-xl);
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

.note-text {
  margin: 0;
  padding-bottom: var(--spacing-xl);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.head .trunk {
  bottom: auto;
  height: var(--base-y);
}

.head .node {
  width: 13px;
  height: 13px;
  background: var(--color-accent);
  box-shadow:
    0 0 0 4px rgba(255, 204, 0, 0.14),
    var(--shadow-glow);
  animation: head-land 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
  animation-delay: calc(var(--trail) + 260ms);
}

@keyframes head-land {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.2);
    box-shadow: 0 0 0 0 rgba(255, 204, 0, 0);
  }
  55% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.6);
    box-shadow: 0 0 0 14px rgba(255, 204, 0, 0.22);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
    box-shadow:
      0 0 0 4px rgba(255, 204, 0, 0.14),
      var(--shadow-glow);
  }
}

.head-label {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-sm);
  margin: 0;
  line-height: 1.7;
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.ref {
  color: var(--color-accent);
  letter-spacing: 0.04em;
}

.tag {
  padding: 0 var(--spacing-sm);
  border: 1px solid var(--color-accent);
  border-radius: var(--radius-full);
  color: var(--color-accent);
  letter-spacing: 0.08em;
}

.fill {
  flex: 1;
  min-width: var(--spacing-md);
  height: 0;
  border-bottom: 1px dotted currentcolor;
  opacity: 0.4;
  transform: translateY(-3px);
}

.when {
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.foot {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin: var(--spacing-xl) 0 0;
  padding-left: var(--rail-w);
}

.pulls.booting .head,
.pulls.booting .foot {
  visibility: hidden;
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
}

.cmd-btn:disabled {
  cursor: default;
  opacity: 0.6;
}

@media (max-width: 720px) {
  .pulls {
    padding: var(--spacing-lg);
  }

  .pulls-container {
    --rail-w: 46px;
    --lane-b: 32px;
    --curve: 10px;
  }

  .foot {
    padding-left: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .row .trunk,
  .row .node,
  .head .node,
  .bars,
  .fail-body,
  .note-text,
  .head-label,
  .bar,
  .pulls.cmd-clearing .row .node,
  .pulls.cmd-clearing .head .node,
  .pulls.cmd-clearing .bars,
  .pulls.cmd-clearing .fail-body,
  .pulls.cmd-clearing .note-text,
  .pulls.cmd-clearing .head-label,
  .pulls.cmd-clearing :deep(.tip),
  .pulls.cmd-clearing :deep(.fork),
  .pulls.cmd-clearing :deep(.trunk),
  .pulls.cmd-clearing :deep(.base),
  .pulls.cmd-clearing :deep(.body) {
    animation: none;
  }
}
</style>
