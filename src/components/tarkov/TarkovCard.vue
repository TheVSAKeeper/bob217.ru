<script setup lang="ts">
defineProps<{
  title: string
  subtext?: string
  active?: boolean
  variant?: 'default' | 'success' | 'warning' | 'danger'
  loading?: boolean
}>()
</script>

<template>
  <div
    class="tarkov-card"
    :class="[{ 'is-active': active, 'is-loading': loading }, variant ? `variant-${variant}` : '']"
  >
    <div class="card-corner corner-tl"></div>
    <div class="card-corner corner-tr"></div>
    <div class="card-corner corner-bl"></div>
    <div class="card-corner corner-br"></div>

    <div class="card-header">
      <div class="header-content">
        <slot name="icon"></slot>
        <span class="card-title">{{ title }}</span>
      </div>
      <div v-if="loading" class="loading-indicator">SCANNING...</div>
    </div>

    <div class="card-body">
      <slot></slot>
    </div>

    <div class="card-footer">
      <slot name="footer"></slot>
      <span v-if="subtext" class="subtext">{{ subtext }}</span>
    </div>
  </div>
</template>

<style scoped>
.tarkov-card {
  background: rgba(10, 10, 10, 0.85);
  border: 1px solid var(--tk-border, #333);
  padding: 1.5rem;
  position: relative;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);
}

.tarkov-card:hover {
  border-color: var(--tk-orange, #d9a334);
  background: rgba(20, 20, 20, 0.9);
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.tarkov-card.is-active {
  border-color: var(--tk-olive, #5a633a);
  box-shadow: 0 0 15px rgba(90, 99, 58, 0.2);
}

.card-corner {
  position: absolute;
  width: 6px;
  height: 6px;
  border-style: solid;
  border-color: var(--tk-border, #333);
  transition: border-color 0.2s;
}

.tarkov-card:hover .card-corner {
  border-color: var(--tk-orange, #d9a334);
}

.tarkov-card.is-active .card-corner {
  border-color: var(--tk-olive, #5a633a);
}

.corner-tl {
  top: 0;
  left: 0;
  border-width: 2px 0 0 2px;
}
.corner-tr {
  top: 0;
  right: 0;
  border-width: 2px 2px 0 0;
}
.corner-bl {
  bottom: 0;
  left: 0;
  border-width: 0 0 2px 2px;
}
.corner-br {
  bottom: 0;
  right: 0;
  border-width: 0 2px 2px 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding-bottom: 0.75rem;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--card-accent, var(--tk-orange, #d9a334));
}

.variant-success {
  --tk-border: #2d4d2b;
  --card-accent: #5a633a;
  box-shadow: inset 0 0 15px rgba(45, 77, 43, 0.1);
}

.variant-danger {
  --tk-border: #5a1414;
  --card-accent: #8b0000;
  box-shadow: inset 0 0 15px rgba(90, 20, 20, 0.1);
}

.variant-warning {
  --tk-border: #4a3f28;
  --card-accent: var(--tk-orange);
}

.variant-success .card-corner,
.variant-success {
  border-color: #5a633a;
}

.variant-danger .card-corner,
.variant-danger {
  border-color: #8b0000;
}

.variant-warning .card-corner,
.variant-warning {
  border-color: #4a3f28;
}

.tarkov-card.is-active.variant-success {
  box-shadow: 0 0 20px rgba(90, 99, 58, 0.3);
  border-color: #7a8a4a;
}

.tarkov-card.is-active.variant-danger {
  box-shadow: 0 0 20px rgba(139, 0, 0, 0.3);
  border-color: #a30000;
}

.card-title {
  font-family: 'Oswald', sans-serif;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  font-size: 0.9rem;
}

.loading-indicator {
  font-size: 0.75rem;
  color: var(--tk-highlight, #fff);
  animation: blink 1s infinite;
}

.card-body {
  padding: 0.5rem 0;
}

.card-footer {
  margin-top: 1.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  color: #666;
}

.subtext {
  font-family: 'Rajdhani', sans-serif;
  font-weight: 600;
  color: var(--tk-olive, #5a633a);
  text-transform: uppercase;
  letter-spacing: 1px;
}

@keyframes blink {
  50% {
    opacity: 0.5;
  }
}
</style>
