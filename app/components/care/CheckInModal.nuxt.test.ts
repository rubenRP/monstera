import { describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { createCareTask, createPlant } from '../../../test/factories'
import CheckInModal from './CheckInModal.vue'

const plant = createPlant({
  id: 'plant-1',
  name: 'Monstera',
  health_status: 'healthy',
  health_status_note: null,
  height_cm: 40
})

mockNuxtImport('usePlants', () => () => ({
  fetchPlant: vi.fn(async () => plant)
}))

const modalStub = {
  props: ['open', 'title'],
  template: '<div data-testid="check-in-modal"><slot name="body" /></div>'
}

describe('CheckInModal', () => {
  it('loads plant data when opened with a task', async () => {
    const task = createCareTask({ plant_id: 'plant-1' })
    const wrapper = await mountSuspended(CheckInModal, {
      props: {
        open: true,
        task
      },
      global: {
        stubs: { UModal: modalStub }
      }
    })

    await flushPromises()
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Health status')
    })
    expect(wrapper.find('form').exists()).toBe(true)
  })

  it('emits submit with form data on valid submit', async () => {
    const task = createCareTask({ plant_id: 'plant-1' })
    const wrapper = await mountSuspended(CheckInModal, {
      props: {
        open: true,
        task
      },
      global: {
        stubs: { UModal: modalStub }
      }
    })

    await flushPromises()
    await vi.waitFor(() => {
      expect(wrapper.find('form').exists()).toBe(true)
    })

    await wrapper.find('form').trigger('submit.prevent')

    await vi.waitFor(() => {
      expect(wrapper.emitted('submit')).toBeDefined()
    })

    const payload = wrapper.emitted('submit')?.[0]
    expect(payload?.[0]).toMatchObject({
      health_status: 'healthy',
      new_leaves: false,
      dropped_leaves: false,
      flowering: false,
      size_changed: false
    })
  })
})
