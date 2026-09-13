<script lang="ts" setup>
import { ref, useId } from 'vue'
import { langColor, LANG_SHORT } from '@/utils/lang'

defineProps<{
  langs: { lang: string; count: number }[]
  off: Set<string>
}>()

const emit = defineEmits<{
  (e: 'toggle', lang: string): void
}>()

const open = ref(false)
const bodyId = useId()
</script>

<template>
  <div class="ov bl" :class="{ open }">
    <button
      type="button"
      class="toggle"
      :aria-expanded="open"
      :aria-controls="bodyId"
      @click="open = !open"
    >
      $ legend <span class="caret">{{ open ? '▾' : '▸' }}</span>
    </button>
    <div :id="bodyId" class="body">
      <div class="langs">
        <button
          v-for="l in langs"
          :key="l.lang"
          class="lang"
          :class="{ off: off.has(l.lang) }"
          @click="emit('toggle', l.lang)"
        >
          <span class="dot" :style="{ background: langColor(l.lang) }"></span>
          {{ LANG_SHORT[l.lang] ?? l.lang }} <b>{{ l.count }}</b>
        </button>
      </div>
      <div class="legrow">
        <span class="lk">
          <span class="sat"></span>соавтор с принятыми PR, размер = вклад (клик → профиль)
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ov {
  position: absolute;
  z-index: 5;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.75);
}

.bl {
  bottom: var(--spacing-md);
  left: var(--spacing-lg);
  max-width: 64%;
}

.toggle {
  display: none;
  align-items: center;
  gap: 6px;
  min-height: 32px;
  padding: 0 var(--spacing-xs) 0 0;
  font-family: var(--font-family-mono);
  font-size: 12px;
  color: var(--color-link);
  background: none;
  border: none;
  cursor: pointer;
}

.caret {
  color: var(--color-accent);
}

.langs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 13px;
  align-items: center;
}

.lang {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-family: var(--font-family-mono);
  font-size: 11px;
  color: var(--color-text-secondary);
  background: none;
  border: none;
  padding: 0;
  transition: opacity var(--transition-fast);
}

.lang.off {
  opacity: 0.3;
}

.lang b {
  color: var(--color-text-muted);
  font-weight: 400;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex: none;
  box-shadow: 0 0 6px currentColor;
}

.legrow {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
  margin-top: 9px;
  font-family: var(--font-family-mono);
  font-size: 11px;
  color: var(--color-text-muted);
}

.lk {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.sat {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-accent);
  box-shadow: 0 0 7px var(--color-accent);
  flex: none;
}

@media (max-width: 720px) {
  .bl {
    right: var(--spacing-md);
    left: var(--spacing-md);
    max-width: none;
  }

  .toggle {
    display: inline-flex;
  }

  .body {
    display: none;
  }

  .bl.open .body {
    display: block;
    max-height: 40vh;
    overflow: auto;
    overscroll-behavior: contain;
  }
}
</style>
