export default defineNuxtPlugin(() => {
  if (!('serviceWorker' in navigator)) return

  navigator.serviceWorker.addEventListener('message', () => {})

  navigator.serviceWorker.ready.then(() => {
    // Push handler registered in generated SW via vite-pwa custom logic
  })
})
