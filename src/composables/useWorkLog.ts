import { computed, type ComputedRef } from 'vue'
import { LANG_COLORS } from '@/utils/lang'
import type { WorkEntry, WorkKind } from '@/types/work'
import worksJson from '@/assets/data/works.json'

export interface WorkRef {
  name: string
  color: string | null
}

export interface WorkRow {
  entry: WorkEntry
  hash: string
  pointer: string
  kindLabel: string
  refs: WorkRef[]
}

const KIND_LABELS: Record<WorkKind, string> = {
  order: 'заказ',
  hired: 'по найму',
  fun: 'для души',
}

const FNV_OFFSET = 0x811c9dc5
const FNV_PRIME = 0x01000193

const shortHash = (seed: string): string => {
  let h = FNV_OFFSET
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, FNV_PRIME)
  }
  return (h >>> 0).toString(16).padStart(8, '0').slice(0, 7)
}

export function useWorkLog(): { rows: ComputedRef<WorkRow[]> } {
  const entries = worksJson as readonly WorkEntry[]

  const rows = computed<WorkRow[]>(() =>
    entries.map((entry, i) => ({
      entry,
      hash: shortHash(`${entry.id}:${entry.title}`),
      pointer: `HEAD@{${i}}`,
      kindLabel: KIND_LABELS[entry.kind],
      refs: entry.tags.map((name) => ({ name, color: LANG_COLORS[name] ?? null })),
    })),
  )

  return { rows }
}
