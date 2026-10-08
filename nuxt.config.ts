// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath } from 'node:url'

export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxtjs/supabase',
    '@vite-pwa/nuxt',
    '@nuxtjs/i18n'
  ],

  devtools: {
    enabled: true
  },

  app: {
    head: {
      meta: [
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1, viewport-fit=cover'
        }
      ]
    }
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    cursorApiKey: process.env.CURSOR_API_KEY || '',
    perenualApiKey: process.env.PERENUAL_API_KEY || '',
    supabaseServiceKey:
      process.env.NUXT_SUPABASE_SECRET_KEY
      || process.env.SUPABASE_SECRET_KEY
      || '',
    vapidPrivateKey: process.env.VAPID_PRIVATE_KEY || '',
    public: {
      vapidPublicKey: process.env.NUXT_PUBLIC_VAPID_PUBLIC_KEY || '',
      homeLat: process.env.NUXT_PUBLIC_HOME_LAT || '40.4168',
      homeLon: process.env.NUXT_PUBLIC_HOME_LON || '-3.7038',
      githubUrl:
        process.env.NUXT_PUBLIC_GITHUB_URL
        || 'https://github.com/rubenrp/monstera'
    }
  },

  alias: {
    '#shared': fileURLToPath(new URL('./shared', import.meta.url))
  },

  routeRules: {
    '/api/cron/**': { cache: false },
    '/api/push/send-daily': { cache: false }
  },

  compatibilityDate: '2025-01-15',

  nitro: {
    vercel: {
      functions: {
        maxDuration: 120
      }
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  i18n: {
    defaultLocale: 'es',
    strategy: 'no_prefix',
    locales: [
      { code: 'es', name: 'Español', file: 'es.json' },
      { code: 'en', name: 'English', file: 'en.json' }
    ],
    langDir: 'locales',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_locale',
      fallbackLocale: 'es'
    }
  },

  pwa: {
    registerType: 'autoUpdate',
    manifest: false,
    workbox: {
      importScripts: ['/sw-push.js'],
      navigateFallback: '/',
      navigateFallbackDenylist: [/^\/api\//],
      globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/.*\/api\/.*/i,
          handler: 'NetworkOnly'
        }
      ]
    },
    client: {
      installPrompt: true
    }
  },

  supabase: {
    redirect: true,
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      exclude: ['/', '/login', '/confirm']
    }
  }
})
