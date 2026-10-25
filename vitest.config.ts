import { defineConfig } from 'vitest/config'
import { defineVitestProject } from '@nuxt/test-utils/config'
import { resolve } from 'node:path'

export default defineConfig({
  test: {
    projects: [
      {
        resolve: {
          alias: {
            '#shared': resolve(__dirname, 'shared')
          }
        },
        test: {
          name: 'node',
          environment: 'node',
          include: ['shared/**/*.test.ts']
        }
      },
      await defineVitestProject({
        test: {
          name: 'nuxt',
          environment: 'nuxt',
          include: ['app/**/*.nuxt.test.ts']
        }
      })
    ]
  }
})
