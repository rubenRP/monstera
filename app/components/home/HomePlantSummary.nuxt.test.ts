import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { createPlant } from '../../../test/factories'
import HomePlantSummary from './HomePlantSummary.vue'

describe('HomePlantSummary', () => {
  it('does not render when there are no plants', async () => {
    const wrapper = await mountSuspended(HomePlantSummary, {
      props: { plants: [] }
    })

    expect(wrapper.find('[data-slot="root"]').exists()).toBe(false)
  })

  it('shows plant total and all-good headline with healthy plants', async () => {
    const plants = [
      createPlant({ id: 'p1', name: 'Monstera', health_status: 'healthy' }),
      createPlant({ id: 'p2', name: 'Pothos', health_status: 'healthy' })
    ]
    const wrapper = await mountSuspended(HomePlantSummary, {
      props: { plants, todayTaskCount: 0, overdueTaskCount: 0 }
    })

    expect(wrapper.text()).toContain('2 plants total')
    expect(wrapper.text()).toContain('All good')
  })

  it('prioritizes overdue headline over today tasks', async () => {
    const plants = [createPlant({ health_status: 'healthy' })]
    const wrapper = await mountSuspended(HomePlantSummary, {
      props: { plants, todayTaskCount: 2, overdueTaskCount: 1 }
    })

    expect(wrapper.text()).toContain('1 overdue task')
    expect(wrapper.text()).not.toContain('2 tasks for today')
  })

  it('shows attention badges for sick or critical plants', async () => {
    const plants = [
      createPlant({ id: 'p1', name: 'Monstera', health_status: 'sick' }),
      createPlant({ id: 'p2', name: 'Ficus', health_status: 'healthy' })
    ]
    const wrapper = await mountSuspended(HomePlantSummary, {
      props: { plants }
    })

    expect(wrapper.text()).toContain('Need attention')
    expect(wrapper.text()).toContain('Monstera')
    expect(wrapper.text()).not.toContain('Ficus')
  })

  it('renders health distribution chips', async () => {
    const plants = [
      createPlant({ health_status: 'healthy' }),
      createPlant({ id: 'p2', health_status: 'fair' })
    ]
    const wrapper = await mountSuspended(HomePlantSummary, {
      props: { plants }
    })

    expect(wrapper.text()).toContain('1 healthy')
    expect(wrapper.text()).toContain('1 fair')
  })
})
