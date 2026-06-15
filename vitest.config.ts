import { defineVitestConfig } from '@nuxt/test-utils/config'
import { resolve } from 'node:path'

export default defineVitestConfig({
  test: {
    environment: 'node',
    include: ['shared/**/*.test.ts']
  },
  resolve: {
    alias: {
      '#shared': resolve(__dirname, 'shared')
    }
  }
})
