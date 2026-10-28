<script setup lang="ts">
import type { DiagnosisResponse } from '#shared/utils/plants/schemas'
import { HEALTH_BADGE_CLASSES, HEALTH_ICONS } from '#shared/constants/plants'
import {
  mergeCareHistory,
  usePlantCheckIns,
  type CareHistoryEntry
} from '~/composables/usePlantCheckIns'
import type { GrowthPoint } from './PlantGrowthChart.vue'

const props = defineProps<{
  plantId: string
  /** Current height on the plant record, added to the growth chart if newer than check-ins */
  currentHeightCm?: number | null
  heightUpdatedAt?: string | null
}>()

const { t } = useI18n()
const { dateLocale } = useDateLocale()
const { healthLabel } = usePlantEnumLabels()
const { fetchCareHistory, taskLabel, taskIcon } = useCareTasks()
const { fetchCheckInHistory, observationSummary } = usePlantCheckIns()
const { fetchDiagnosisHistory } = usePlantDiagnoses()
const { urlFor: photoFor, ensure: ensurePhotoUrls } = usePlantPhotoUrls()
const { apiErrorMessage } = useApiError()

const loading = ref(false)
const loaded = ref(false)
const loadError = ref<string | null>(null)
const history = ref<CareHistoryEntry[]>([])
const openDiagnosis = ref<string | null>(null)

interface PhotoItem {
  key: string
  path: string
  at: string
  caption: string
}
const viewer = ref<PhotoItem | null>(null)
const viewerOpen = computed({
  get: () => viewer.value != null,
  set: (open: boolean) => {
    if (!open) viewer.value = null
  }
})

function formatDate(iso: string | null, withTime = true): string {
  if (!iso) return t('common.none')
  return new Date(iso).toLocaleDateString(dateLocale.value, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {})
  })
}

/** Photo diary: every check-in and diagnosis photo, newest first. */
const photos = computed<PhotoItem[]>(() =>
  history.value.flatMap((entry): PhotoItem[] => {
    if (entry.kind === 'check_in' && entry.checkIn.photo_path) {
      return [{ key: entry.checkIn.id, path: entry.checkIn.photo_path, at: entry.at, caption: t('care.taskCheckIn') }]
    }
    if (entry.kind === 'diagnosis' && entry.diagnosis.image_path) {
      return [{ key: entry.diagnosis.id, path: entry.diagnosis.image_path, at: entry.at, caption: t('plants.historyDiagnosis') }]
    }
    return []
  })
)

const growthPoints = computed<GrowthPoint[]>(() => {
  const points = history.value.flatMap((entry): GrowthPoint[] =>
    entry.kind === 'check_in' && entry.checkIn.height_cm != null
      ? [{ at: entry.at, value: Number(entry.checkIn.height_cm) }]
      : []
  )
  if (props.currentHeightCm != null && props.heightUpdatedAt) {
    const newest = points.reduce((max, p) => Math.max(max, new Date(p.at).getTime()), 0)
    if (new Date(props.heightUpdatedAt).getTime() > newest + 60_000) {
      points.push({ at: props.heightUpdatedAt, value: Number(props.currentHeightCm) })
    }
  }
  return points
})

function entryKey(entry: CareHistoryEntry) {
  if (entry.kind === 'check_in') return entry.checkIn.id
  if (entry.kind === 'diagnosis') return entry.diagnosis.id
  return entry.task.id
}

function entryIcon(entry: CareHistoryEntry): string {
  if (entry.kind === 'check_in') return 'i-lucide-clipboard-check'
  if (entry.kind === 'diagnosis') return 'i-lucide-stethoscope'
  return entry.task.status === 'done' ? taskIcon(entry.task.type) : 'i-lucide-skip-forward'
}

function entryTitle(entry: CareHistoryEntry): string {
  if (entry.kind === 'check_in') return t('care.taskCheckIn')
  if (entry.kind === 'diagnosis') return t('plants.historyDiagnosis')
  return taskLabel(entry.task.type)
}

function entrySubtitle(entry: CareHistoryEntry): string {
  if (entry.kind === 'check_in') {
    const parts = observationSummary(entry.checkIn)
    if (entry.checkIn.height_cm != null) parts.unshift(`${entry.checkIn.height_cm} cm`)
    if (parts.length) return parts.join(' · ')
    return entry.checkIn.notes?.trim() || ''
  }
  if (entry.kind === 'diagnosis') return entry.diagnosis.ai_summary ?? entry.diagnosis.symptoms
  return entry.task.status === 'done' ? t('plants.historyDone') : t('plants.historySkipped')
}

function entryPhoto(entry: CareHistoryEntry): string | null {
  if (entry.kind === 'check_in') return entry.checkIn.photo_path
  if (entry.kind === 'diagnosis') return entry.diagnosis.image_path
  return null
}

function diagnosisDetails(entry: CareHistoryEntry): DiagnosisResponse | null {
  if (entry.kind !== 'diagnosis') return null
  return (entry.diagnosis.ai_raw as DiagnosisResponse | null) ?? null
}

async function load() {
  loading.value = true
  loadError.value = null
  try {
    const [tasks, checkIns, diagnoses] = await Promise.all([
      fetchCareHistory(props.plantId),
      fetchCheckInHistory(props.plantId),
      fetchDiagnosisHistory(props.plantId)
    ])
    history.value = mergeCareHistory(tasks, checkIns, diagnoses)
    void ensurePhotoUrls(history.value.map(entryPhoto))
  } catch (e: unknown) {
    loadError.value = apiErrorMessage(e)
  } finally {
    loading.value = false
    loaded.value = true
  }
}

onMounted(() => {
  void load()
})

defineExpose({ load })
</script>

<template>
  <div class="space-y-5">
    <div
      v-if="loading"
      class="space-y-2"
    >
      <USkeleton class="h-24 rounded-2xl" />
      <USkeleton
        v-for="i in 4"
        :key="i"
        class="h-14 rounded-xl"
      />
    </div>

    <AppLoadError
      v-else-if="loadError"
      :description="loadError"
      @retry="load"
    />

    <AppEmptyState
      v-else-if="loaded && !history.length"
      :title="t('plants.historyEmptyTitle')"
      :description="t('plants.historyEmpty')"
    />

    <template v-else-if="loaded">
      <section
        v-if="photos.length"
        :aria-label="t('plants.photoDiary')"
      >
        <h3 class="mb-2 flex items-center gap-1.5 text-sm font-semibold text-highlighted">
          <UIcon
            name="i-lucide-images"
            class="size-4 text-primary"
          />
          {{ t('plants.photoDiary') }}
          <span class="text-xs font-normal text-muted">({{ photos.length }})</span>
        </h3>
        <ul class="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-2">
          <li
            v-for="photo in photos"
            :key="photo.key"
            class="shrink-0 snap-start"
          >
            <button
              type="button"
              class="group block w-28 text-left focus-visible:outline-2 focus-visible:outline-primary"
              :aria-label="`${photo.caption} · ${formatDate(photo.at, false)}`"
              @click="viewer = photo"
            >
              <img
                v-if="photoFor(photo.path)"
                :src="photoFor(photo.path)!"
                alt=""
                loading="lazy"
                class="aspect-[3/4] w-28 rounded-xl object-cover ring-1 ring-inset ring-default transition-transform group-hover:scale-[1.02]"
              >
              <USkeleton
                v-else
                class="aspect-[3/4] w-28 rounded-xl"
              />
              <span class="mt-1 block text-[11px] text-muted">{{ formatDate(photo.at, false) }}</span>
            </button>
          </li>
        </ul>
      </section>

      <section
        v-if="growthPoints.length >= 2"
        class="rounded-2xl border border-default bg-elevated/50 p-4"
      >
        <h3 class="mb-2 flex items-center gap-1.5 text-sm font-semibold text-highlighted">
          <UIcon
            name="i-lucide-trending-up"
            class="size-4 text-primary"
          />
          {{ t('plants.growthTitle') }}
        </h3>
        <PlantsDetailPlantGrowthChart
          :points="growthPoints"
          unit="cm"
        />
      </section>

      <section>
        <h3 class="mb-2 text-sm font-semibold text-highlighted">
          {{ t('plants.historyTitle') }}
        </h3>
        <ol class="relative space-y-2 border-l border-default pl-4">
          <li
            v-for="entry in history"
            :key="entryKey(entry)"
            class="relative"
          >
            <span
              class="absolute -left-[25px] top-3 flex size-4 items-center justify-center rounded-full ring-4 ring-(--ui-bg)"
              :class="entry.kind === 'task' && entry.task.status !== 'done' ? 'bg-elevated' : 'bg-primary'"
            />
            <div class="rounded-xl border border-default bg-elevated/40 p-3">
              <div class="flex items-start gap-3">
                <UIcon
                  :name="entryIcon(entry)"
                  class="mt-0.5 size-5 shrink-0"
                  :class="entry.kind === 'task' && entry.task.status !== 'done' ? 'text-muted' : 'text-primary'"
                />
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2">
                    <p class="text-sm font-medium">
                      {{ entryTitle(entry) }}
                    </p>
                    <span
                      v-if="entry.kind === 'check_in' || (entry.kind === 'diagnosis' && entry.diagnosis.suggested_health_status)"
                      class="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-medium"
                      :class="HEALTH_BADGE_CLASSES[entry.kind === 'check_in' ? entry.checkIn.health_status : entry.diagnosis.suggested_health_status!]"
                    >
                      <UIcon
                        :name="HEALTH_ICONS[entry.kind === 'check_in' ? entry.checkIn.health_status : entry.diagnosis.suggested_health_status!]"
                        class="size-3"
                      />
                      {{ healthLabel(entry.kind === 'check_in' ? entry.checkIn.health_status : entry.diagnosis.suggested_health_status!) }}
                    </span>
                  </div>
                  <p
                    v-if="entrySubtitle(entry)"
                    class="text-xs text-muted"
                    :class="entry.kind === 'diagnosis' && openDiagnosis === entry.diagnosis.id ? '' : 'line-clamp-2'"
                  >
                    {{ entrySubtitle(entry) }}
                  </p>
                  <p class="text-[11px] text-dimmed">
                    {{ formatDate(entry.at) }}
                  </p>
                </div>
                <button
                  v-if="entryPhoto(entry) && photoFor(entryPhoto(entry))"
                  type="button"
                  class="shrink-0"
                  :aria-label="t('plants.viewPhoto')"
                  @click="viewer = { key: entryKey(entry), path: entryPhoto(entry)!, at: entry.at, caption: entryTitle(entry) }"
                >
                  <img
                    :src="photoFor(entryPhoto(entry))!"
                    alt=""
                    loading="lazy"
                    class="size-12 rounded-lg object-cover"
                  >
                </button>
              </div>

              <template v-if="entry.kind === 'diagnosis' && diagnosisDetails(entry)">
                <UButton
                  size="xs"
                  variant="link"
                  class="mt-1 px-0"
                  :trailing-icon="openDiagnosis === entry.diagnosis.id ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                  @click="openDiagnosis = openDiagnosis === entry.diagnosis.id ? null : entry.diagnosis.id"
                >
                  {{ openDiagnosis === entry.diagnosis.id ? t('plants.hideDetails') : t('plants.showDetails') }}
                </UButton>
                <div
                  v-if="openDiagnosis === entry.diagnosis.id"
                  class="mt-2 space-y-2 text-xs"
                >
                  <p class="text-muted">
                    <strong class="text-default">{{ t('diagnose.symptoms') }}:</strong> {{ entry.diagnosis.symptoms }}
                  </p>
                  <div v-if="diagnosisDetails(entry)!.probableCauses?.length">
                    <p class="font-medium text-default">
                      {{ t('diagnose.probableCauses') }}
                    </p>
                    <ul class="list-disc pl-4 text-muted">
                      <li
                        v-for="(c, i) in diagnosisDetails(entry)!.probableCauses"
                        :key="i"
                      >
                        {{ c }}
                      </li>
                    </ul>
                  </div>
                  <div v-if="diagnosisDetails(entry)!.immediateActions?.length">
                    <p class="font-medium text-default">
                      {{ t('diagnose.immediateActions') }}
                    </p>
                    <ul class="list-disc pl-4 text-muted">
                      <li
                        v-for="(a, i) in diagnosisDetails(entry)!.immediateActions"
                        :key="i"
                      >
                        {{ a }}
                      </li>
                    </ul>
                  </div>
                </div>
              </template>
            </div>
          </li>
        </ol>
      </section>
    </template>

    <UModal
      v-model:open="viewerOpen"
      :title="viewer?.caption"
      :description="viewer ? formatDate(viewer.at) : undefined"
    >
      <template #body>
        <img
          v-if="viewer && photoFor(viewer.path)"
          :src="photoFor(viewer.path)!"
          alt=""
          class="w-full rounded-xl object-contain"
        >
      </template>
    </UModal>
  </div>
</template>
