<script lang="ts" setup>
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import NavHeader from '@/components/NavHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
import ScrollToTop from '@/components/ScrollToTop.vue'

const route = useRoute()
const isRoutePending = computed(() => route.matched.length === 0)
</script>

<template>
  <div class="app-layout">
    <a class="skip-link" href="#main">к содержимому</a>
    <NavHeader />

    <main id="main" class="main-content">
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>

    <AppFooter :class="{ 'route-pending': isRoutePending }" />
    <ScrollToTop />
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  padding-top: var(--nav-height);
}

.route-pending {
  visibility: hidden;
}

.skip-link {
  position: absolute;
  top: var(--spacing-sm);
  left: var(--spacing-sm);
  z-index: var(--z-modal);
  padding: var(--spacing-sm) var(--spacing-md);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  color: var(--color-bg-primary);
  background: var(--color-accent);
  border-radius: var(--radius-sm);
  transform: translateY(-200%);
}

.skip-link:focus-visible {
  transform: none;
}

.page-enter-active,
.page-leave-active {
  transition:
    opacity var(--transition-base),
    transform var(--transition-base);
}

.page-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
