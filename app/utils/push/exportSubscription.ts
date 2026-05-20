/** Serialize a PushSubscription for the server (Safari/iOS may omit keys in toJSON()). */
export function exportPushSubscription(sub: PushSubscription): {
  endpoint: string
  keys: { p256dh: string, auth: string }
} {
  const json = sub.toJSON()
  const endpoint = json.endpoint ?? sub.endpoint

  let p256dh = json.keys?.p256dh
  let auth = json.keys?.auth

  if (!p256dh) {
    const raw = sub.getKey('p256dh')
    if (raw) p256dh = arrayBufferToBase64Url(raw)
  }
  if (!auth) {
    const raw = sub.getKey('auth')
    if (raw) auth = arrayBufferToBase64Url(raw)
  }

  if (!endpoint || !p256dh || !auth) {
    throw new Error('Push subscription incomplete')
  }

  return { endpoint, keys: { p256dh, auth } }
}

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!)
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}
