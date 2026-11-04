import { defineConfig } from 'vitest/config'
import { defineVitestProject } from '@nuxt/test-utils/config'
import { resolve } from 'node:path'

export default defineConfig({
  test: {
    // The Clerk client plugin boots inside the Nuxt test environment and tries to fetch its UI
    // script from the placeholder instance (`example.clerk.accounts.dev`). With no network access
    // (CI) that rejects asynchronously and fails the run even though every test passed.
    onUnhandledError(error) {
      if (/failed_to_load_clerk_ui|Failed to load Clerk/i.test(String(error.message))) return false
    },
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
