<script lang="ts" setup>
import { Heart } from 'lucide-vue-next'
import CmdLine from '@/components/CmdLine.vue'
import { useClipboard } from '@/composables/useClipboard'
import { useCmdReplay } from '@/composables/useCmdReplay'

const CRYPTO_ADDRESS = '0x09daec7735270c3dc16c3fcfae159f38352b606d'
const CRYPTO_SHORT = '0x09daec…52b606d'

const { copied, failed, copy } = useClipboard()
const { phaseClass, start, print } = useCmdReplay(() => 1180)

const copyAddress = (): void => {
  void copy(CRYPTO_ADDRESS)
}
</script>

<template>
  <div class="donate" :class="phaseClass">
    <div class="donate-container">
      <header class="donate-header">
        <CmdLine @run="start" @done="print"
          >git remote -v <span class="cmd-note"># куда пушить поддержку &lt;3</span></CmdLine
        >
        <Heart class="heart cmd-out" :size="44" :stroke-width="1.5" aria-hidden="true" />
        <h1 class="cmd-out">Поддержка проектов</h1>
        <p class="lead cmd-out" style="--print-delay: 80ms">
          "дот нет помойка", "лучик света", "игровая дрисня", "фильмы с максимчиком"
        </p>
      </header>

      <div class="remotes">
        <article class="remote cmd-out" style="--print-delay: 200ms">
          <p class="head">
            <span class="name">telegram</span>
            <a href="https://t.me/bobito217" target="_blank" rel="noopener noreferrer">
              t.me/bobito217
            </a>
            <span class="kind">(fetch)</span>
          </p>
        </article>

        <article class="remote cmd-out" style="--print-delay: 340ms">
          <p class="head">
            <span class="name">donate.stream</span>
            <a href="https://donate.stream/bob217" target="_blank" rel="noopener noreferrer">
              donate.stream/bob217
            </a>
            <span class="kind">(push)</span>
          </p>
          <p class="note">пожертвования можно кидать сюды</p>
          <img class="qr" src="/img/qr.png" width="693" height="696" alt="QR код donate.stream" />
        </article>

        <article class="remote cmd-out" style="--print-delay: 760ms">
          <p class="head">
            <span class="name">usdt-bep20</span>
            <span class="target">{{ CRYPTO_SHORT }}</span>
            <span class="kind">(push)</span>
          </p>
          <p class="note">криптой сюда</p>
          <code class="address">{{ CRYPTO_ADDRESS }}</code>
          <p class="copy">
            <button class="cmd-btn" @click="copyAddress">
              <span class="p">$</span> скопировать адрес
            </button>
            <span class="out" :class="{ on: copied, bad: failed }" role="status">
              <template v-if="failed">fatal: буфер недоступен, выделяй руками</template>
              <template v-else># адрес в буфере</template>
            </span>
          </p>
          <img class="qr" src="/img/usdc.png" width="720" height="720" alt="QR код USDT BEP20" />
        </article>
      </div>
    </div>
  </div>
</template>

<style scoped>
.donate {
  min-height: 100vh;
  padding: var(--spacing-xl);
}

.donate-container {
  width: 100%;
  max-width: 620px;
  margin: 0 auto;
}

.donate-header {
  margin-bottom: var(--spacing-xl);
}

.donate-header h1 {
  margin: 0;
}

.cmd-note {
  padding-left: var(--spacing-sm);
}

.heart {
  display: block;
  margin: var(--spacing-md) auto 0;
  color: var(--color-danger);
  animation: heartbeat 1.5s ease-in-out infinite;
}

@keyframes heartbeat {
  0%,
  28%,
  70%,
  100% {
    transform: scale(1);
  }
  14%,
  42% {
    transform: scale(1.15);
  }
}

.donate.cmd-printing .heart {
  animation: heart-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes heart-pop {
  0% {
    opacity: 0;
    transform: scale(0);
  }
  60% {
    opacity: 1;
    transform: scale(1.3);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.donate.cmd-clearing .heart {
  animation: heart-stop 0.28s ease both;
}

@keyframes heart-stop {
  to {
    opacity: 0;
    transform: scale(0.5);
  }
}

.lead {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  text-align: center;
}

.donate.cmd-clearing .remotes {
  animation: flatline 0.28s cubic-bezier(0.5, 0, 0.75, 0) both;
}

.donate.cmd-clearing .remotes .cmd-out {
  animation: none;
}

@keyframes flatline {
  from {
    transform: scaleY(1);
    opacity: 1;
  }
  to {
    transform: scaleY(0.02);
    opacity: 0;
  }
}

.remote {
  padding: var(--spacing-lg) 0;
}

.remote + .remote {
  border-top: 1px solid var(--color-bg-tertiary);
}

.head {
  display: grid;
  grid-template-columns: 14ch minmax(0, 26ch) auto;
  gap: var(--spacing-sm);
  align-items: baseline;
  margin: 0;
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
}

.name {
  color: var(--color-link);
}

.head a,
.target {
  color: var(--color-text-primary);
  overflow-wrap: anywhere;
}

.head a {
  text-decoration: underline dotted;
  text-underline-offset: 4px;
  text-decoration-color: rgba(255, 255, 255, 0.25);
}

.head a:hover {
  color: var(--color-link-hover);
  text-decoration-color: currentcolor;
}

.kind {
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
}

.note {
  margin: var(--spacing-md) 0 0;
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.address {
  display: block;
  margin-top: var(--spacing-md);
  padding: var(--spacing-md);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
  color: var(--color-accent);
  word-break: break-all;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
}

.copy {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-md);
  min-height: 2.2em;
  margin: var(--spacing-sm) 0 0;
}

.cmd-btn {
  padding: var(--spacing-xs) var(--spacing-md);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  background: transparent;
  border: 1px solid var(--color-bg-tertiary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.cmd-btn .p {
  color: var(--color-accent);
}

.cmd-btn:hover {
  color: var(--color-text-primary);
  border-color: var(--color-accent);
}

.out {
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
  color: var(--color-success);
  visibility: hidden;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.out.on,
.out.bad {
  visibility: visible;
  opacity: 1;
}

.out.bad {
  color: var(--color-danger);
}

.qr {
  display: block;
  width: 217px;
  height: auto;
  margin: var(--spacing-lg) auto 0;
  border: 3px solid var(--color-bg-tertiary);
  border-radius: var(--radius-lg);
  animation: qr-render 0.52s steps(14, end) backwards;
  animation-delay: calc(var(--print-delay, 0ms) + 420ms);
}

@keyframes qr-render {
  from {
    clip-path: inset(0 0 100% 0);
  }
  to {
    clip-path: inset(0 0 0 0);
  }
}

@media (max-width: 720px) {
  .donate {
    padding: var(--spacing-lg);
  }

  .head {
    grid-template-columns: 1fr auto;
  }

  .head a,
  .target {
    grid-column: 1 / -1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .heart,
  .donate.cmd-printing .heart,
  .donate.cmd-clearing .heart,
  .donate.cmd-clearing .remotes,
  .qr {
    animation: none;
  }
}
</style>
