<script lang="ts" setup>
defineProps<{
  repos: number
  pulls: number
}>()
</script>

<template>
  <div class="boot">
    <div class="boot-ttl">сбор данных с github<i class="boot-cur"></i></div>
    <div class="boot-row" :class="{ ok: repos > 0 }">
      <span>репозитории</span><b>{{ repos || '···' }}</b>
    </div>
    <div class="boot-row" :class="{ ok: pulls > 0 }">
      <span>принятые PR</span><b>{{ pulls || '···' }}</b>
    </div>
  </div>
</template>

<style scoped>
.boot {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 6;
  transform: translate(-50%, 72px);
  padding: 9px 13px;
  border: 1px solid var(--color-bg-tertiary);
  border-radius: var(--radius-md);
  background: rgba(28, 28, 28, 0.86);
  -webkit-backdrop-filter: blur(3px);
  backdrop-filter: blur(3px);
  box-shadow: var(--shadow-md);
  font-family: var(--font-family-mono);
  font-size: 11px;
  color: var(--color-text-muted);
  pointer-events: none;
}

.boot-ttl {
  color: var(--color-accent);
  letter-spacing: 0.04em;
  text-align: center;
}

.boot-cur {
  display: inline-block;
  width: 6px;
  height: 11px;
  margin-left: 5px;
  vertical-align: -1px;
  background: var(--color-accent);
  animation: bootBlink 1s steps(1) infinite;
}

.boot-row {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  min-width: 186px;
  margin-top: 6px;
  opacity: 0.45;
  transition: opacity var(--transition-base);
}

.boot-row.ok {
  opacity: 1;
}

.boot-row b {
  color: var(--color-text-secondary);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

@keyframes bootBlink {
  50% {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .boot-cur {
    animation: none;
  }

  .boot-row {
    transition: none;
  }
}
</style>
