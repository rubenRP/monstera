import type { Component } from 'vue'
import { mountSuspended, type MountSuspendedOptions } from '@nuxt/test-utils/runtime'

export type MountWithLocaleOptions = MountSuspendedOptions<Component> & {
  locale?: 'es' | 'en'
}

export async function mountWithLocale(
  component: Component,
  options: MountWithLocaleOptions = {}
) {
  const { locale = 'es', ...mountOptions } = options
  const wrapper = await mountSuspended(component, {
    ...mountOptions,
    global: {
      ...mountOptions.global,
      mocks: {
        ...mountOptions.global?.mocks
      }
    }
  })

  const i18n = wrapper.vm.$i18n
  if (i18n && locale !== i18n.locale.value) {
    await i18n.setLocale(locale)
    await wrapper.vm.$nextTick()
  }

  return wrapper
}
