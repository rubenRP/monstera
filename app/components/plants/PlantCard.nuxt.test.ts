import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { createPlant } from '../../../test/factories'
import PlantCard from './PlantCard.vue'

describe('PlantCard', () => {
  it('renders plant name and species', async () => {
    const plant = createPlant({
      name: 'Monstera',
      species: 'Monstera deliciosa'
    })
    const wrapper = await mountSuspended(PlantCard, {
      props: { plant }
    })

    expect(wrapper.text()).toContain('Monstera')
    expect(wrapper.text()).toContain('Monstera deliciosa')
  })

  it('links to the plant detail page', async () => {
    const plant = createPlant({ id: 'plant-42' })
    const wrapper = await mountSuspended(PlantCard, {
      props: { plant }
    })

    const link = wrapper.get('a')
    expect(link.attributes('href')).toBe('/plants/plant-42')
  })

  it('shows site name when present', async () => {
    const plant = createPlant({
      site: {
        id: 'site-1',
        user_id: 'test-user-id',
        name: 'Salón',
        placement: 'indoor',
        window_orientation: null,
        luminosity: null,
        has_ceiling_cover: false,
        notes: '',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z'
      }
    })
    const wrapper = await mountSuspended(PlantCard, {
      props: { plant }
    })

    expect(wrapper.text()).toContain('Salón')
  })

  it('shows archive reason badge when archived', async () => {
    const plant = createPlant({
      archived_at: '2026-06-01T00:00:00Z',
      archive_reason: 'gifted'
    })
    const wrapper = await mountSuspended(PlantCard, {
      props: { plant, archived: true }
    })

    expect(wrapper.text()).toContain('Gifted')
  })
})
