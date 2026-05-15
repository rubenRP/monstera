import type { Luminosity, Placement, WindowOrientation } from '../types/database'

export const PLACEMENT_OPTIONS: { value: Placement, label: string }[] = [
  { value: 'indoor', label: 'Interior' },
  { value: 'outdoor', label: 'Exterior' },
  { value: 'semi_outdoor', label: 'Terraza / semi-exterior' }
]

export const WINDOW_ORIENTATION_OPTIONS: { value: WindowOrientation, label: string }[] = [
  { value: 'N', label: 'Norte' },
  { value: 'NE', label: 'Noreste' },
  { value: 'E', label: 'Este' },
  { value: 'SE', label: 'Sureste' },
  { value: 'S', label: 'Sur' },
  { value: 'SW', label: 'Suroeste' },
  { value: 'W', label: 'Oeste' },
  { value: 'NW', label: 'Noroeste' }
]

export const LUMINOSITY_OPTIONS: { value: Luminosity, label: string, description: string }[] = [
  { value: 'low', label: 'Baja', description: 'Poca luz natural' },
  { value: 'medium', label: 'Media', description: 'Luz indirecta buena' },
  { value: 'high', label: 'Alta', description: 'Luz brillante sin sol directo prolongado' },
  { value: 'direct_sun', label: 'Sol directo', description: 'Varias horas de sol directo' }
]

export function getPlacementLabel(p: Placement): string {
  return PLACEMENT_OPTIONS.find(o => o.value === p)?.label ?? p
}

export function getLuminosityLabel(l: Luminosity): string {
  return LUMINOSITY_OPTIONS.find(o => o.value === l)?.label ?? l
}

export function getOrientationLabel(o: WindowOrientation): string {
  return WINDOW_ORIENTATION_OPTIONS.find(x => x.value === o)?.label ?? o
}
