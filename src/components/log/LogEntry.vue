<script lang="ts" setup>
import { ref } from 'vue'
import GraphLanes from '@/components/log/GraphLanes.vue'
import type { CommitRow } from '@/composables/useCommitLog'
import { useScramble } from '@/composables/useScramble'

const props = defineProps<{
  row: CommitRow
  index: number
  head?: boolean
}>()

const SCRAMBLED_ROWS = 12

const sha =
  props.index < SCRAMBLED_ROWS
    ? useScramble(props.row.commit.short, 200 + props.index * 22)
    : ref(props.row.commit.short)
</script>

<template>
  <li class="row" :class="{ head }" :style="{ '--i': index, '--repo-color': row.color }">
    <GraphLanes :lanes="row.lanes" :head="head" />
    <div class="body typed">
      <a class="sha" :href="row.commit.url" target="_blank" rel="noopener noreferrer"
        ><span class="sr-only">коммит </span>{{ sha
        }}<span class="sr-only"> в {{ row.commit.repo }}</span></a
      >
      <span class="title">{{ row.commit.title }}</span>
      <span class="meta">
        <a class="repo" :href="row.commit.repoUrl" target="_blank" rel="noopener noreferrer">{{
          row.commit.repo
        }}</a>
        <span class="who">{{ row.commit.author }}</span>
        <span class="at">{{ row.time }}</span>
      </span>
    </div>
  </li>
</template>

<style scoped>
.row {
  --trail: min(calc(var(--i, 0) * 22ms), 520ms);
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--spacing-md);
}

.body {
  position: relative;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: baseline;
  gap: var(--spacing-sm) var(--spacing-md);
  padding: 5px var(--spacing-sm);
  margin-left: calc(var(--spacing-sm) * -1);
  border-radius: var(--radius-sm);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  transition: background var(--transition-fast);
}

.body::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  border-radius: var(--radius-full);
  background: var(--repo-color);
  opacity: 0;
  transform: scaleY(0.3);
  transition:
    opacity var(--transition-fast),
    transform var(--transition-fast);
}

.row:hover .body {
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--repo-color) 14%, transparent),
    transparent 72%
  );
}

.row:hover .body::before {
  opacity: 0.9;
  transform: scaleY(1);
}

.row:hover :deep(.dot) {
  transform: scale(1.3);
  box-shadow:
    0 0 0 3px var(--color-bg-primary),
    0 0 14px var(--repo-color);
}

.sha {
  padding: 0 3px;
  margin: 0 -3px;
  color: var(--color-link);
  text-decoration: none;
  letter-spacing: 0.02em;
  transition:
    background var(--transition-fast),
    color var(--transition-fast);
}

.row:hover .sha {
  color: var(--color-bg-primary);
  background: var(--color-link);
}

.sha:hover {
  background: var(--color-accent);
}

.title {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--color-text-secondary);
  transition: color var(--transition-fast);
}

.row:hover .title {
  color: var(--color-text-primary);
}

.head .title {
  color: var(--color-text-primary);
}

.meta {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-sm);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.repo {
  color: color-mix(in srgb, var(--repo-color) 75%, var(--color-text-primary));
  text-decoration: none;
  opacity: 0.85;
}

.repo:hover {
  opacity: 1;
  text-decoration: underline;
}

.who::before {
  content: '·';
  margin-right: var(--spacing-sm);
}

.at {
  font-variant-numeric: tabular-nums;
}

@media (max-width: 720px) {
  .body {
    grid-template-columns: auto 1fr;
  }

  .meta {
    grid-column: 1 / -1;
  }

  .title {
    white-space: normal;
  }
}

@media (prefers-reduced-motion: reduce) {
  .body {
    animation: none;
  }
}
</style>
