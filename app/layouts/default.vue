<script setup lang="ts">
const route = useRoute()
const { t } = useI18n()

const nav = computed(() => [
  { to: '/', label: t('nav.today'), icon: 'i-lucide-home' },
  { to: '/plants', label: t('nav.plants'), icon: 'i-lucide-leaf' },
  { to: '/sites', label: t('nav.sites'), icon: 'i-lucide-map-pin' },
  { to: '/settings', label: t('nav.settings'), icon: 'i-lucide-settings' }
])

function isActive(path: string) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>

<template>
  <div class="relative min-h-screen flex flex-col md:flex-row pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
    <AppBackground />
    <aside class="hidden md:flex md:flex-col md:w-56 md:border-r md:border-default/60 md:min-h-screen md:p-4 md:sticky md:top-0 md:backdrop-blur-sm">
      <NuxtLink
        to="/"
        class="flex items-center gap-2 font-bold text-lg text-primary mb-8 px-2"
      >
        <AppLogo />
        Monstera
      </NuxtLink>
      <nav
        class="flex flex-col gap-1"
        :aria-label="t('nav.mainNav')"
      >
        <NuxtLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-medium transition-all"
          :class="isActive(item.to) ? 'bg-primary/10 text-primary font-semibold ring-1 ring-inset ring-primary/15 shadow-sm shadow-primary/5' : 'text-muted hover:bg-elevated hover:text-default'"
        >
          <UIcon
            :name="item.icon"
            class="w-5 h-5"
          />
          {{ item.label }}
        </NuxtLink>
      </nav>
      <div class="mt-auto pt-4 px-2">
        <NuxtLink
          to="/calendar"
          class="text-sm text-muted hover:text-primary flex items-center gap-2"
        >
          <UIcon
            name="i-lucide-calendar"
            class="w-4 h-4"
          />
          {{ t('nav.calendar') }}
        </NuxtLink>
      </div>
    </aside>

    <div class="flex-1 flex flex-col min-w-0">
      <header class="sticky top-0 z-40 border-b border-default/60 bg-default/75 backdrop-blur-lg px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))] md:hidden">
        <div class="max-w-lg mx-auto flex items-center justify-between">
          <NuxtLink
            to="/"
            class="flex items-center gap-2 font-bold text-lg text-primary"
          >
            <AppLogo />
            Monstera
          </NuxtLink>
          <UColorModeButton />
        </div>
      </header>

      <header class="hidden md:flex border-b border-default/60 bg-default/60 backdrop-blur-sm px-6 py-3 items-center justify-end">
        <UColorModeButton />
      </header>

      <main class="flex-1 px-4 py-4 md:px-6 max-w-lg md:max-w-2xl w-full mx-auto">
        <slot />
      </main>
    </div>

    <nav
      class="fixed bottom-0 inset-x-0 z-40 border-t border-default/60 bg-default/75 backdrop-blur-lg md:hidden pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]"
      :aria-label="t('nav.mainNav')"
    >
      <div class="flex justify-around pt-2 pb-1 px-2">
        <NuxtLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          class="flex flex-col items-center gap-0.5 px-3 py-1.5 text-xs font-medium rounded-full transition-all min-w-[4rem]"
          :class="isActive(item.to) ? 'text-primary bg-primary/10 ring-1 ring-inset ring-primary/15' : 'text-muted hover:text-default'"
        >
          <UIcon
            :name="item.icon"
            class="w-5 h-5"
          />
          {{ item.label }}
        </NuxtLink>
      </div>
    </nav>
  </div>
</template>
