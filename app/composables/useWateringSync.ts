import { plantIdsWithOverduePendingWater } from '#shared/utils/care/overdueWaterTask'
import type { WateringRecalcSource } from '#shared/utils/care/wateringRecalcEvent'

const ALIGN_STORAGE_KEY = 'monstera_fert_water_align_v1'
const SEASON_STORAGE_PREFIX = 'monstera_watering_sync_'
const SYNC_CONCURRENCY = 3

async function mapPool<T>(items: T[], limit: number, fn: (item: T) => Promise<void>) {
  if (!items.length) return
  const queue = [...items]
  const workers = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    while (queue.length) {
      const item = queue.shift()
      if (item === undefined) return
      await fn(item)
    }
  })
  await Promise.all(workers)
}

export function useWateringSync() {
  const supabase = useSupabaseClient()
  const { requireUserId } = useRequireUserId()
  const { rescheduleWatering, rescheduleCheckIn } = useAdaptiveWatering()

  async function syncWateringOnLogin(): Promise<void> {
    if (!import.meta.client) return

    let uid: string
    try {
      uid = await requireUserId()
    } catch {
      return
    }

    const now = new Date()
    const monthKey = `${now.getFullYear()}-${now.getMonth()}`
    const seasonKey = `${SEASON_STORAGE_PREFIX}${uid}`
    const seasonDone = localStorage.getItem(seasonKey) === monthKey
    const alignDone = localStorage.getItem(ALIGN_STORAGE_KEY) === '1'
    if (seasonDone && alignDone) return

    const source: WateringRecalcSource = seasonDone ? 'fertilize_align_sync' : 'season_sync'

    const { data: plants, error } = await supabase
      .from('plants')
      .select('id')
      .is('archived_at', null)
    if (error) throw error

    const ids = (plants ?? []).map(row => row.id as string)
    const overdue = await plantIdsWithOverduePendingWater(supabase, ids, now)
    const targets = ids.filter(id => !overdue.has(id))

    await mapPool(targets, SYNC_CONCURRENCY, async (plantId) => {
      await rescheduleWatering(plantId, { source, allowCursor: false })
      await rescheduleCheckIn(plantId)
    })

    localStorage.setItem(ALIGN_STORAGE_KEY, '1')
    if (!seasonDone) localStorage.setItem(seasonKey, monthKey)
  }

  return { syncWateringOnLogin }
}
