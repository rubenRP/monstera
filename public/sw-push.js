self.addEventListener('push', (event) => {
  let data = { title: 'Monstera', body: 'Tienes tareas pendientes', url: '/' }
  try {
    if (event.data) {
      data = { ...data, ...event.data.json() }
    }
  } catch {
    /* ignore */
  }
  const hasTasks = Array.isArray(data.taskIds) && data.taskIds.length > 0
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: data.tag,
      data: { url: data.url ?? '/', taskIds: data.taskIds ?? [] },
      actions: hasTasks && Array.isArray(data.actions) ? data.actions : []
    })
  )
})

function focusOrOpen(url) {
  return clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    for (const client of list) {
      if ('focus' in client && 'navigate' in client && new URL(client.url).origin === self.location.origin) {
        return client.navigate(url).then(c => (c ?? client).focus())
      }
    }
    if (clients.openWindow) {
      return clients.openWindow(url)
    }
  })
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const { url = '/', taskIds = [] } = event.notification.data ?? {}

  if (event.action === 'snooze' && taskIds.length) {
    // Session cookie authenticates the request; open the app if it fails (e.g. signed out)
    event.waitUntil(
      fetch('/api/push/snooze', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskIds })
      }).then((res) => {
        if (!res.ok) return focusOrOpen('/')
      }).catch(() => focusOrOpen('/'))
    )
    return
  }

  if (event.action === 'done' && taskIds.length) {
    // Completion runs in the app (rescheduling logic + undo toast)
    event.waitUntil(focusOrOpen(`/?action=complete&tasks=${taskIds.join(',')}`))
    return
  }

  event.waitUntil(focusOrOpen(url))
})
