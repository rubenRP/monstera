<script setup lang="ts">
import type { AppLocale } from '#shared/types/database'

const { t, locales, locale, setLocale } = useI18n()
const { githubUrl, selfHostingDocsUrl } = usePublicGithubUrl()

const localeItems = computed(() =>
  locales.value.map(l => ({ label: l.name, value: l.code }))
)

const features = computed(() => [
  { key: 'watering', icon: 'i-lucide-droplets' },
  { key: 'weather', icon: 'i-lucide-cloud-sun' },
  { key: 'diagnose', icon: 'i-lucide-scan-search' },
  { key: 'recommend', icon: 'i-lucide-lightbulb' },
  { key: 'species', icon: 'i-lucide-leaf' },
  { key: 'pwa', icon: 'i-lucide-smartphone' }
] as const)

async function onLocaleChange(value: string) {
  await setLocale(value as AppLocale)
}

useHead({
  meta: [
    { name: 'description', content: () => t('landing.hero.subtitle') }
  ]
})
</script>

<template>
  <div class="relative min-h-screen overflow-hidden bg-default">
    <AppBackground variant="hero" />

    <div class="relative">
      <header class="sticky top-0 z-20 border-b border-transparent backdrop-blur-md">
        <div class="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div class="flex items-center gap-2">
            <AppLogo size="lg" />
            <span class="text-xl font-bold text-primary">
              {{ t('app.title') }}
            </span>
          </div>
          <div class="flex items-center gap-2">
            <USelect
              :model-value="locale"
              :items="localeItems"
              size="sm"
              class="w-32"
              @update:model-value="onLocaleChange"
            />
            <UColorModeButton />
          </div>
        </div>
      </header>

      <main class="max-w-5xl mx-auto px-4">
        <!-- Hero -->
        <section class="pt-16 pb-20 sm:pt-24 sm:pb-28 text-center flex flex-col items-center">
          <UBadge
            color="primary"
            variant="soft"
            size="lg"
            class="rounded-full mb-6"
          >
            <UIcon
              name="i-lucide-sparkles"
              class="size-4 mr-1"
            />
            {{ t('landing.hero.badge') }}
          </UBadge>

          <h1 class="text-4xl sm:text-6xl font-bold tracking-tight text-highlighted max-w-3xl text-balance">
            {{ t('landing.hero.title') }}
          </h1>

          <p class="mt-6 text-base sm:text-xl text-muted max-w-2xl text-balance">
            {{ t('app.description') }}
          </p>
          <p class="mt-3 text-sm sm:text-base text-dimmed max-w-xl text-balance">
            {{ t('landing.hero.subtitle') }}
          </p>

          <div class="mt-10 flex flex-col sm:flex-row items-center gap-3">
            <UButton
              to="/login"
              size="xl"
              trailing-icon="i-lucide-arrow-right"
              class="rounded-full px-7 font-semibold shadow-lg shadow-primary/20 transition-transform hover:-translate-y-0.5"
            >
              {{ t('landing.hero.cta') }}
            </UButton>
            <UButton
              :href="githubUrl"
              target="_blank"
              rel="noopener noreferrer"
              size="xl"
              color="neutral"
              variant="ghost"
              icon="i-lucide-github"
              class="rounded-full px-6"
            >
              {{ t('landing.hero.secondaryCta') }}
            </UButton>
          </div>
        </section>

        <!-- Features -->
        <section class="pb-20 sm:pb-28 space-y-10">
          <div class="text-center space-y-3">
            <h2 class="text-3xl sm:text-4xl font-bold tracking-tight text-highlighted">
              {{ t('landing.features.title') }}
            </h2>
          </div>

          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div
              v-for="feature in features"
              :key="feature.key"
              class="group relative overflow-hidden rounded-2xl border border-default bg-elevated/50 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5"
            >
              <div
                aria-hidden="true"
                class="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
              <div class="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/15 transition-colors group-hover:bg-primary group-hover:text-inverted">
                <UIcon
                  :name="feature.icon"
                  class="size-6"
                />
              </div>
              <h3 class="mt-4 font-semibold text-highlighted">
                {{ t(`landing.features.${feature.key}.title`) }}
              </h3>
              <p class="mt-1.5 text-sm text-muted leading-relaxed">
                {{ t(`landing.features.${feature.key}.description`) }}
              </p>
            </div>
          </div>
        </section>

        <!-- Open source -->
        <section class="pb-20 sm:pb-28">
          <div class="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 sm:p-12">
            <div
              aria-hidden="true"
              class="pointer-events-none absolute -right-16 -bottom-16 opacity-10"
            >
              <UIcon
                name="i-lucide-leaf"
                class="size-64 text-primary"
              />
            </div>
            <div class="relative max-w-2xl space-y-5">
              <div class="flex items-center gap-3">
                <div class="flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-inset ring-primary/20">
                  <UIcon
                    name="i-lucide-code-2"
                    class="size-6"
                  />
                </div>
                <h2 class="text-2xl sm:text-3xl font-bold tracking-tight text-highlighted">
                  {{ t('landing.openSource.title') }}
                </h2>
              </div>
              <p class="text-muted leading-relaxed">
                {{ t('landing.openSource.description') }}
              </p>
              <div class="flex flex-col sm:flex-row gap-3 pt-1">
                <UButton
                  :href="githubUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  size="lg"
                  icon="i-lucide-github"
                  class="rounded-full"
                >
                  {{ t('landing.openSource.github') }}
                </UButton>
                <UButton
                  :href="selfHostingDocsUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  size="lg"
                  color="neutral"
                  variant="subtle"
                  icon="i-lucide-server"
                  class="rounded-full"
                >
                  {{ t('landing.openSource.selfHosted') }}
                </UButton>
              </div>
            </div>
          </div>
        </section>

        <!-- Final CTA -->
        <footer class="pb-16 text-center">
          <div class="mx-auto max-w-xl space-y-6">
            <AppLogo
              size="lg"
              class="mx-auto"
            />
            <UButton
              to="/login"
              size="lg"
              trailing-icon="i-lucide-arrow-right"
              class="rounded-full px-7 font-semibold"
            >
              {{ t('landing.footer.cta') }}
            </UButton>
          </div>
        </footer>
      </main>
    </div>
  </div>
</template>
