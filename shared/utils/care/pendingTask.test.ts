import { describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { replacePendingCareTask } from './pendingTask'

function clientWith(result: { data: unknown, error: unknown }) {
  const rpc = vi.fn().mockResolvedValue(result)
  return { client: { rpc } as unknown as SupabaseClient, rpc }
}

describe('replacePendingCareTask', () => {
  it('calls the atomic RPC with plant, type and due date', async () => {
    const task = { id: 't1', plant_id: 'p1', type: 'water', due_at: '2026-10-30T09:00:00.000Z' }
    const { client, rpc } = clientWith({ data: task, error: null })

    const result = await replacePendingCareTask(client, 'p1', 'water', task.due_at)

    expect(rpc).toHaveBeenCalledWith('replace_pending_care_task', {
      p_plant_id: 'p1',
      p_type: 'water',
      p_due_at: task.due_at
    })
    expect(result).toEqual(task)
  })

  it('throws the Supabase error', async () => {
    const error = { message: 'boom' }
    const { client } = clientWith({ data: null, error })

    await expect(
      replacePendingCareTask(client, 'p1', 'fertilize', '2026-10-30T09:00:00.000Z')
    ).rejects.toBe(error)
  })
})
