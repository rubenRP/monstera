export const UNDO_WINDOW_MS = 5000

interface PendingAction {
  timer: ReturnType<typeof setTimeout>
  run: () => Promise<void>
}

/**
 * Runs actions after an undo window (Gmail-style). Pending actions are flushed
 * immediately when the component unmounts or the page is hidden, so leaving the
 * app never drops a completed task.
 */
export function useDeferredActions() {
  const pending = new Map<string, PendingAction>()
  /** Ids whose action is running: no longer undoable, but still hidden until it settles. */
  const running = new Set<string>()
  const pendingIds = ref<ReadonlySet<string>>(new Set())

  function sync() {
    pendingIds.value = new Set([...pending.keys(), ...running])
  }

  async function execute(id: string) {
    const action = pending.get(id)
    if (!action) return
    clearTimeout(action.timer)
    pending.delete(id)
    running.add(id)
    sync()
    try {
      await action.run()
    } finally {
      running.delete(id)
      sync()
    }
  }

  function schedule(id: string, run: () => Promise<void>, delayMs = UNDO_WINDOW_MS) {
    cancel(id)
    const timer = setTimeout(() => {
      void execute(id)
    }, delayMs)
    pending.set(id, { timer, run })
    sync()
  }

  /** Returns true when the action was still pending (i.e. undo succeeded). */
  function cancel(id: string): boolean {
    const action = pending.get(id)
    if (!action) return false
    clearTimeout(action.timer)
    pending.delete(id)
    sync()
    return true
  }

  async function flushAll() {
    await Promise.all([...pending.keys()].map(execute))
  }

  function onVisibilityChange() {
    if (document.visibilityState === 'hidden') void flushAll()
  }

  function onPageHide() {
    void flushAll()
  }

  onMounted(() => {
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('pagehide', onPageHide)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('visibilitychange', onVisibilityChange)
    window.removeEventListener('pagehide', onPageHide)
    void flushAll()
  })

  return {
    pendingIds: readonly(pendingIds),
    schedule,
    cancel,
    flushAll
  }
}
