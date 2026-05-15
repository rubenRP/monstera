// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath } from 'node:url'

export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxtjs/supabase',
    '@vite-pwa/nuxt'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  compatibilityDate: '2025-01-15',

  alias: {
    '#shared': fileURLToPath(new URL('./shared', import.meta.url))
  },

  runtimeConfig: {
    cursorApiKey: process.env.CURSOR_API_KEY || '',
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || '',
    vapidPrivateKey: process.env.VAPID_PRIVATE_KEY || '',
    public: {
      vapidPublicKey: process.env.NUXT_PUBLIC_VAPID_PUBLIC_KEY || '',
      homeLat: process.env.NUXT_PUBLIC_HOME_LAT || '40.4168',
      homeLon: process.env.NUXT_PUBLIC_HOME_LON || '-3.7038'
    }
  },

  supabase: {
    redirect: true,
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      exclude: ['/login', '/confirm']
    }
  },

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Monstera',
      short_name: 'Monstera',
      description: 'Cuidado de plantas de casa',
      theme_color: '#2d6a4f',
      background_color: '#f8faf8',
      display: 'standalone',
      lang: 'es',
      icons: [
        {
          src: '/icons/icon-192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: '/icons/icon-512.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ]
    },
    workbox: {
      importScripts: ['/sw-push.js'],
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
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

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
