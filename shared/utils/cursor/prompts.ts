import type { Plant, Site } from '../../types/database'
import { translate } from '../i18n/translate'

const LOCALE = 'es' as const

function placementLabel(p: Site['placement']): string {
  return translate(LOCALE, `enums.placement.${p}`)
}

function orientationLabel(o: NonNullable<Site['window_orientation']>): string {
  return translate(LOCALE, `enums.orientation.${o}`)
}

function luminosityLabel(l: NonNullable<Site['luminosity']>): string {
  return translate(LOCALE, `enums.luminosity.${l}`)
}

function siteContext(site: Site | null | undefined): string | null {
  if (!site) return null
  const lines = [
    `Sitio: ${site.name}`,
    `Ubicación: ${placementLabel(site.placement)}`,
    site.window_orientation ? `Orientación: ${orientationLabel(site.window_orientation)}` : null,
    site.luminosity ? `Luminosidad: ${luminosityLabel(site.luminosity)}` : null,
    site.has_ceiling_cover ? 'Techo/cubierta: sí (terraza cubierta)' : null,
    site.notes ? `Notas sitio: ${site.notes}` : null
  ]
  return lines.filter(Boolean).join('\n')
}

function plantContext(plant: Plant): string {
  const lines = [
    `Nombre: ${plant.name}`,
    plant.species ? `Especie: ${plant.species}` : null,
    `Estado actual: ${plant.health_status}`,
    plant.health_status_note ? `Nota estado: ${plant.health_status_note}` : null,
    `Riego cada ${plant.watering_interval_days} días`,
    `Fertilización cada ${plant.fertilizing_interval_days} días`,
    plant.last_watered_at ? `Último riego: ${plant.last_watered_at}` : null,
    plant.last_fertilized_at ? `Última fertilización: ${plant.last_fertilized_at}` : null,
    siteContext(plant.site),
    plant.window_distance_cm != null ? `Distancia a ventana (esta planta): ${plant.window_distance_cm} cm` : null,
    plant.pot_size ? `Maceta: ${plant.pot_size}` : null,
    plant.pot_diameter_cm ? `Diámetro maceta: ${plant.pot_diameter_cm} cm` : null,
    plant.pot_material ? `Material maceta: ${plant.pot_material}` : null,
    plant.has_drainage != null ? `Drenaje: ${plant.has_drainage ? 'sí' : 'no'}` : null,
    plant.substrate_type ? `Sustrato: ${plant.substrate_type}` : null,
    plant.age_years ? `Antigüedad: ${plant.age_years} años` : null,
    plant.substrate_notes ? `Notas sustrato: ${plant.substrate_notes}` : null,
    plant.height_cm ? `Altura: ${plant.height_cm} cm` : null
  ]
  return lines.filter(Boolean).join('\n')
}

export function buildDiagnosePrompt(plant: Plant, symptoms: string): string {
  return `Eres un experto en botánica de interior. Analiza el problema de esta planta y responde SOLO con JSON válido (sin markdown).

Planta:
${plantContext(plant)}

Síntomas reportados:
${symptoms}

JSON esperado:
{
  "probableCauses": ["string"],
  "severity": "low" | "medium" | "high",
  "immediateActions": ["string"],
  "preventiveCare": ["string"],
  "whenToWorry": "string",
  "suggestedHealthStatus": "healthy" | "fair" | "sick" | "critical",
  "summary": "string breve en español"
}

Mapeo severity → suggestedHealthStatus: low→fair, medium→sick, high→critical (ajusta según gravedad real).`
}

export function buildRecommendPrompt(
  plant: Plant,
  weatherSummary: string,
  latitude: number,
  longitude: number
): string {
  return `Eres un experto en cuidado de plantas de interior. Da recomendaciones personalizadas y responde SOLO con JSON válido (sin markdown).

Planta:
${plantContext(plant)}

Ubicación del hogar: lat ${latitude}, lon ${longitude}
Clima próximos días (Open-Meteo):
${weatherSummary}

JSON esperado:
{
  "wateringAdvice": "string",
  "fertilizingAdvice": "string",
  "lightExposure": { "level": "baja" | "media" | "alta", "summary": "string" },
  "seasonalTips": ["string"],
  "riskFlags": ["string"],
  "environmentNotes": "string explicando cómo influyen sitio, ventana, maceta y sustrato"
}

Considera hemisferio norte: ventana sur = más luz directa. Maceta pequeña + sustrato retentivo = menos riego.`
}

export function extractJsonFromText(text: string): string {
  const trimmed = text.trim()
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch) {
    return fenceMatch[1].trim()
  }
  const start = trimmed.indexOf('{')
  const end = trimmed.lastIndexOf('}')
  if (start !== -1 && end !== -1) {
    return trimmed.slice(start, end + 1)
  }
  return trimmed
}
