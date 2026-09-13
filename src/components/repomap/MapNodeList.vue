<script lang="ts" setup>
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'
import type { Repo } from '@/composables/useForkMap'
import { plural } from '@/utils/format'

const props = defineProps<{
  repos: Repo[]
}>()

const emit = defineEmits<{
  (e: 'focus', name: string): void
  (e: 'home'): void
}>()

const sorted = computed(() => [...props.repos].sort((a, b) => a.name.localeCompare(b.name, 'en')))

const listEl = useTemplateRef<HTMLElement>('listBox')
const active = ref(0)

const detail = (repo: Repo): string =>
  `, ${repo.lang}, ${repo.stars} ${plural(repo.stars, 'звезда', 'звезды', 'звёзд')}, ${repo.merged} принятых PR`

const buttons = (): HTMLButtonElement[] =>
  listEl.value ? Array.from(listEl.value.querySelectorAll('button')) : []

const move = async (index: number): Promise<void> => {
  const total = sorted.value.length
  if (total === 0) return
  active.value = ((index % total) + total) % total
  await nextTick()
  buttons()[active.value]?.focus()
}

const onFocus = (index: number, name: string): void => {
  active.value = index
  emit('focus', name)
}

watch(sorted, async (list, prev) => {
  const name = prev[active.value]?.name
  const kept = name === undefined ? -1 : list.findIndex((r) => r.name === name)
  if (kept >= 0) {
    active.value = kept
    return
  }
  const inside = listEl.value?.contains(document.activeElement) ?? false
  active.value = Math.min(active.value, Math.max(list.length - 1, 0))
  if (!inside || list.length === 0) return
  await nextTick()
  buttons()[active.value]?.focus()
})
</script>

<template>
  <ul
    ref="listBox"
    class="nodelist"
    aria-label="репозитории карты"
    @keydown.down.prevent="move(active + 1)"
    @keydown.up.prevent="move(active - 1)"
    @keydown.home.prevent="move(0)"
    @keydown.end.prevent="move(sorted.length - 1)"
    @keydown.escape="emit('home')"
  >
    <li v-for="(repo, i) in sorted" :key="repo.name">
      <button type="button" :tabindex="i === active ? 0 : -1" @focus="onFocus(i, repo.name)">
        {{ repo.name }}<span class="sr-only">{{ detail(repo) }}</span>
      </button>
    </li>
  </ul>
</template>

<style scoped>
.nodelist {
  position: absolute;
  bottom: calc(var(--spacing-md) + 40px);
  left: 50%;
  z-index: var(--z-tooltip);
  width: 0;
  height: 0;
  margin: 0;
  padding: 0;
  list-style: none;
}

.nodelist button {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: none;
  padding: 0;
  background: none;
  color: inherit;
}

.nodelist button:focus-visible {
  position: absolute;
  display: inline-flex;
  align-items: center;
  bottom: 0;
  left: 0;
  width: max-content;
  height: auto;
  min-height: 24px;
  overflow: visible;
  clip-path: none;
  transform: translateX(-50%);
  padding: 4px 13px;
  border: 1px solid var(--color-link);
  border-radius: var(--radius-full);
  background: var(--color-bg-elevated);
  box-shadow: var(--shadow-md);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
  color: var(--color-link);
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
</style>
