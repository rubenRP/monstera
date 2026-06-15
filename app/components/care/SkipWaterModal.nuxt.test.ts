import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { createCareTask } from '../../../test/factories'
import SkipWaterModal from './SkipWaterModal.vue'

const modalStub = {
  props: ['open', 'title'],
  template: '<div data-testid="skip-water-modal"><slot name="body" /></div>'
}

describe('SkipWaterModal', () => {
  it('shows plant name in the body when task is set', async () => {
    const task = createCareTask({
      plant: {
        id: 'plant-1',
        name: 'Monstera',
        photo_path: null,
        health_status: 'healthy',
        archived_at: null,
        site_id: null,
        site: null
      }
    })
    const wrapper = await mountSuspended(SkipWaterModal, {
      props: {
        open: true,
        task
      },
      global: {
        stubs: { UModal: modalStub }
      }
    })

    expect(wrapper.text()).toContain('Monstera')
    expect(wrapper.text()).toContain('Skip watering')
  })

  it('emits confirm with soilStillWet true for wet soil option', async () => {
    const task = createCareTask()
    const wrapper = await mountSuspended(SkipWaterModal, {
      props: {
        open: true,
        task
      },
      global: {
        stubs: { UModal: modalStub }
      }
    })

    const buttons = wrapper.findAll('button')
    const wetButton = buttons.find(b => b.text().includes('still wet'))
    expect(wetButton).toBeDefined()
    await wetButton!.trigger('click')

    expect(wrapper.emitted('confirm')?.[0]).toEqual([true])
  })

  it('emits confirm with soilStillWet false for other reason', async () => {
    const task = createCareTask()
    const wrapper = await mountSuspended(SkipWaterModal, {
      props: {
        open: true,
        task
      },
      global: {
        stubs: { UModal: modalStub }
      }
    })

    const buttons = wrapper.findAll('button')
    const otherButton = buttons.find(b => b.text().includes('other reason'))
    expect(otherButton).toBeDefined()
    await otherButton!.trigger('click')

    expect(wrapper.emitted('confirm')?.[0]).toEqual([false])
  })
})
