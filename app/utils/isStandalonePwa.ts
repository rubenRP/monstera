/** True when running as an installed PWA (home screen), not in the mobile browser tab. */
export function isStandalonePwa(): boolean {
  if (!import.meta.client) return false
  const nav = navigator as Navigator & { standalone?: boolean }
  if (nav.standalone) return true
  return window.matchMedia('(display-mode: standalone)').matches
}
