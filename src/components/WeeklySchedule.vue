<script lang="ts" setup>
import { computed } from 'vue'
import { useWeekSchedule } from '@/composables/useWeekSchedule'

const { days } = useWeekSchedule()

const merged = computed(() => days.value.some((d) => d.merges && (d.isPast || d.isCurrent)))
</script>

<template>
  <ul class="week">
    <li
      v-for="item in days"
      :key="item.day"
      class="day"
      :class="[
        `on-${item.lane}`,
        {
          'is-today': item.isCurrent,
          'is-past': item.isPast,
          'is-future': !item.isCurrent && !item.isPast,
        },
      ]"
      :aria-current="item.isCurrent ? 'date' : undefined"
    >
      <span class="rail" aria-hidden="true">
        <i class="trunk"></i>
        <i v-if="item.lane === 'weekend'" class="branch" :class="{ capped: item.merges }"></i>
        <i v-if="item.forks" class="fork"></i>
        <i v-if="item.merges" class="merge"></i>
        <i class="node"></i>
      </span>

      <div class="day-body">
        <p class="day-head">
          <span class="day-name">{{ item.label }}</span>
          <span class="day-date">{{ item.date }}</span>
          <span v-if="item.isCurrent" class="chip head">HEAD</span>
          <span v-else-if="item.branchTip" class="chip">weekend</span>
        </p>
        <p class="day-text">
          <a
            v-if="item.link"
            :href="item.link.url"
            target="_blank"
            rel="noopener noreferrer"
            :aria-label="`${item.link.text} – откроется в новой вкладке`"
          >
            {{ item.link.text }}
          </a>
          <template v-if="item.link">. </template>
          {{ item.description }}
        </p>
      </div>
    </li>

    <li class="day tail on-main" :class="{ 'is-past': merged }" aria-hidden="true">
      <span class="rail">
        <i class="trunk"></i>
        <i class="node"></i>
      </span>
      <p class="tail-text">weekend → main</p>
    </li>
  </ul>
</template>

<style scoped>
.week {
  --lane-a: 14px;
  --lane-b: 34px;
  --rail-w: 50px;
  --node-y: 12px;
  --rail-color: var(--color-bg-tertiary);
  --rail-done: #5c5c5c;
  --curve: 11px;

  margin: 0;
  padding: 0;
  list-style: none;
}

.day {
  display: grid;
  grid-template-columns: var(--rail-w) 1fr;
}

.day.on-main {
  --lane: var(--lane-a);
}

.day.on-weekend {
  --lane: var(--lane-b);
}

.day.is-past,
.day.is-today {
  --rail-color: var(--rail-done);
}

.day.is-today {
  --node-y: 21px;
}

.rail {
  position: relative;
  display: block;
}

.trunk,
.branch {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--rail-color);
}

.trunk {
  left: var(--lane-a);
}

.branch {
  left: var(--lane-b);
}

.day:first-child .trunk {
  top: var(--node-y);
}

.branch.capped,
.day.tail .trunk {
  bottom: auto;
  height: var(--node-y);
}

.fork,
.merge {
  position: absolute;
  left: var(--lane-a);
  top: var(--node-y);
  bottom: 0;
  width: calc(var(--lane-b) - var(--lane-a) + 2px);
}

.fork {
  border-left: 2px solid var(--rail-color);
  border-bottom: 2px solid var(--rail-color);
  border-bottom-left-radius: var(--curve);
}

.merge {
  border-right: 2px solid var(--rail-color);
  border-bottom: 2px solid var(--rail-color);
  border-bottom-right-radius: var(--curve);
}

.node {
  position: absolute;
  left: calc(var(--lane) + 1px);
  top: var(--node-y);
  width: 11px;
  height: 11px;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  border: 2px solid var(--rail-color);
  background: var(--color-bg-primary);
}

.day.is-past .node {
  background: var(--rail-color);
}

.day.is-today .node {
  width: 15px;
  height: 15px;
  border-color: var(--color-accent);
  background: var(--color-accent);
  box-shadow:
    0 0 0 4px rgba(255, 204, 0, 0.14),
    var(--shadow-glow);
}

.day.tail .node {
  width: 8px;
  height: 8px;
  border-width: 2px;
}

.day-body {
  min-width: 0;
  padding-bottom: var(--spacing-md);
}

.day.is-past .day-name,
.day.is-past .day-date,
.day.is-past .day-text,
.day.is-past .chip {
  color: var(--color-text-tertiary);
}

.day.is-today .day-body {
  padding: var(--spacing-sm) var(--spacing-md);
  margin-bottom: var(--spacing-md);
  background: var(--color-bg-elevated);
  border: 1px solid rgba(255, 204, 0, 0.28);
  border-radius: var(--radius-md);
}

.day-head {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  margin: 0;
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

.day.is-past .day-name,
.day.is-future .day-name {
  font-weight: 400;
}

.day.is-today .day-name {
  color: var(--color-accent);
  font-weight: 700;
}

.day-date {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
}

.chip {
  font-size: var(--font-size-xs);
  line-height: 1.4;
  padding: 0 var(--spacing-sm);
  border: 1px solid var(--color-bg-tertiary);
  border-radius: var(--radius-full);
  color: var(--color-text-muted);
  letter-spacing: 0.08em;
}

.chip.head {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.day-text {
  margin: var(--spacing-xs) 0 0 0;
  font-size: var(--font-size-sm);
  line-height: var(--line-height-relaxed);
  color: var(--color-text-secondary);
}

.day-text a {
  color: var(--color-link);
}

.day.is-past .day-text a {
  color: color-mix(in srgb, var(--color-link) 80%, var(--color-bg-primary));
}

.day-text a:hover,
.day.is-past .day-text a:hover {
  color: var(--color-link-hover);
}

.tail-text {
  margin: 0;
  line-height: 24px;
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
  letter-spacing: 0.12em;
  color: var(--color-text-tertiary);
}

@media (max-width: 720px) {
  .week {
    --lane-b: 28px;
    --rail-w: 42px;
    --curve: 9px;
  }
}
</style>
