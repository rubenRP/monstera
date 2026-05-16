import type { Luminosity, Placement, WindowOrientation } from '../types/database'

export const PLACEMENT_OPTIONS: { value: Placement }[] = [
  { value: 'indoor' },
  { value: 'outdoor' },
  { value: 'semi_outdoor' }
]

export const WINDOW_ORIENTATION_OPTIONS: { value: WindowOrientation }[] = [
  { value: 'N' },
  { value: 'NE' },
  { value: 'E' },
  { value: 'SE' },
  { value: 'S' },
  { value: 'SW' },
  { value: 'W' },
  { value: 'NW' }
]

export const LUMINOSITY_OPTIONS: { value: Luminosity }[] = [
  { value: 'low' },
  { value: 'medium' },
  { value: 'high' },
  { value: 'direct_sun' }
]
