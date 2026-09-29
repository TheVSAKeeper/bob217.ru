<script lang="ts" setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import CmdLine from '@/components/CmdLine.vue'
import CareerScale from '@/components/resume/CareerScale.vue'
import JobBranch from '@/components/resume/JobBranch.vue'
import { useCmdReplay } from '@/composables/useCmdReplay'
import { useResume } from '@/composables/useResume'

const { jobs, totalSpan, scale, education, skills, languages, about, config } = useResume()

const graphKey = ref(0)
const activeJob = ref<string | null>(null)
const { phaseClass, start, print } = useCmdReplay(() => 2400)

const replay = (): void => {
  print()
  graphKey.value += 1
}
</script>

<template>
  <div class="resume" :class="phaseClass">
    <div class="resume-container">
      <header class="resume-header">
        <CmdLine @run="start" @done="replay">git log --graph --branches</CmdLine>
        <h1 class="cmd-out">Резюме</h1>
      </header>

      <CareerScale
        :scale="scale"
        :active="activeJob"
        class="cmd-out"
        style="--print-delay: 80ms"
        @pick="activeJob = $event"
      >
        senior .net developer · непрерывный стаж
        <span class="n accent">{{ totalSpan }}</span>
      </CareerScale>

      <ul :key="graphKey" class="graph cmd-out" :style="{ '--jobs': jobs.length }">
        <JobBranch
          v-for="(row, i) in jobs"
          :key="row.job.id"
          :row="row"
          :index="i"
          :active="activeJob === row.job.id"
        />

        <li class="tags-head" :style="{ '--n': 0 }">
          <span class="rail" aria-hidden="true"><i class="trunk"></i></span>
          <p class="note typed">$ git tag -l</p>
        </li>

        <li v-for="(row, i) in education" :key="row.tag" class="tag-row" :style="{ '--n': i + 1 }">
          <span class="rail" aria-hidden="true">
            <i class="trunk"></i>
            <i class="tag-node"></i>
          </span>
          <p class="tag-body typed">
            <span class="tag-name">{{ row.tag }}</span>
            <span class="tag-text">
              {{ row.entry.degree }} · {{ row.entry.faculty }} · {{ row.entry.field }}
            </span>
            <span class="tag-org">{{ row.entry.org }}</span>
          </p>
        </li>

        <li class="root" :style="{ '--n': education.length + 1 }">
          <span class="rail" aria-hidden="true">
            <i class="trunk short"></i>
            <i class="root-node"></i>
          </span>
          <p class="note typed"># init – дальше только учебные поделки</p>
        </li>
      </ul>

      <section
        class="block cmd-out"
        style="--print-delay: 700ms; --row: 1350ms"
        :style="{ '--groups': skills.length }"
      >
        <h2 class="md-head typed"><span class="hash">##</span> Навыки</h2>
        <div class="skill-groups">
          <template v-for="(group, gi) in skills" :key="group.group">
            <p class="group-name typed" :style="{ '--k': gi }">{{ group.group }}/</p>
            <p class="chips" :style="{ '--k': gi }">
              <span
                v-for="skill in group.items"
                :key="skill.name"
                class="chip"
                :class="{ lang: skill.color }"
                :style="skill.color ? { '--ref': skill.color } : undefined"
                >{{ skill.name }}</span
              >
            </p>
          </template>
        </div>
        <p class="langs typed">
          <span v-for="lang in languages" :key="lang.name" class="lang-item">
            {{ lang.name }} <i>{{ lang.level }}</i>
          </span>
        </p>
      </section>

      <section class="block cmd-out" style="--print-delay: 800ms; --row: 1650ms">
        <h2 class="md-head typed"><span class="hash">##</span> git config --list</h2>
        <dl class="config">
          <div
            v-for="(entry, i) in config"
            :key="entry.key"
            class="config-line typed"
            :style="{ '--k': i }"
          >
            <dt>{{ entry.key }}</dt>
            <dd>{{ entry.value }}</dd>
          </div>
        </dl>
      </section>

      <section class="block cmd-out" style="--print-delay: 900ms; --row: 1900ms">
        <h2 class="md-head typed"><span class="hash">##</span> README.md</h2>
        <p v-for="(line, i) in about" :key="i" class="about-line typed" :style="{ '--k': i }">
          {{ line }}
        </p>
      </section>

      <p class="outro cmd-out typed" style="--print-delay: 1000ms; --trail: 2350ms">
        # заказы, подработки и поделки вынесены в отдельный reflog –
        <RouterLink to="/works">/works</RouterLink>
      </p>
    </div>
  </div>
</template>

<style scoped>
.resume {
  min-height: 100vh;
  padding: var(--spacing-xl);
}

.resume-container {
  --rail-tick: #5c5c5c;
  --lead: 620ms;
  --row-step: 320ms;
  --rail-w: 58px;
  --lane-a: 14px;
  --lane-b: 42px;
  --node-y: 14px;
  --tail-h: 34px;
  --curve: 12px;

  width: 100%;
  max-width: var(--max-width-content);
  margin: 0 auto;
}

.resume-header {
  margin-bottom: var(--spacing-lg);
}

.resume-header h1 {
  margin: 0;
}

.n {
  font-weight: 700;
  color: var(--color-text-secondary);
}

.n.accent {
  color: var(--color-accent);
}

.graph {
  --tail-base: calc(var(--lead) + var(--jobs) * var(--row-step));
  margin: 0 0 var(--spacing-2xl);
  padding: 0;
  list-style: none;
}

.resume.cmd-clearing .graph {
  animation: graph-rewind 0.3s cubic-bezier(0.5, 0, 0.75, 0) both;
}

@keyframes graph-rewind {
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

.tags-head,
.tag-row,
.root {
  --row: calc(var(--tail-base) + var(--n) * 140ms);
  display: grid;
  grid-template-columns: var(--rail-w) 1fr;
}

.tags-head .rail,
.tag-row .rail,
.root .rail {
  position: relative;
}

.trunk {
  position: absolute;
  left: var(--lane-a);
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--rail-tick);
  transform-origin: top center;
  animation: rail-down 0.3s ease-out backwards;
  animation-delay: var(--row);
}

.trunk.short {
  bottom: auto;
  height: var(--node-y);
}

@keyframes rail-down {
  from {
    transform: scaleY(0);
  }
}

.tag-node,
.root-node {
  position: absolute;
  left: calc(var(--lane-a) + 1px);
  top: var(--node-y);
  transform: translate(-50%, -50%) rotate(45deg);
  width: 9px;
  height: 9px;
  background: var(--color-bg-primary);
  border: 2px solid var(--rail-tick);
  animation: tag-pop 0.32s cubic-bezier(0.22, 1.4, 0.36, 1) backwards;
  animation-delay: calc(var(--row) + 110ms);
}

.root-node {
  transform: translate(-50%, -50%);
  border-radius: var(--radius-full);
  animation-name: root-pop;
}

@keyframes tag-pop {
  from {
    transform: translate(-50%, -50%) rotate(45deg) scale(0);
  }
}

@keyframes root-pop {
  from {
    transform: translate(-50%, -50%) scale(0);
  }
}

.tags-head {
  min-height: 30px;
}

.tag-row {
  padding-bottom: var(--spacing-lg);
}

.note {
  --trail: calc(var(--row) + 150ms);
  margin: 0;
  line-height: 1.7;
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.tag-body {
  --trail: calc(var(--row) + 190ms);
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--spacing-xs) var(--spacing-sm);
  margin: 0;
  line-height: 1.7;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.tag-name {
  padding: 0 var(--spacing-sm);
  border-radius: var(--radius-sm);
  background: rgba(0, 188, 212, 0.14);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
  color: var(--color-link);
}

.tag-org {
  flex-basis: 100%;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.block {
  margin-bottom: var(--spacing-2xl);
}

.md-head {
  --trail: var(--row);
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

.skill-groups {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: baseline;
  gap: var(--spacing-sm) var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.group-name {
  --trail: calc(var(--row) + 120ms + var(--k) * 90ms);
  margin: 0;
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs) var(--spacing-sm);
  margin: 0;
  animation: refs-in 0.34s ease-out backwards;
  animation-delay: calc(var(--row) + 160ms + var(--k) * 90ms);
}

@keyframes refs-in {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
}

.chip {
  padding: 1px var(--spacing-sm);
  border: 1px solid var(--color-bg-tertiary);
  border-radius: var(--radius-sm);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.chip.lang {
  border-color: color-mix(in srgb, var(--ref) 55%, transparent);
  color: var(--color-text-secondary);
}

.chip.lang::before {
  content: '';
  display: inline-block;
  width: 0.5em;
  height: 0.5em;
  margin-right: 0.6ch;
  border-radius: var(--radius-full);
  background: var(--ref);
  vertical-align: 0.05em;
}

.langs {
  --trail: calc(var(--row) + 200ms + var(--groups) * 90ms);
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-lg);
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.lang-item i {
  font-style: normal;
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.config {
  margin: 0;
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-relaxed);
}

.config-line {
  --trail: calc(var(--row) + 110ms + var(--k) * 70ms);
  display: flex;
  flex-wrap: wrap;
  gap: 0 0.5ch;
}

.config-line dt {
  color: var(--color-link);
}

.config-line dt::after {
  content: '=';
  margin-left: 0.5ch;
  color: var(--color-text-muted);
}

.config-line dd {
  margin: 0;
  color: var(--color-text-secondary);
}

.about-line {
  --trail: calc(var(--row) + 110ms + var(--k) * 70ms);
  margin: 0 0 var(--spacing-sm);
  max-width: 68ch;
  line-height: var(--line-height-relaxed);
  color: var(--color-text-secondary);
}

.outro {
  margin: 0;
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
  .resume {
    padding: var(--spacing-lg);
  }

  .resume-container {
    --rail-w: 44px;
    --lane-a: 11px;
    --lane-b: 32px;
  }

  .skill-groups {
    grid-template-columns: 1fr;
    gap: var(--spacing-xs);
  }

  .group-name:not(:first-child) {
    margin-top: var(--spacing-sm);
  }
}

@media (prefers-reduced-motion: reduce) {
  .resume.cmd-clearing .graph,
  .trunk,
  .tag-node,
  .root-node,
  .chips {
    animation: none;
  }
}
</style>
