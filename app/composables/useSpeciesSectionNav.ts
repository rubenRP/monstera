import type { Ref } from 'vue'

export function useSpeciesSectionNav(sectionIds: Ref<string[]>) {
  const activeSection = ref(sectionIds.value[0] ?? '')
  let observer: IntersectionObserver | null = null

  function scrollToSection(id: string) {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      activeSection.value = id
    }
  }

  function setupObserver(root: HTMLElement | null) {
    observer?.disconnect()
    if (!root || !sectionIds.value.length) return

    observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]?.target.id) {
          activeSection.value = visible[0].target.id
        }
      },
      { root: null, rootMargin: '-20% 0px -55% 0px', threshold: [0, 0.25, 0.5] }
    )

    for (const id of sectionIds.value) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }
  }

  onUnmounted(() => observer?.disconnect())

  return { activeSection, scrollToSection, setupObserver }
}
