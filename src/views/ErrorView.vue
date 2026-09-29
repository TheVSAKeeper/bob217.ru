<script lang="ts" setup>
import { useRouter } from 'vue-router'
import CmdLine from '@/components/CmdLine.vue'
import { useCmdReplay } from '@/composables/useCmdReplay'
import { SITE_ORIGIN } from '@/utils/meta'

const router = useRouter()

const goBack = () => router.back()
const goHome = () => router.push('/')

const { phaseClass, start, print } = useCmdReplay(() => 280)
</script>

<template>
  <div class="err">
    <section class="term term--danger" :class="phaseClass">
      <h1 class="sr-only">500 – внутренняя ошибка сервера</h1>
      <p class="eyebrow"><span class="h">##</span> error</p>
      <CmdLine @run="start" @done="print">curl -sSf {{ SITE_ORIGIN }}</CmdLine>
      <div class="code cmd-out">500</div>
      <p class="fatal cmd-out"><span class="kw">fatal:</span> внутренняя ошибка сервера</p>
      <p class="hint cmd-out">что-то упало на нашей стороне – уже чиним.</p>
      <div class="actions cmd-out">
        <button class="cmd-btn" @click="goBack"><span class="p">$</span> cd -</button>
        <button class="cmd-btn" @click="goHome"><span class="p">$</span> cd ~/</button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.err {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: var(--spacing-xl);
}

.term {
  position: relative;
  width: 100%;
  max-width: 560px;
  overflow: hidden;
  padding: var(--spacing-xl);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-bg-tertiary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  font-family: var(--font-family-mono);
}

.term::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 3px;
  background: var(--color-danger);
}

.term--danger {
  --code-color: var(--color-danger);
  --code-glow: rgba(255, 102, 153, 0.35);
}

.eyebrow {
  margin: 0 0 var(--spacing-md);
  font-size: var(--font-size-xs);
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
}

.eyebrow .h {
  color: var(--color-accent);
}

.term .cmd {
  margin: 0;
  font-size: var(--font-size-sm);
  word-break: break-all;
}

.fatal.cmd-out {
  --print-delay: 90ms;
}

.hint.cmd-out {
  --print-delay: 180ms;
}

.actions.cmd-out {
  --print-delay: 280ms;
}

.term.cmd-printing {
  animation: term-shake 0.4s steps(1, end);
}

@keyframes term-shake {
  0%,
  100% {
    transform: none;
  }
  20% {
    transform: translate(3px, -2px);
  }
  40% {
    transform: translate(-4px, 2px);
  }
  60% {
    transform: translate(3px, 1px);
  }
  80% {
    transform: translate(-2px, -1px);
  }
}

.term.cmd-printing .code {
  animation: code-glitch 0.6s steps(1, end) both;
}

@keyframes code-glitch {
  0% {
    opacity: 0;
    transform: translateX(-8px);
    text-shadow:
      6px 0 rgba(102, 224, 255, 0.8),
      -6px 0 rgba(255, 102, 153, 0.8);
  }
  15% {
    opacity: 1;
    transform: translateX(6px) skewX(-4deg);
    text-shadow:
      -7px 0 rgba(102, 224, 255, 0.8),
      7px 0 rgba(255, 102, 153, 0.8);
  }
  30% {
    opacity: 1;
    transform: translateX(-4px);
    text-shadow:
      5px 0 rgba(102, 224, 255, 0.8),
      -5px 0 rgba(255, 102, 153, 0.8);
  }
  45% {
    opacity: 1;
    transform: translateX(3px) skewX(3deg);
    text-shadow:
      -3px 0 rgba(102, 224, 255, 0.8),
      3px 0 rgba(255, 102, 153, 0.8);
  }
  60% {
    opacity: 1;
    transform: none;
    text-shadow:
      2px 0 rgba(102, 224, 255, 0.8),
      -2px 0 rgba(255, 102, 153, 0.8);
  }
  100% {
    opacity: 1;
    transform: none;
    text-shadow: 0 0 24px var(--code-glow);
  }
}

.term.cmd-printing .fatal {
  animation-name: fatal-flicker;
  animation-duration: 0.5s;
  animation-timing-function: steps(1, end);
}

@keyframes fatal-flicker {
  0% {
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  20% {
    opacity: 0.15;
  }
  35% {
    opacity: 1;
  }
  45% {
    opacity: 0.3;
  }
  60% {
    opacity: 1;
  }
  75% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

.code {
  margin: var(--spacing-sm) 0 var(--spacing-xs);
  font-size: 5rem;
  font-weight: 700;
  line-height: 1;
  color: var(--code-color);
  text-shadow: 0 0 24px var(--code-glow);
}

.fatal {
  margin: var(--spacing-xs) 0 var(--spacing-sm);
  font-size: var(--font-size-lg);
  color: var(--color-danger);
}

.fatal .kw {
  font-weight: 700;
}

.hint {
  margin: 0 0 var(--spacing-xl);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.cmd-btn {
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  padding: var(--spacing-sm) var(--spacing-lg);
  cursor: pointer;
  color: var(--color-text-secondary);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-bg-tertiary);
  border-radius: var(--radius-md);
  transition: all var(--transition-base);
}

.cmd-btn .p {
  color: var(--color-accent);
}

.cmd-btn:hover {
  color: var(--color-text-primary);
  border-color: var(--color-accent);
  transform: translateY(-2px);
  box-shadow: var(--shadow-glow);
}
</style>
