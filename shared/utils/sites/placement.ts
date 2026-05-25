import type { Placement } from '../../types/database'

/** Window distance only applies to indoor sites; outdoor and terrace ignore it. */
export function usesWindowDistance(placement: Placement | null | undefined): boolean {
  return placement === 'indoor' || placement == null
}
