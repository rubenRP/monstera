<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{
  error: NuxtError
}>()

const { t } = useI18n()

const isNotFound = computed(() => props.error.statusCode === 404)

useHead({
  title: () => (isNotFound.value ? t('errors.page.notFoundTitle') : t('errors.page.genericTitle'))
})

function goHome() {
  void clearError({ redirect: '/' })
}
</script>

<template>
  <UApp>
    <div class="relative min-h-screen flex items-center justify-center px-4">
      <AppBackground />
      <div class="max-w-sm w-full text-center space-y-4">
        <div class="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-inset ring-primary/15">
          <UIcon
            :name="isNotFound ? 'i-lucide-sprout' : 'i-lucide-cloud-off'"
            class="size-8 text-primary"
          />
        </div>
        <p class="text-sm font-medium text-muted">
          {{ error.statusCode }}
        </p>
        <h1 class="text-2xl font-bold text-highlighted">
          {{ isNotFound ? t('errors.page.notFoundTitle') : t('errors.page.genericTitle') }}
        </h1>
        <p class="text-muted">
          {{ isNotFound ? t('errors.page.notFoundDescription') : t('errors.page.genericDescription') }}
        </p>
        <UButton
          icon="i-lucide-home"
          size="lg"
          @click="goHome"
        >
          {{ t('errors.page.goHome') }}
        </UButton>
      </div>
    </div>
  </UApp>
</template>
