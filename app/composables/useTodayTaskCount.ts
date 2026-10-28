import { excludePendingResolvedToday } from '#shared/utils/care/resolvedToday'

/** Pending tasks for today (incl. overdue), shown as a badge on the "Today" nav item. */
export function useTodayTaskCount() {
  const count = useState<number | null>('today-task-count', () => null)
  const { fetchTodayTasks, fetchTodayCompletedTasks } = useCareTasks()

  function setCount(value: number) {
    count.value = value
  }

  /** Loads the count when no screen has provided it yet (e.g. app opened on /plants). */
  async function ensureLoaded() {
    if (count.value != null) return
    try {
      const [pending, completed] = await Promise.all([fetchTodayTasks(), fetchTodayCompletedTasks()])
      count.value = excludePendingResolvedToday(pending, completed).length
    } catch {
      // Badge is a hint only; leave it hidden on failure
    }
  }

  return { count: readonly(count), setCount, ensureLoaded }
}
