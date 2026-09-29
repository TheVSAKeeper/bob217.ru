<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import CmdLine from '@/components/CmdLine.vue'
import GitConfig from '@/components/about/GitConfig.vue'
import ShortlogRow from '@/components/about/ShortlogRow.vue'
import { useCmdReplay } from '@/composables/useCmdReplay'
import { useShortlog } from '@/composables/useShortlog'
import { plural } from '@/utils/format'

type LogView = 'boot' | 'error' | 'empty' | 'ready'

const { rows, stats, loading, loaded, error, load } = useShortlog()

const view = computed<LogView>(() => {
  if (rows.value.length) return 'ready'
  if (error.value) return 'error'
  return loaded.value ? 'empty' : 'boot'
})

const logKey = ref(0)
const { phaseClass, start, print } = useCmdReplay(() => 1200)

const replay = (): void => {
  print()
  logKey.value += 1
}

onMounted(load)
</script>

<template>
  <div class="about" :class="[phaseClass, { booting: view === 'boot' }]">
    <div class="about-container">
      <header class="about-header">
        <CmdLine @run="start" @done="replay">git shortlog -s --all --no-merges</CmdLine>
        <h1 class="cmd-out">О нас</h1>
      </header>

      <p class="status cmd-out" style="--print-delay: 80ms">
        <template v-if="view === 'ready'">
          <span class="n accent">{{ stats.authors }}</span>
          {{ plural(stats.authors, 'автор', 'автора', 'авторов') }} ·
          <span class="n">{{ stats.merged }}</span>
          {{ plural(stats.merged, 'мёрженый', 'мёрженых', 'мёрженых') }} PR в
          <span class="n">{{ stats.repos }}</span>
          {{ plural(stats.repos, 'репозитории', 'репозиториях', 'репозиториях') }} · кто мёржил
          недавно – тот выше
        </template>
        <template v-else-if="view === 'boot'">смотрю, кто заходил последним…</template>
      </p>

      <ul :key="logKey" class="log cmd-out" style="--print-delay: 160ms">
        <template v-if="view === 'boot'">
          <li v-for="i in 4" :key="i" class="ghost" :style="{ '--i': i - 1 }">
            <i class="ghost-face"></i>
            <i class="ghost-name"></i>
            <i class="ghost-when"></i>
          </li>
        </template>

        <ShortlogRow v-for="(row, i) in rows" :key="row.author.login" :row="row" :index="i" />

        <li v-if="view === 'error'" class="fail">
          <p class="fatal"><span class="kw">fatal:</span> {{ error }}</p>
          <button class="cmd-btn" @click="load">
            <span class="p">$</span> {{ loading ? 'повторяю…' : 'повторить' }}
          </button>
        </li>

        <li v-else-if="view === 'empty'" class="note"># пусто – ни одного мёрженого PR</li>
      </ul>

      <section class="config cmd-out" style="--print-delay: 900ms">
        <h2 class="md-head"><span class="hash">##</span> Наш конфиг</h2>
        <GitConfig :authors="stats.authors" />
      </section>
    </div>
  </div>
</template>

<style scoped>
.about {
  min-height: 100vh;
  padding: var(--spacing-xl);
}

.about-container {
  width: 100%;
  max-width: 760px;
  margin: 0 auto;
}

.about-header {
  margin-bottom: var(--spacing-lg);
}

.about-header h1 {
  margin: 0;
}

.status {
  margin: 0 0 var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  min-height: 1.6em;
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

.log {
  margin: 0;
  padding: 0;
  list-style: none;
}

.about.cmd-clearing .log {
  animation: shortlog-rewind 0.3s cubic-bezier(0.5, 0, 0.75, 0) both;
}

@keyframes shortlog-rewind {
  from {
    clip-path: inset(0 0 0 0);
    opacity: 1;
  }
  to {
    clip-path: inset(0 0 0 100%);
    opacity: 0;
  }
}

.about.cmd-printing .log {
  animation: none;
}

.ghost {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr) 90px;
  gap: var(--spacing-md);
  align-items: center;
  padding: var(--spacing-sm) 0;
}

.ghost i {
  height: 10px;
  border-radius: var(--radius-full);
  background: var(--color-bg-secondary);
  animation: ghost-pulse 1.4s ease-in-out infinite;
  animation-delay: calc(var(--i) * 120ms);
}

.ghost-face {
  height: 32px;
  border-radius: var(--radius-full);
}

.ghost-name {
  max-width: calc(60% - var(--i) * 8%);
}

@keyframes ghost-pulse {
  50% {
    opacity: 0.35;
  }
}

.fail,
.note {
  padding: var(--spacing-md) 0;
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.fatal {
  margin: 0 0 var(--spacing-md);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.kw {
  color: var(--color-danger);
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

.cmd-btn:hover {
  color: var(--color-text-primary);
  border-color: var(--color-accent);
}

.config {
  margin-top: var(--spacing-2xl);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-bg-tertiary);
}

.about.booting .config {
  visibility: hidden;
}

.md-head {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-sm);
  margin: 0 0 var(--spacing-md);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-lg);
}

.md-head .hash {
  color: var(--color-accent);
}

@media (max-width: 720px) {
  .about {
    padding: var(--spacing-lg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .ghost i,
  .about.cmd-clearing .log {
    animation: none;
  }
}
</style>
