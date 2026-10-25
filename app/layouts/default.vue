<script setup lang="ts">
import { isTopLevelPath, parentPath } from '#shared/utils/navigation/parentPath'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { online } = useOnlineStatus()
const { count: todayTaskCount, ensureLoaded: ensureTodayTaskCount } = useTodayTaskCount()

const nav = computed(() => [
  { to: '/', label: t('nav.today'), icon: 'i-lucide-home' },
  { to: '/plants', label: t('nav.plants'), icon: 'i-lucide-leaf' },
  { to: '/calendar', label: t('nav.calendar'), icon: 'i-lucide-calendar' },
  { to: '/sites', label: t('nav.sites'), icon: 'i-lucide-map-pin' },
  { to: '/settings', label: t('nav.settings'), icon: 'i-lucide-settings' }
])

/** Mobile bar: settings lives in the header so the "+" button can sit in the middle. */
const mobileNavLeft = computed(() => nav.value.slice(0, 2))
const mobileNavRight = computed(() => nav.value.slice(2, 4))

const todayBadge = computed(() => {
  const n = todayTaskCount.value ?? 0
  if (n <= 0) return null
  return n > 9 ? '9+' : String(n)
})

onMounted(() => {
  void ensureTodayTaskCount()
})

function isActive(path: string) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

const showBack = computed(() => !isTopLevelPath(route.path))

/** In-app history when available; otherwise the logical parent (standalone PWA has no browser back). */
function goBack() {
  if (import.meta.client && window.history.state?.back) {
    router.back()
    return
  }
  void navigateTo(parentPath(route.path), { replace: true })
}
</script>

<template>
  <div class="relative min-h-screen flex flex-col md:flex-row pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
    <AppBackground />
    <p
      v-if="!online"
      role="status"
      class="sticky top-0 z-50 border-b border-warning/30 bg-warning/15 px-4 py-2 text-center text-sm text-highlighted"
    >
      {{ t('pwa.offline') }}
    </p>
    <aside class="hidden md:flex md:flex-col md:w-56 md:border-r md:border-default/60 md:min-h-screen md:p-4 md:sticky md:top-0 md:backdrop-blur-sm">
      <NuxtLink
        to="/"
        class="flex items-center gap-2 font-bold text-lg text-primary mb-8 px-2"
      >
        <AppLogo />
        Monstera
      </NuxtLink>
      <AppQuickAddMenu side="right">
        <UButton
          icon="i-lucide-plus"
          block
          class="mb-4 rounded-full"
          :label="t('quickAdd.button')"
        />
      </AppQuickAddMenu>
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
          <span
            v-if="item.to === '/' && todayBadge"
            class="ml-auto rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold leading-none text-inverted tabular-nums"
            :aria-label="t('nav.todayBadgeAria', { count: todayTaskCount ?? 0 })"
          >{{ todayBadge }}</span>
        </NuxtLink>
      </nav>
    </aside>

    <div class="flex-1 flex flex-col min-w-0">
      <header class="sticky top-0 z-40 border-b border-default/60 bg-default/75 backdrop-blur-lg px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))] md:hidden">
        <div class="max-w-lg mx-auto flex items-center justify-between">
          <UButton
            v-if="showBack"
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            class="-ml-2"
            :label="t('common.back')"
            @click="goBack"
          />
          <NuxtLink
            v-else
            to="/"
            class="flex items-center gap-2 font-bold text-lg text-primary"
          >
            <AppLogo />
            Monstera
          </NuxtLink>
          <div class="flex items-center gap-1">
            <UColorModeButton />
            <UButton
              to="/settings"
              icon="i-lucide-settings"
              color="neutral"
              variant="ghost"
              :aria-label="t('nav.settings')"
              :class="isActive('/settings') ? 'text-primary' : ''"
            />
          </div>
        </div>
      </header>

      <header class="hidden md:flex border-b border-default/60 bg-default/60 backdrop-blur-sm px-6 py-3 items-center justify-between">
        <UButton
          v-if="showBack"
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="ghost"
          :label="t('common.back')"
          @click="goBack"
        />
        <span v-else />
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
      <div class="flex items-end pt-2 pb-1 px-1">
        <NuxtLink
          v-for="item in mobileNavLeft"
          :key="item.to"
          :to="item.to"
          class="relative flex flex-1 flex-col items-center justify-center gap-1 min-h-11 px-0.5 py-2 text-xs leading-none font-medium rounded-full transition-all"
          :class="isActive(item.to) ? 'text-primary bg-primary/10 ring-1 ring-inset ring-primary/15' : 'text-muted hover:text-default'"
        >
          <span class="relative">
            <UIcon
              :name="item.icon"
              class="w-5 h-5"
            />
            <span
              v-if="item.to === '/' && todayBadge"
              class="absolute -right-2.5 -top-1.5 min-w-4 rounded-full bg-primary px-1 py-0.5 text-center text-[10px] font-semibold leading-none text-inverted tabular-nums ring-2 ring-default"
              :aria-label="t('nav.todayBadgeAria', { count: todayTaskCount ?? 0 })"
            >{{ todayBadge }}</span>
          </span>
          {{ item.label }}
        </NuxtLink>

        <div class="flex flex-1 justify-center">
          <AppQuickAddMenu>
            <UButton
              icon="i-lucide-plus"
              size="xl"
              class="-mt-6 size-14 justify-center rounded-full shadow-lg shadow-primary/30 ring-4 ring-default"
              :ui="{ leadingIcon: 'size-7' }"
              :aria-label="t('quickAdd.button')"
            />
          </AppQuickAddMenu>
        </div>

        <NuxtLink
          v-for="item in mobileNavRight"
          :key="item.to"
          :to="item.to"
          class="flex flex-1 flex-col items-center justify-center gap-1 min-h-11 px-0.5 py-2 text-xs leading-none font-medium rounded-full transition-all"
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
