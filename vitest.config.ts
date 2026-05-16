import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
  test: {
    include: ['shared/**/*.test.ts']
  },
  resolve: {
    alias: {
      '#shared': resolve(__dirname, 'shared')
    }
  }
})
