/** Top-level sections reachable from the main navigation (no back button). */
export const TOP_LEVEL_PATHS = ['/', '/plants', '/calendar', '/sites', '/settings'] as const

export function isTopLevelPath(path: string): boolean {
  const normalized = normalizePath(path)
  return (TOP_LEVEL_PATHS as readonly string[]).includes(normalized)
}

/**
 * Logical parent of a route, used when there is no in-app history to go back to
 * (e.g. the installed PWA opened from a notification).
 * `/plants/abc/edit` → `/plants/abc`, `/plants/new` → `/plants`, `/plants` → `/`.
 */
export function parentPath(path: string): string {
  const segments = normalizePath(path).split('/').filter(Boolean)
  if (segments.length <= 1) return '/'
  return `/${segments.slice(0, -1).join('/')}`
}

function normalizePath(path: string): string {
  const withoutQuery = path.split(/[?#]/)[0] ?? '/'
  if (withoutQuery.length > 1 && withoutQuery.endsWith('/')) {
    return withoutQuery.slice(0, -1)
  }
  return withoutQuery || '/'
}
