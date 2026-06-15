import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import HealthSemaphore from './HealthSemaphore.vue'

describe('HealthSemaphore', () => {
  it('renders four health options in a radiogroup', async () => {
    const wrapper = await mountSuspended(HealthSemaphore, {
      props: { modelValue: 'healthy' }
    })

    expect(wrapper.get('[role="radiogroup"]').element).toBeTruthy()
    expect(wrapper.findAll('[role="radio"]')).toHaveLength(4)
  })

  it('marks the current value as checked', async () => {
    const wrapper = await mountSuspended(HealthSemaphore, {
      props: { modelValue: 'fair' }
    })

    expect(wrapper.find('[aria-checked="true"]').exists()).toBe(true)
  })

  it('emits update:modelValue when a different status is selected', async () => {
    const wrapper = await mountSuspended(HealthSemaphore, {
      props: { modelValue: 'healthy' }
    })

    const radios = wrapper.findAll('[role="radio"]')
    await radios[1]!.trigger('click')

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['fair'])
  })

  it('shows a note input for fair, sick, or critical status', async () => {
    const wrapper = await mountSuspended(HealthSemaphore, {
      props: { modelValue: 'sick', note: null }
    })

    expect(wrapper.find('input').exists()).toBe(true)
  })

  it('hides the note input when healthy', async () => {
    const wrapper = await mountSuspended(HealthSemaphore, {
      props: { modelValue: 'healthy', note: null }
    })

    expect(wrapper.find('input').exists()).toBe(false)
  })

  it('does not emit when readonly', async () => {
    const wrapper = await mountSuspended(HealthSemaphore, {
      props: { modelValue: 'healthy', readonly: true }
    })

    const radios = wrapper.findAll('[role="radio"]')
    await radios[1]!.trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })
})
