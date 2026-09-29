<script lang="ts" setup>
import type { JobRow } from '@/composables/useResume'

defineProps<{
  row: JobRow
  index: number
  active: boolean
}>()
</script>

<template>
  <li
    :id="`job-${row.job.id}`"
    class="job"
    :class="{ 'is-current': row.current, 'is-active': active }"
    :style="{ '--n': index, '--lines': row.job.summary.length }"
  >
    <span class="rail" aria-hidden="true">
      <i class="trunk"></i>
      <i v-if="!row.current" class="cap"></i>
      <i class="branch"></i>
      <i class="tail"></i>
      <i class="node"></i>
    </span>

    <article class="body">
      <p class="meta">
        <span class="branch-name typed">{{ row.job.branch }}</span>
        <i class="fill"></i>
        <span class="period typed">{{ row.period }}</span>
      </p>

      <h2 class="company typed">{{ row.job.company }}</h2>

      <p class="role typed">
        {{ row.job.role }}
        <span class="span">{{ row.span }}</span>
      </p>

      <p class="product typed">{{ row.job.product }}</p>

      <ul class="commits">
        <li v-for="(line, i) in row.job.summary" :key="i" class="typed" :style="{ '--k': i }">
          {{ line }}
        </li>
      </ul>

      <p class="stack">
        <span
          v-for="ref in row.stack"
          :key="ref.name"
          class="chip"
          :class="{ lang: ref.color }"
          :style="ref.color ? { '--ref': ref.color } : undefined"
          >{{ ref.name }}</span
        >
      </p>

      <details v-if="row.job.details.length" class="more">
        <summary>git show {{ row.job.id }} --stat</summary>
        <p v-for="(line, i) in row.job.details" :key="i">{{ line }}</p>
      </details>
    </article>
  </li>
</template>

<style scoped>
.job {
  --row: calc(var(--lead, 620ms) + var(--n) * var(--row-step, 320ms));
  --row-end: calc(var(--row) + 460ms + var(--lines) * 70ms);
  --rail-color: #5c5c5c;
  --cap-h: 26px;
  --node-top: calc(var(--cap-h) + var(--node-y));
  display: grid;
  grid-template-columns: var(--rail-w) 1fr;
  scroll-margin-top: calc(var(--nav-height) + var(--spacing-xl));
}

.job.is-current {
  --rail-color: var(--color-accent);
  --cap-h: 0px;
}

.job.is-active,
.job:target {
  --rail-color: var(--color-link);
}

.job.is-current.is-active,
.job.is-current:target {
  --rail-color: var(--color-accent);
}

.rail {
  position: relative;
}

.trunk,
.branch {
  position: absolute;
  width: 2px;
  background: var(--rail-tick);
}

.trunk {
  left: var(--lane-a);
  top: 0;
  bottom: 0;
  transform-origin: top center;
  animation: rail-down 0.34s ease-out backwards;
  animation-delay: var(--row);
}

.job:first-child .trunk {
  top: var(--node-y);
}

.branch {
  left: var(--lane-b);
  top: var(--node-top);
  bottom: var(--tail-h);
  background: var(--rail-color);
  transition: background var(--transition-fast);
  transform-origin: top center;
  animation: rail-down 0.32s ease-out backwards;
  animation-delay: calc(var(--row) + 240ms);
}

@keyframes rail-down {
  from {
    transform: scaleY(0);
  }
}

.cap,
.tail {
  position: absolute;
  left: var(--lane-a);
  width: calc(var(--lane-b) - var(--lane-a) + 2px);
  border-right: 2px solid var(--rail-color);
  transition: border-color var(--transition-fast);
}

.cap {
  top: 0;
  height: var(--node-top);
  border-top: 2px solid var(--rail-color);
  border-top-right-radius: var(--curve);
  animation: rail-out 0.24s ease-out backwards;
  animation-delay: calc(var(--row) + 60ms);
}

.tail {
  bottom: 0;
  height: var(--tail-h);
  border-bottom: 2px solid var(--rail-color);
  border-bottom-right-radius: var(--curve);
  animation: rail-back 0.26s ease-in backwards;
  animation-delay: calc(var(--row-end) + 40ms);
}

@keyframes rail-out {
  from {
    clip-path: inset(0 100% 0 0);
  }
}

@keyframes rail-back {
  from {
    clip-path: inset(0 0 0 100%);
  }
}

.node {
  position: absolute;
  left: calc(var(--lane-b) + 1px);
  top: var(--node-top);
  width: 11px;
  height: 11px;
  transform: translate(-50%, -50%);
  border-radius: var(--radius-full);
  border: 2px solid var(--rail-color);
  background: var(--color-bg-primary);
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast);
  animation: node-pop 0.34s cubic-bezier(0.22, 1.4, 0.36, 1) backwards;
  animation-delay: calc(var(--row) + 200ms);
}

.job.is-active .node,
.job:target .node {
  box-shadow: 0 0 0 5px rgba(0, 188, 212, 0.16);
}

@keyframes node-pop {
  from {
    transform: translate(-50%, -50%) scale(0);
  }
}

.job.is-current .node {
  width: 15px;
  height: 15px;
  background: var(--color-accent);
  box-shadow:
    0 0 0 4px rgba(255, 204, 0, 0.14),
    var(--shadow-glow);
}

.job.is-current.is-active .node,
.job.is-current:target .node {
  box-shadow:
    0 0 0 7px rgba(255, 204, 0, 0.2),
    var(--shadow-glow);
}

.body {
  min-width: 0;
  padding-top: var(--cap-h);
  padding-bottom: var(--spacing-2xl);
}

.meta {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-sm);
  margin: 0;
  line-height: 1.7;
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.branch-name {
  --trail: calc(var(--row) + 240ms);
  color: var(--color-link);
}

.job.is-current .branch-name {
  color: var(--color-accent);
}

.fill {
  flex: 1;
  min-width: var(--spacing-md);
  height: 0;
  border-bottom: 1px dotted currentcolor;
  opacity: 0.35;
  transform: translateY(-3px);
  transform-origin: left center;
  animation: fill-draw 0.28s ease-out backwards;
  animation-delay: calc(var(--row) + 300ms);
}

@keyframes fill-draw {
  from {
    transform: translateY(-3px) scaleX(0);
  }
}

.period {
  --trail: calc(var(--row) + 480ms);
  white-space: nowrap;
}

.company {
  --trail: calc(var(--row) + 300ms);
  margin: var(--spacing-xs) 0 0;
  font-size: var(--font-size-xl);
  line-height: var(--line-height-tight);
  color: var(--color-text-primary);
}

.role {
  --trail: calc(var(--row) + 360ms);
  margin: var(--spacing-xs) 0 var(--spacing-md);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.span {
  color: var(--color-text-muted);
}

.span::before {
  content: '·';
  margin: 0 var(--spacing-xs);
}

.product {
  --trail: calc(var(--row) + 410ms);
  margin: 0 0 var(--spacing-md);
  line-height: var(--line-height-relaxed);
  color: var(--color-text-secondary);
}

.commits {
  margin: 0 0 var(--spacing-md);
  padding: 0;
  list-style: none;
}

.commits li {
  --trail: calc(var(--row) + 460ms + var(--k) * 70ms);
  position: relative;
  padding-left: var(--spacing-lg);
  line-height: var(--line-height-relaxed);
  color: var(--color-text-secondary);
}

.commits li::before {
  content: '*';
  position: absolute;
  left: 0;
  font-family: var(--font-family-mono);
  color: var(--rail-color);
}

.stack {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs) var(--spacing-sm);
  margin: 0;
  animation: refs-in 0.36s ease-out backwards;
  animation-delay: var(--row-end);
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

.more {
  margin-top: var(--spacing-md);
  animation: refs-in 0.36s ease-out backwards;
  animation-delay: calc(var(--row-end) + 80ms);
}

.more summary {
  display: inline-flex;
  align-items: baseline;
  gap: var(--spacing-xs);
  cursor: pointer;
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
  color: var(--color-link);
}

.more summary::before {
  content: '$';
  color: var(--color-text-muted);
}

.more summary:hover {
  color: var(--color-link-hover);
}

.more p {
  margin: var(--spacing-sm) 0 0;
  padding-left: var(--spacing-md);
  border-left: 1px solid var(--color-bg-tertiary);
  line-height: var(--line-height-relaxed);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

@media (prefers-reduced-motion: reduce) {
  .trunk,
  .branch,
  .cap,
  .tail,
  .node,
  .fill,
  .stack,
  .more {
    animation: none;
  }
}
</style>
