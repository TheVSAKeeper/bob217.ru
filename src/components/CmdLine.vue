<script lang="ts" setup>
import { nextTick, ref, watch } from 'vue'

type CmdPhase = 'idle' | 'erasing' | 'typing'

const props = defineProps<{
  text?: string
  button?: boolean
}>()

const emit = defineEmits<{
  (e: 'run'): void
  (e: 'done'): void
}>()

const textEl = ref<HTMLElement | null>(null)
const shown = ref(props.text ?? '')
const phase = ref<CmdPhase>('idle')
const settling = ref(false)
let interactive = false

const isReduced = (): boolean => window.matchMedia('(prefers-reduced-motion: reduce)').matches

const tune = (width: number): number => {
  const el = textEl.value
  if (!el) return 0
  const chars = el.textContent?.trim().length ?? 0
  el.style.setProperty('--cmd-width', `${Math.ceil(width)}px`)
  el.style.setProperty('--cmd-steps', `steps(${Math.max(chars, 1)})`)
  el.style.setProperty('--cmd-erase-ms', `${Math.min(100 + chars * 10, 400)}ms`)
  el.style.setProperty('--cmd-type-ms', `${Math.min(220 + chars * 30, 1250)}ms`)
  return chars
}

const replay = (): boolean => {
  const el = textEl.value
  if (!el || phase.value !== 'idle' || isReduced()) return false
  if (tune(el.getBoundingClientRect().width) === 0) return false
  settling.value = false
  phase.value = 'erasing'
  return true
}

const rerun = (event: MouseEvent): void => {
  if (event.target instanceof Element && event.target.closest('a')) return
  if (window.getSelection()?.toString()) return
  if (!replay()) return
  interactive = true
  emit('run')
}

watch(
  () => props.text,
  (next) => {
    if (next === undefined) return
    if (isReduced()) shown.value = next
    else if (phase.value === 'idle') replay()
  },
)

const onTextAnimationEnd = async (event: AnimationEvent): Promise<void> => {
  if (event.animationName.startsWith('cmd-erase')) {
    shown.value = props.text ?? shown.value
    await nextTick()
    const el = textEl.value
    if (!el) return
    tune(el.scrollWidth + 2)
    phase.value = 'typing'
    return
  }

  if (event.animationName.startsWith('cmd-type')) {
    phase.value = 'idle'
    settling.value = true
    if (interactive) {
      interactive = false
      emit('done')
    }
    if (props.text !== undefined && props.text !== shown.value) void nextTick().then(replay)
  }
}
</script>

<template>
  <component
    :is="button ? 'button' : 'p'"
    :type="button ? 'button' : undefined"
    class="cmd"
    :class="[phase, { settling }]"
    @click="rerun"
  >
    <span class="cmd-prompt">$&nbsp;</span
    ><span ref="textEl" class="cmd-text" @animationend="onTextAnimationEnd"
      ><slot>{{ shown }}</slot></span
    ><span class="cmd-cursor" aria-hidden="true" @animationend="settling = false"></span>
  </component>
</template>

<style scoped>
.cmd {
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  letter-spacing: 0.03em;
  margin: 0 0 var(--spacing-sm) 0;
  cursor: pointer;
}

button.cmd {
  display: inline-block;
  background: none;
  border: 0;
  padding: 0;
  text-align: left;
  font: inherit;
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
  letter-spacing: 0.03em;
}

.cmd-prompt {
  color: var(--color-accent);
}

.cmd-cursor {
  display: inline-block;
  width: 1ch;
  height: 1.1em;
  margin-left: 1px;
  vertical-align: text-bottom;
  background: var(--color-accent);
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.cmd:hover .cmd-cursor {
  opacity: 0.35;
}

.cmd.erasing .cmd-text,
.cmd.typing .cmd-text {
  display: inline-block;
  overflow: hidden;
  white-space: nowrap;
  vertical-align: bottom;
}

.cmd.erasing .cmd-text {
  animation: cmd-erase var(--cmd-erase-ms) var(--cmd-steps) forwards;
}

.cmd.typing .cmd-text {
  animation: cmd-type var(--cmd-type-ms) var(--cmd-steps) 180ms both;
}

.cmd.erasing .cmd-cursor,
.cmd.typing .cmd-cursor {
  opacity: 1;
  transition: none;
}

.cmd.settling .cmd-cursor {
  animation: cmd-blink 1.06s steps(2, jump-none) 2 forwards;
}

@keyframes cmd-erase {
  from {
    max-width: var(--cmd-width);
  }
  to {
    max-width: 0;
  }
}

@keyframes cmd-type {
  from {
    max-width: 0;
  }
  to {
    max-width: var(--cmd-width);
  }
}

@keyframes cmd-blink {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
</style>
