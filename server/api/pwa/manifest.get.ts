import en from '../../../i18n/locales/en.json'
import es from '../../../i18n/locales/es.json'

const icons = [
  {
    src: '/icons/icon-192.png',
    sizes: '192x192',
    type: 'image/png',
    purpose: 'any'
  },
  {
    src: '/icons/icon-512.png',
    sizes: '512x512',
    type: 'image/png',
    purpose: 'any'
  },
  {
    src: '/icons/icon-512.png',
    sizes: '512x512',
    type: 'image/png',
    purpose: 'maskable'
  }
]

function asLang(value: unknown) {
  return value === 'en' ? 'en' : 'es'
}

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const lang = asLang(query.lang ?? getCookie(event, 'i18n_locale'))
  const theme = query.theme ?? getCookie(event, 'nuxt-color-mode')
  const dark = theme === 'dark'
  const description = (lang === 'en' ? en : es).app.pwaDescription
  const surface = dark ? '#18191B' : '#F5F0E4'

  setResponseHeader(event, 'content-type', 'application/manifest+json; charset=utf-8')
  setResponseHeader(event, 'cache-control', 'no-cache')

  return {
    name: 'Monstera',
    short_name: 'Monstera',
    description,
    lang,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    theme_color: surface,
    background_color: surface,
    icons
  }
})
