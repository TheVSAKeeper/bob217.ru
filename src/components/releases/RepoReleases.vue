<script lang="ts" setup>
import { computed, ref } from 'vue'
import ReleaseLine from '@/components/releases/ReleaseLine.vue'
import VersionTrack from '@/components/releases/VersionTrack.vue'
import type { ReleaseGroup, ReleaseRow } from '@/composables/useReleases'
import { plural } from '@/utils/format'

const HEAD_ROWS = 5

const props = defineProps<{
  group: ReleaseGroup
  openKey: string | null
}>()

const emit = defineEmits<{
  toggle: [key: string]
}>()

const expanded = ref(false)

const keyOf = (row: ReleaseRow): string => `${props.group.repo}:${row.release.tag}`

const hidden = computed(() => props.group.rows.length - HEAD_ROWS)

const foldable = computed(() => hidden.value > 1)

const rows = computed(() =>
  foldable.value && !expanded.value ? props.group.rows.slice(0, HEAD_ROWS) : props.group.rows,
)

const listId = computed(() => `releases-${props.group.repo}`.replace(/[^\w-]/g, '-'))

const toggleTail = (): void => {
  const openIndex = props.group.rows.findIndex((row) => keyOf(row) === props.openKey)

  if (expanded.value && props.openKey && openIndex >= HEAD_ROWS) {
    emit('toggle', props.openKey)
  }

  expanded.value = !expanded.value
}
</script>

<template>
  <section class="group" :style="{ '--repo-color': group.color }">
    <h2 class="repo-head">
      <span class="hash">##</span>
      <a class="repo" :href="group.url" target="_blank" rel="noopener noreferrer">{{
        group.repo
      }}</a>
      <i class="fill" aria-hidden="true"></i>
      <span class="count"
        >{{ group.rows.length }} {{ plural(group.rows.length, 'релиз', 'релиза', 'релизов') }}</span
      >
      <span v-if="group.downloads" class="grabs">↓{{ group.downloads }}</span>
    </h2>

    <VersionTrack
      :dots="group.track"
      :label="`${group.repo}: ${group.rows.length} релизов, последний ${group.rows[0]?.date}`"
    />

    <ul :id="listId" class="lines">
      <ReleaseLine
        v-for="(row, i) in rows"
        :key="row.release.tag"
        :row="row"
        :repo="group.repo"
        :index="i"
        :open="openKey === keyOf(row)"
        @toggle="emit('toggle', keyOf(row))"
      />
    </ul>

    <button
      v-if="foldable"
      class="more"
      type="button"
      :aria-expanded="expanded"
      :aria-controls="listId"
      @click="toggleTail"
    >
      <span class="cmd"
        >$ gh release list --limit {{ expanded ? HEAD_ROWS : group.rows.length }}</span
      >
      <i class="fill" aria-hidden="true"></i>
      <span class="hint">{{
        expanded
          ? `# свернуть до ${HEAD_ROWS}`
          : `# +${hidden} старых ${plural(hidden, 'релиз', 'релиза', 'релизов')}`
      }}</span>
    </button>
  </section>
</template>

<style scoped>
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

.count,
.grabs {
  white-space: nowrap;
  font-size: var(--font-size-xs);
  font-variant-numeric: tabular-nums;
}

.grabs {
  color: var(--color-accent);
  opacity: 0.85;
}

.lines {
  margin: 0;
  padding: 0;
  list-style: none;
}

.more {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--spacing-sm);
  width: 100%;
  min-height: 44px;
  padding: var(--spacing-sm) var(--spacing-sm) var(--spacing-sm) 3ch;
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
  text-align: left;
  color: var(--color-text-muted);
  background: none;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.more:hover .cmd,
.more:focus-visible .cmd {
  color: color-mix(in srgb, var(--repo-color, var(--color-accent)) 75%, var(--color-text-primary));
}

.more:hover .hint,
.more:focus-visible .hint {
  color: var(--color-text-secondary);
}

.more:focus-visible {
  outline: 1px solid var(--color-accent);
  outline-offset: -1px;
}

.cmd,
.hint {
  white-space: nowrap;
  transition: color var(--transition-fast);
}

.hint {
  margin-left: auto;
}
</style>
