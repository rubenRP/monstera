/** Upper bound for calls to third-party APIs (Perenual, Open-Meteo) so a hung request cannot eat the route budget. */
export const EXTERNAL_FETCH_TIMEOUT_MS = 10_000

export function externalFetchSignal(): AbortSignal {
  return AbortSignal.timeout(EXTERNAL_FETCH_TIMEOUT_MS)
}
