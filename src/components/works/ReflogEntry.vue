<script lang="ts" setup>
import type { WorkRow } from '@/composables/useWorkLog'
import { useScramble } from '@/composables/useScramble'

const props = defineProps<{
  row: WorkRow
  index: number
}>()

const hash = useScramble(props.row.hash, 200 + Math.min(props.index * 40, 400))
</script>

<template>
  <li class="entry" :class="{ 'is-head': index === 0 }" :style="{ '--i': index }">
    <span class="rail" aria-hidden="true">
      <i class="line"></i>
      <i class="node"></i>
    </span>

    <article class="body">
      <p class="meta">
        <span class="hash">{{ hash }}</span>
        <span class="ptr">{{ row.pointer }}</span>
        <span class="kind" :class="row.entry.kind">{{ row.kindLabel }}</span>
        <i class="fill" aria-hidden="true"></i>
        <span v-if="index === 0" class="badge">HEAD</span>
      </p>

      <h3 class="title">{{ row.entry.title }}</h3>

      <p class="refs">
        <span
          v-for="ref in row.refs"
          :key="ref.name"
          class="ref"
          :class="{ lang: ref.color }"
          :style="ref.color ? { '--ref': ref.color } : undefined"
          >{{ ref.name }}</span
        >
      </p>

      <div class="text">
        <p v-for="(paragraph, j) in row.entry.description" :key="j">{{ paragraph }}</p>
      </div>

      <p v-if="row.entry.links?.length" class="links">
        <a
          v-for="link in row.entry.links"
          :key="link.url"
          class="link"
          :href="link.url"
          target="_blank"
          rel="noopener noreferrer"
          >{{ link.label }}</a
        >
      </p>
    </article>
  </li>
</template>

<style scoped>
.entry {
  --trail: calc(200ms + min(calc(var(--i) * 40ms), 400ms));
  --pass: calc(var(--walk) + (var(--n) - 1 - var(--i)) * 38ms);
  display: grid;
  grid-template-columns: var(--rail-w) 1fr;
}

.rail {
  position: relative;
}

.line {
  position: absolute;
  left: var(--lane);
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--rail-tick);
  transform-origin: top;
  animation: rail-draw 0.4s ease backwards;
  animation-delay: var(--trail);
}

.entry:first-child .line {
  top: var(--node-y);
}

@keyframes rail-draw {
  from {
    transform: scaleY(0);
  }
}

.node {
  position: absolute;
  left: calc(var(--lane) + 1px);
  top: var(--node-y);
  width: 9px;
  height: 9px;
  transform: translate(-50%, -50%);
  border-radius: var(--radius-full);
  background: var(--color-text-muted);
  transition: background var(--transition-fast);
  animation:
    node-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) backwards,
    head-pass 0.42s ease-out;
  animation-delay: calc(var(--trail) + 120ms), var(--pass);
}

@keyframes node-pop {
  from {
    transform: translate(-50%, -50%) scale(0);
  }
}

@keyframes head-pass {
  35% {
    transform: translate(-50%, -50%) scale(1.7);
    background: var(--color-accent);
    box-shadow: 0 0 0 7px rgba(255, 204, 0, 0.18);
  }
}

.entry:hover .node {
  background: var(--color-text-secondary);
}

.is-head .node,
.is-head:hover .node {
  width: 13px;
  height: 13px;
  background: var(--color-accent);
  animation: head-land 0.52s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  animation-delay: var(--pass);
}

@keyframes head-land {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.2);
    box-shadow: 0 0 0 0 rgba(255, 204, 0, 0);
  }
  55% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.5);
    box-shadow: 0 0 0 14px rgba(255, 204, 0, 0.16);
  }
  to {
    transform: translate(-50%, -50%) scale(1);
    box-shadow:
      0 0 0 4px rgba(255, 204, 0, 0.14),
      var(--shadow-glow);
  }
}

.body {
  padding: 0 0 var(--spacing-xl);
  animation: body-in 0.45s cubic-bezier(0.16, 1, 0.3, 1) backwards;
  animation-delay: var(--trail);
}

@keyframes body-in {
  from {
    opacity: 0;
    transform: translateX(-14px);
  }
}

.meta {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-md);
  margin: 0;
  line-height: 1.7;
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.hash {
  color: var(--color-text-secondary);
  font-variant-numeric: tabular-nums;
}

.ptr {
  letter-spacing: 0.04em;
}

.kind {
  letter-spacing: 0.04em;
}

.kind.order {
  color: var(--color-link);
}

.kind.hired {
  color: var(--color-accent);
}

.fill {
  flex: 1;
  min-width: var(--spacing-md);
  height: 0;
  border-bottom: 1px dotted currentcolor;
  opacity: 0.35;
  transform: translateY(-3px);
}

.badge {
  padding: 0 var(--spacing-sm);
  color: var(--color-accent);
  border: 1px solid var(--color-accent);
  border-radius: var(--radius-full);
  letter-spacing: 0.08em;
}

.title {
  margin: var(--spacing-xs) 0 0;
  font-family: var(--font-family-heading);
  font-size: var(--font-size-lg);
  font-weight: 600;
  line-height: var(--line-height-tight);
  color: var(--color-text-primary);
}

.is-head .title {
  font-size: var(--font-size-xl);
}

.refs {
  margin: var(--spacing-xs) 0 0;
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.refs::before {
  content: '(';
}

.refs::after {
  content: ')';
}

.ref:not(:last-child)::after {
  content: ', ';
  color: var(--color-text-muted);
}

.ref.lang::before {
  content: '';
  display: inline-block;
  width: 0.5em;
  height: 0.5em;
  margin-right: 0.5ch;
  border-radius: var(--radius-full);
  background: var(--ref);
  vertical-align: 0.05em;
}

.text {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  max-width: 68ch;
  margin-top: var(--spacing-md);
}

.text p {
  margin: 0;
  font-size: var(--font-size-sm);
  line-height: var(--line-height-relaxed);
  color: var(--color-text-secondary);
}

.links {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
  margin: var(--spacing-md) 0 0;
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
}

.link {
  color: var(--color-link);
  text-decoration: underline dotted;
  text-underline-offset: 4px;
  text-decoration-color: rgba(0, 188, 212, 0.4);
}

.link:hover {
  color: var(--color-link-hover);
  text-decoration-color: currentcolor;
}

@media (max-width: 720px) {
  .is-head .title {
    font-size: var(--font-size-lg);
  }

  .title {
    font-size: var(--font-size-base);
  }
}

@media (prefers-reduced-motion: reduce) {
  .line,
  .node,
  .body,
  .is-head .node {
    animation: none;
  }

  .is-head .node {
    box-shadow:
      0 0 0 4px rgba(255, 204, 0, 0.14),
      var(--shadow-glow);
  }
}
</style>
