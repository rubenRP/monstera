import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { UNDO_WINDOW_MS, useDeferredActions } from './useDeferredActions'

async function mountHarness() {
  let api!: ReturnType<typeof useDeferredActions>
  const Harness = defineComponent({
    setup() {
      api = useDeferredActions()
      return () => h('div')
    }
  })
  const wrapper = await mountSuspended(Harness)
  return { wrapper, api }
}

describe('useDeferredActions', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('runs the action after the undo window', async () => {
    const { api } = await mountHarness()
    const run = vi.fn().mockResolvedValue(undefined)

    api.schedule('t1', run)
    expect(api.pendingIds.value.has('t1')).toBe(true)
    expect(run).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(UNDO_WINDOW_MS)
    expect(run).toHaveBeenCalledTimes(1)
    expect(api.pendingIds.value.has('t1')).toBe(false)
  })

  it('keeps the id hidden while the action is running', async () => {
    const { api } = await mountHarness()
    let resolveRun!: () => void
    const run = vi.fn(() => new Promise<void>((resolve) => {
      resolveRun = resolve
    }))

    api.schedule('t1', run)
    await vi.advanceTimersByTimeAsync(UNDO_WINDOW_MS)
    expect(run).toHaveBeenCalledTimes(1)
    expect(api.pendingIds.value.has('t1')).toBe(true)
    expect(api.cancel('t1')).toBe(false)

    resolveRun()
    await vi.advanceTimersByTimeAsync(0)
    expect(api.pendingIds.value.has('t1')).toBe(false)
  })

  it('cancel prevents the action (undo)', async () => {
    const { api } = await mountHarness()
    const run = vi.fn().mockResolvedValue(undefined)

    api.schedule('t1', run)
    expect(api.cancel('t1')).toBe(true)
    await vi.advanceTimersByTimeAsync(UNDO_WINDOW_MS)

    expect(run).not.toHaveBeenCalled()
    expect(api.cancel('t1')).toBe(false)
  })

  it('flushes pending actions on unmount so nothing is lost', async () => {
    const { wrapper, api } = await mountHarness()
    const run = vi.fn().mockResolvedValue(undefined)

    api.schedule('t1', run)
    wrapper.unmount()
    await vi.runAllTimersAsync()

    expect(run).toHaveBeenCalledTimes(1)
  })
})
