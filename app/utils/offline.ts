export class OfflineError extends Error {
  constructor() {
    super('OFFLINE')
    this.name = 'OfflineError'
  }
}

export function assertOnline() {
  if (import.meta.client && !navigator.onLine) {
    throw new OfflineError()
  }
}
