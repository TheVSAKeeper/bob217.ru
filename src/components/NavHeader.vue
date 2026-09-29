<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount, useTemplateRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  Home,
  FileText,
  Info,
  Heart,
  PiggyBank,
  GitPullRequest,
  GitCommitHorizontal,
  CircleDot,
  Network,
  Package,
  FolderGit2,
  type LucideIcon,
} from 'lucide-vue-next'
import { HEADER_NAV_PAGES, type HeaderNavPageName } from '@/site/pages'
import { useNavOverflow } from '@/composables/useNavOverflow'

const route = useRoute()
const isMenuOpen = ref(false)
const isScrolled = ref(false)
const isReady = ref(false)
const toggleButton = ref<HTMLButtonElement | null>(null)
const menu = useTemplateRef<HTMLElement>('menu')
const { compact } = useNavOverflow(useTemplateRef<HTMLElement>('navContainer'))

const NAV_ICONS: Record<HeaderNavPageName, LucideIcon> = {
  home: Home,
  donate: Heart,
  resume: FileText,
  works: FolderGit2,
  about: Info,
  log: GitCommitHorizontal,
  pulls: GitPullRequest,
  issues: CircleDot,
  releases: Package,
  repos: Network,
}

const navLinks = HEADER_NAV_PAGES.map((page) => ({ ...page, icon: NAV_ICONS[page.name] }))

const toggleMenu = (): void => {
  isMenuOpen.value = !isMenuOpen.value
  document.body.style.overflow = isMenuOpen.value ? 'hidden' : ''
}

const closeMenu = (): void => {
  isMenuOpen.value = false
  document.body.style.overflow = ''
}

const handleScroll = (): void => {
  isScrolled.value = window.scrollY > 20
}

const trapFocus = (event: KeyboardEvent): void => {
  const links = menu.value?.querySelectorAll<HTMLElement>('a[href]')
  if (!toggleButton.value || !links?.length) return
  const first = toggleButton.value
  const last = links.item(links.length - 1)
  const target = event.shiftKey ? last : first
  const edge = event.shiftKey ? first : last
  const outside = !menu.value?.contains(document.activeElement) && document.activeElement !== first
  if (document.activeElement !== edge && !outside) return
  event.preventDefault()
  target.focus()
}

const handleKeydown = (event: KeyboardEvent): void => {
  if (!isMenuOpen.value) return
  if (event.key === 'Tab') {
    trapFocus(event)
    return
  }
  if (event.key !== 'Escape') return
  closeMenu()
  toggleButton.value?.focus()
}

watch(compact, (isCompact) => {
  if (!isCompact) closeMenu()
})

const isActive = (path: string): boolean => {
  return route.path === path
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  window.addEventListener('keydown', handleKeydown)
  handleScroll()
  requestAnimationFrame(() => {
    isReady.value = true
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <header
    :class="['nav-header', { scrolled: isScrolled, compact, ready: isReady, open: isMenuOpen }]"
  >
    <nav ref="navContainer" class="nav-container" aria-label="Основная навигация">
      <RouterLink to="/" class="nav-logo" @click="closeMenu">
        <PiggyBank class="logo-icon" :size="28" />
        <span class="logo-text">bob217</span>
      </RouterLink>

      <button
        ref="toggleButton"
        class="nav-toggle"
        :class="{ active: isMenuOpen }"
        @click="toggleMenu"
        aria-label="Меню навигации"
        aria-controls="nav-menu"
        :aria-expanded="isMenuOpen"
      >
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
      </button>

      <div id="nav-menu" ref="menu" :class="['nav-menu', { open: isMenuOpen }]">
        <RouterLink
          v-for="link in navLinks"
          :key="link.path"
          :to="link.path"
          :class="['nav-link', { active: isActive(link.path) }]"
          @click="closeMenu"
        >
          <component :is="link.icon" class="nav-icon" :size="18" />
          <span class="nav-label">{{ link.label }}</span>
        </RouterLink>
      </div>

      <div v-if="isMenuOpen" class="nav-overlay" @click="closeMenu"></div>
    </nav>
  </header>
</template>

<style scoped>
.nav-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: var(--z-sticky);
  transition:
    box-shadow var(--transition-base),
    z-index 0.3s step-end;
}

.nav-header::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background: rgba(33, 33, 33, 0.95);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  opacity: 0;
  transition: opacity var(--transition-base);
}

.nav-header.open {
  z-index: var(--z-modal);
  transition: box-shadow var(--transition-base);
}

.nav-header.scrolled {
  box-shadow: var(--shadow-md);
}

.nav-header.scrolled::before {
  opacity: 1;
}

.nav-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: var(--max-width-content);
  margin: 0 auto;
  padding: var(--spacing-md) var(--spacing-lg);
  height: var(--nav-height);
}

.nav-logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  text-decoration: none;
  color: var(--color-text-primary);
  font-family: var(--font-family-heading);
  font-weight: 700;
  font-size: var(--font-size-xl);
  transition: transform var(--transition-fast);
}

.nav-logo:hover {
  transform: scale(1.05);
}

.logo-icon {
  color: var(--color-accent);
  animation: wiggle 2s ease-in-out infinite;
}

@keyframes wiggle {
  0%,
  100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-5deg);
  }
  75% {
    transform: rotate(5deg);
  }
}

.logo-text {
  background: var(--gradient-primary);
  background-size: 300% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.nav-menu {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.nav-link {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-sm);
  white-space: nowrap;
  text-decoration: none;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-weight: 500;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.nav-link:hover {
  color: var(--color-text-primary);
  background: var(--color-bg-tertiary);
}

.nav-link.active {
  color: var(--color-accent);
  background: rgba(255, 204, 0, 0.1);
}

.nav-icon {
  font-size: var(--font-size-base);
}

.nav-toggle {
  display: none;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 5px;
  width: 40px;
  height: 40px;
  padding: 0;
  background: none;
  border: none;
  cursor: pointer;
  z-index: calc(var(--z-sticky) + 10);
}

.hamburger-line {
  display: block;
  width: 24px;
  height: 2px;
  background: var(--color-text-primary);
  border-radius: var(--radius-full);
  transition: all var(--transition-base);
}

.nav-toggle.active .hamburger-line:nth-child(1) {
  transform: rotate(45deg) translate(5px, 5px);
}

.nav-toggle.active .hamburger-line:nth-child(2) {
  opacity: 0;
}

.nav-toggle.active .hamburger-line:nth-child(3) {
  transform: rotate(-45deg) translate(5px, -5px);
}

.nav-overlay {
  display: none;
}

.compact .nav-toggle {
  display: flex;
}

.compact .nav-menu {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  flex-direction: column;
  align-items: stretch;
  justify-content: safe center;
  gap: var(--spacing-md);
  overflow-y: auto;
  width: 280px;
  padding: var(--spacing-xl);
  background: var(--color-bg-secondary);
  transform: translateX(100%);
  visibility: hidden;
  z-index: var(--z-sticky);
}

.ready.compact .nav-menu {
  transition:
    transform var(--transition-base),
    visibility var(--transition-base);
}

.compact .nav-menu.open {
  transform: translateX(0);
  visibility: visible;
}

.compact .nav-link {
  padding: var(--spacing-md) var(--spacing-lg);
  font-size: var(--font-size-lg);
}

.compact .nav-overlay {
  display: block;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: calc(var(--z-sticky) - 1);
}
</style>
