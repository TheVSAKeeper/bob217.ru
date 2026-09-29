import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

function measureNaturalWidth(el: HTMLElement): number {
  const probe = el.cloneNode(true) as HTMLElement
  probe.removeAttribute('id')
  probe.querySelectorAll('[id]').forEach((node) => node.removeAttribute('id'))
  probe.setAttribute('aria-hidden', 'true')
  probe.style.cssText = 'position:absolute;top:0;left:0;visibility:hidden;pointer-events:none'
  document.body.append(probe)
  const width = probe.scrollWidth
  probe.remove()
  return width
}

export function useNavOverflow(container: Readonly<Ref<HTMLElement | null>>): {
  compact: Readonly<Ref<boolean>>
} {
  const compact = ref(false)

  const update = (): void => {
    const el = container.value
    if (!el) return
    const left = el.getBoundingClientRect().left
    compact.value = left + measureNaturalWidth(el) > document.documentElement.clientWidth
  }

  onMounted(() => {
    update()
    window.addEventListener('resize', update)
    document.fonts.addEventListener('loadingdone', update)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', update)
    document.fonts.removeEventListener('loadingdone', update)
  })

  return { compact }
}
