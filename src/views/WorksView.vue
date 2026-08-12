<script lang="ts" setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import CmdLine from '@/components/CmdLine.vue'
import ReflogEntry from '@/components/works/ReflogEntry.vue'
import { useCmdReplay } from '@/composables/useCmdReplay'
import { useWorkLog } from '@/composables/useWorkLog'
import { plural } from '@/utils/format'

const { rows } = useWorkLog()

const logKey = ref(0)
const { phaseClass, start, print } = useCmdReplay(() => 1600)

const replay = (): void => {
  print()
  logKey.value += 1
}
</script>

<template>
  <div class="works" :class="phaseClass">
    <div class="works-container">
      <header class="works-header">
        <CmdLine @run="start" @done="replay">git reflog --author bob217</CmdLine>
        <h1 class="cmd-out">Заказы и поделки</h1>
      </header>

      <p class="status cmd-out" style="--print-delay: 80ms">
        BobGroup, работаем на себя ·
        <span class="n">{{ rows.length }}</span>
        {{ plural(rows.length, 'запись', 'записи', 'записей') }}, без дат
      </p>

      <ul :key="logKey" class="log cmd-out" :style="{ '--n': rows.length + 1 }">
        <ReflogEntry v-for="(row, i) in rows" :key="row.entry.id" :row="row" :index="i" />

        <li class="root" :style="{ '--i': rows.length }">
          <span class="rail" aria-hidden="true">
            <i class="line"></i>
            <i class="node"></i>
          </span>
          <p class="root-label"># дальше не вспомнилось</p>
        </li>
      </ul>

      <p class="outro cmd-out" style="--print-delay: 1200ms">
        # трудовой путь лежит в
        <RouterLink to="/resume">/resume</RouterLink>
      </p>
    </div>
  </div>
</template>

<style scoped>
.works {
  min-height: 100vh;
  padding: var(--spacing-xl);
}

.works-container {
  --rail-tick: #5c5c5c;
  --rail-w: 30px;
  --lane: 14px;
  --node-y: 11px;

  width: 100%;
  max-width: var(--max-width-content);
  margin: 0 auto;
}

.works-header {
  margin-bottom: var(--spacing-lg);
}

.works-header h1 {
  margin: 0;
}

.status {
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

.log {
  --walk: 620ms;
  margin: 0;
  padding: 0;
  list-style: none;
}

.works.cmd-clearing .log {
  animation: reflog-rewind 0.3s cubic-bezier(0.5, 0, 0.75, 0) both;
}

@keyframes reflog-rewind {
  from {
    clip-path: inset(0 0 0 0);
    transform: translateX(0);
    opacity: 1;
  }
  to {
    clip-path: inset(0 0 0 100%);
    transform: translateX(24px);
    opacity: 0;
  }
}

.works.cmd-printing .log {
  animation: none;
}

.root {
  --trail: calc(200ms + min(calc(var(--i) * 40ms), 400ms));
  --pass: var(--walk);
  display: grid;
  grid-template-columns: var(--rail-w) 1fr;
  min-height: 26px;
}

.root .rail {
  position: relative;
}

.root .line {
  position: absolute;
  left: var(--lane);
  top: 0;
  height: var(--node-y);
  width: 2px;
  background: var(--rail-tick);
  transform-origin: top;
  animation: rail-draw 0.4s ease backwards;
  animation-delay: var(--trail);
}

@keyframes rail-draw {
  from {
    transform: scaleY(0);
  }
}

.root .node {
  position: absolute;
  left: calc(var(--lane) + 1px);
  top: var(--node-y);
  width: 9px;
  height: 9px;
  transform: translate(-50%, -50%);
  border-radius: var(--radius-full);
  background: var(--color-bg-primary);
  border: 2px solid var(--color-text-muted);
  animation:
    node-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) backwards,
    root-pass 0.42s ease-out;
  animation-delay: calc(var(--trail) + 120ms), var(--pass);
}

@keyframes node-pop {
  from {
    transform: translate(-50%, -50%) scale(0);
  }
}

@keyframes root-pass {
  35% {
    transform: translate(-50%, -50%) scale(1.7);
    border-color: var(--color-accent);
    box-shadow: 0 0 0 7px rgba(255, 204, 0, 0.18);
  }
}

.root-label {
  margin: 0;
  line-height: 1.7;
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  animation: body-in 0.45s cubic-bezier(0.16, 1, 0.3, 1) backwards;
  animation-delay: var(--trail);
}

@keyframes body-in {
  from {
    opacity: 0;
    transform: translateX(-14px);
  }
}

.outro {
  margin: var(--spacing-lg) 0 0;
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.outro a {
  color: var(--color-link);
}

.outro a:hover {
  color: var(--color-link-hover);
}

@media (max-width: 720px) {
  .works {
    padding: var(--spacing-lg);
  }

  .works-container {
    --rail-w: 24px;
    --lane: 11px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .root .line,
  .root .node,
  .root-label {
    animation: none;
  }
}
</style>
