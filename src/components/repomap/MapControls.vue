<script lang="ts" setup>
import { computed } from 'vue'
import CmdLine from '@/components/CmdLine.vue'
import { SIZE_OPTIONS, type SizeBy } from '@/composables/useForkMap'

const props = defineProps<{
  filt: 'all' | 'forked'
  flowLayer: boolean
  sizeBy: SizeBy
  total: number
  forked: number
  sizeHint: string
  error: string | null
  staleAt: number | null
}>()

const DAY = 24 * 60 * 60 * 1000

const staleTime = computed(() => {
  if (props.staleAt === null) return ''
  const at = new Date(props.staleAt)
  const time = { hour: '2-digit', minute: '2-digit' } as const
  return Date.now() - props.staleAt < DAY
    ? at.toLocaleTimeString('ru-RU', time)
    : at.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', ...time })
})

const emit = defineEmits<{
  (e: 'update:filt', value: 'all' | 'forked'): void
  (e: 'update:sizeBy', value: SizeBy): void
  (e: 'toggle-flow'): void
  (e: 'rebuild'): void
}>()
</script>

<template>
  <div class="ov tl">
    <CmdLine button @run="emit('rebuild')">build --map --from-scratch</CmdLine>
    <h1>Карта репозиториев</h1>
    <div class="chips">
      <button
        type="button"
        class="chip"
        :class="{ on: filt === 'all' }"
        :aria-pressed="filt === 'all'"
        @click="emit('update:filt', 'all')"
      >
        все {{ total }}
      </button>
      <button
        type="button"
        class="chip"
        :class="{ on: filt === 'forked' }"
        :aria-pressed="filt === 'forked'"
        @click="emit('update:filt', 'forked')"
      >
        форкнутые {{ forked }}
      </button>
      <button
        type="button"
        class="chip"
        :class="{ on: flowLayer }"
        :aria-pressed="flowLayer"
        title="Жёлтые импульсы: принятые PR соавторов в основной репозиторий"
        @click="emit('toggle-flow')"
      >
        поток PR
      </button>
    </div>
    <div class="chips size">
      <span class="chips-lbl">размер:</span>
      <button
        v-for="o in SIZE_OPTIONS"
        :key="o.key"
        type="button"
        class="chip sm"
        :class="{ on: sizeBy === o.key }"
        :aria-pressed="sizeBy === o.key"
        @click="emit('update:sizeBy', o.key)"
      >
        {{ o.label }}
      </button>
    </div>
    <div class="note">{{ sizeHint }}</div>
    <div v-if="staleAt !== null" class="note warn">
      warning: данные от {{ staleTime }}<template v-if="error">, {{ error }}</template>
    </div>
    <div v-else-if="error" class="note err">{{ error }}</div>
    <div v-if="flowLayer" class="note flow">жёлтые импульсы – принятые PR соавторов в оригинал</div>
  </div>
</template>

<style scoped>
.ov {
  position: absolute;
  z-index: 5;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.75);
}

.tl {
  top: var(--spacing-lg);
  left: var(--spacing-lg);
  max-width: 62%;
}

h1 {
  margin: 0;
  justify-content: flex-start;
  text-align: left;
  font-family: var(--font-family-heading);
  font-weight: 600;
  font-size: var(--font-size-3xl);
  letter-spacing: -0.01em;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 7px;
  margin-top: var(--spacing-md);
}

.chips.size {
  margin-top: 8px;
  gap: 6px;
}

.chips-lbl {
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.chip {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
  padding: 2px 11px;
  border-radius: var(--radius-full);
  background: rgba(38, 38, 38, 0.7);
  border: 1px solid var(--color-bg-tertiary);
  color: var(--color-text-muted);
  cursor: pointer;
  transition:
    color var(--transition-base),
    border-color var(--transition-base),
    background var(--transition-base);
}

.chip.sm {
  padding: 2px 9px;
}

.chip:hover {
  color: var(--color-text-secondary);
  border-color: var(--color-text-muted);
}

.chip.on {
  color: var(--color-link);
  border-color: var(--color-link);
  background: var(--color-bg-secondary);
}

.note {
  font-family: var(--font-family-mono);
  font-size: 11px;
  color: var(--color-text-muted);
  margin-top: 7px;
}

.note.flow {
  color: var(--color-accent);
  opacity: 0.85;
}

.note.err {
  color: var(--color-danger);
}

.note.warn {
  color: var(--color-accent);
}

@media (prefers-reduced-motion: reduce) {
  .chip {
    transition: none;
  }
}

@media (max-width: 720px) {
  .tl {
    max-width: 78%;
  }

  h1 {
    font-size: var(--font-size-2xl);
  }
}
</style>
