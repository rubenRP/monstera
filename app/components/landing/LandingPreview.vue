<script setup lang="ts">
const { t } = useI18n()

const tasks = computed(() => [
  {
    plant: t('landing.preview.plantOne'),
    task: t('landing.preview.taskOne'),
    site: t('landing.preview.siteOne'),
    overdue: true,
    icon: 'i-lucide-droplets'
  },
  {
    plant: t('landing.preview.plantTwo'),
    task: t('landing.preview.taskTwo'),
    site: t('landing.preview.siteTwo'),
    overdue: false,
    icon: 'i-lucide-flask-conical'
  }
])
</script>

<template>
  <div
    aria-hidden="true"
    class="mx-auto w-full max-w-md"
  >
    <div class="rounded-2xl border border-default bg-elevated/80 shadow-lg shadow-primary/5 overflow-hidden">
      <div class="flex items-center gap-2 border-b border-default/70 px-4 py-3">
        <AppLogo size="sm" />
        <span class="font-semibold text-primary">{{ t('app.title') }}</span>
        <span class="ml-auto text-xs font-medium text-muted">{{ t('nav.today') }}</span>
      </div>

      <div class="space-y-2 p-3">
        <div
          v-for="task in tasks"
          :key="task.plant"
          class="rounded-2xl border bg-default p-3 shadow-sm"
          :class="task.overdue ? 'border-default border-l-4 border-l-warning' : 'border-default'"
        >
          <div class="flex items-start gap-3">
            <span
              class="flex size-9 items-center justify-center rounded-xl shrink-0 ring-1 ring-inset"
              :class="task.overdue ? 'bg-warning/10 text-warning ring-warning/15' : 'bg-primary/10 text-primary ring-primary/15'"
            >
              <UIcon
                :name="task.icon"
                class="size-5"
              />
            </span>
            <div class="min-w-0 flex-1">
              <p class="font-medium truncate">
                {{ task.plant }}
              </p>
              <p class="text-sm text-muted truncate">
                {{ task.task }} · {{ task.site }}
              </p>
              <p
                v-if="task.overdue"
                class="mt-0.5 text-sm text-warning"
              >
                {{ t('landing.preview.overdue') }}
              </p>
            </div>
          </div>
          <div class="mt-3 flex items-center gap-2 pl-12">
            <span class="inline-flex items-center rounded-xl bg-primary px-3 py-1.5 text-sm font-medium text-inverted">
              {{ t('common.done') }}
            </span>
            <span class="inline-flex items-center rounded-xl px-3 py-1.5 text-sm font-medium text-muted">
              {{ t('common.skip') }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
