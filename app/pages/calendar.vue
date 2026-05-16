<script setup lang="ts">
const { t } = useI18n()
const { dateLocale } = useDateLocale()
const { fetchTasksInRange, taskLabel, taskIcon } = useCareTasks()

const weekStart = ref(startOfWeek(new Date()))
const tasks = ref<Awaited<ReturnType<typeof fetchTasksInRange>>>([])
const loading = ref(true)

function startOfWeek(d: Date) {
  const x = new Date(d)
  const day = x.getDay()
  const diff = day === 0 ? -6 : 1 - day
  x.setDate(x.getDate() + diff)
  x.setHours(0, 0, 0, 0)
  return x
}

const weekDays = computed(() => {
  const days: Date[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart.value)
    d.setDate(d.getDate() + i)
    days.push(d)
  }
  return days
})

async function load() {
  loading.value = true
  const end = new Date(weekStart.value)
  end.setDate(end.getDate() + 7)
  end.setMilliseconds(-1)
  try {
    tasks.value = await fetchTasksInRange(weekStart.value, end)
  } finally {
    loading.value = false
  }
}

function tasksForDay(day: Date) {
  const key = day.toDateString()
  return tasks.value.filter(t => new Date(t.due_at).toDateString() === key)
}

function prevWeek() {
  const d = new Date(weekStart.value)
  d.setDate(d.getDate() - 7)
  weekStart.value = d
  load()
}

function nextWeek() {
  const d = new Date(weekStart.value)
  d.setDate(d.getDate() + 7)
  weekStart.value = d
  load()
}

onMounted(load)
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-2xl font-bold">
      {{ t('care.calendarTitle') }}
    </h1>

    <div class="flex items-center justify-between">
      <UButton
        icon="i-lucide-chevron-left"
        variant="ghost"
        @click="prevWeek"
      />
      <span class="text-sm font-medium">
        {{ weekDays[0]?.toLocaleDateString(dateLocale, { day: 'numeric', month: 'short' }) }}
        –
        {{ weekDays[6]?.toLocaleDateString(dateLocale, { day: 'numeric', month: 'short' }) }}
      </span>
      <UButton
        icon="i-lucide-chevron-right"
        variant="ghost"
        @click="nextWeek"
      />
    </div>

    <USkeleton
      v-if="loading"
      class="h-64"
    />

    <div
      v-else
      class="space-y-3"
    >
      <UCard
        v-for="day in weekDays"
        :key="day.toISOString()"
        :ui="{ body: 'p-3' }"
      >
        <p class="font-medium text-sm mb-2">
          {{ day.toLocaleDateString(dateLocale, { weekday: 'long', day: 'numeric' }) }}
        </p>
        <p
          v-if="!tasksForDay(day).length"
          class="text-xs text-muted"
        >
          {{ t('care.noTasksDay') }}
        </p>
        <ul
          v-else
          class="space-y-1"
        >
          <li
            v-for="task in tasksForDay(day)"
            :key="task.id"
            class="flex items-center gap-2 text-sm"
          >
            <UIcon
              :name="taskIcon(task.type)"
              class="w-4 h-4 text-primary shrink-0"
            />
            <NuxtLink
              :to="`/plants/${task.plant_id}`"
              class="truncate hover:text-primary"
            >
              {{ task.plant?.name }} — {{ taskLabel(task.type) }}
            </NuxtLink>
          </li>
        </ul>
      </UCard>
    </div>
  </div>
</template>
