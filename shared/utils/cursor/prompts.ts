import type { Plant, Site } from '../../types/database'
import type { SpeciesProfile } from '../../types/species'
import type { AppLocale } from '../i18n/locale'
import { translate } from '../i18n/translate'
import { isUnavailableField, type SpeciesCareFieldKey } from '../species/profileCompleteness'

const LOCALE = 'es' as const

const SPECIES_SECTION_I18N: Record<SpeciesCareFieldKey, string> = {
  watering: 'species.sectionWatering',
  light: 'species.sectionLight',
  humidity: 'species.sectionHumidity',
  fertilizing: 'species.sectionFertilizing',
  soil: 'species.sectionSoil',
  repotting: 'species.sectionRepotting',
  toxicity: 'species.sectionToxicity',
  characteristics: 'species.sectionCharacteristics',
  temperature: 'species.sectionTemperature',
  pestsAndProblems: 'species.sectionPests'
}

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
    `Riego base cada ${plant.watering_base_interval_days ?? plant.watering_interval_days} días`,
    `Riego efectivo actual: cada ${plant.watering_interval_days} días`,
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
    plant.age_years
      ? `Antigüedad: ${plant.age_years} ${plant.age_unit === 'months' ? 'meses' : 'años'}`
      : null,
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
  "environmentNotes": "string explicando cómo influyen sitio, ventana, maceta y sustrato",
  "suggestedWateringIntervalDays": number opcional entre 1 y 90 (intervalo base sugerido),
  "suggestedWateringIntervalRationale": "string opcional breve en español"
}

Sugiere suggestedWateringIntervalDays solo si el intervalo base actual debería cambiar de forma clara. Considera hemisferio norte: ventana sur = más luz directa. Maceta pequeña + sustrato retentivo = menos riego.`
}

const SECTION_ITEMS_JSON = `  "sectionItems": {
    "watering": { "rows": [{ "label": "main fact", "sublabel": "category e.g. frequency" }], "info": "optional extra paragraph" },
    "light": { "rows": [{ "label": "e.g. bright indirect", "sublabel": "preferred light" }] },
    "humidity": { "rows": [
      { "label": "e.g. high humidity", "sublabel": "how much humidity" },
      { "label": "e.g. mist leaves weekly", "sublabel": "misting / method" }
    ], "info": "optional details" },
    "fertilizing": { "rows": [{ "label": "e.g. every 2 weeks in spring", "sublabel": "schedule" }] },
    "soil": { "rows": [{ "label": "e.g. peat-based mix" }, { "label": "orchid bark" }] },
    "repotting": { "rows": [{ "label": "e.g. every 2 years", "sublabel": "frequency" }] },
    "toxicity": { "rows": [
      { "label": "toxic / non-toxic", "sublabel": "humans" },
      { "label": "toxic / non-toxic", "sublabel": "pets" }
    ] },
    "characteristics": { "rows": [{ "label": "trait", "sublabel": "type or cycle" }] },
    "temperature": { "rows": [{ "label": "e.g. 18-24°C", "sublabel": "ideal range" }] },
    "pestsAndProblems": { "rows": [{ "label": "pest or problem name" }] }
  }`

const TEMPERATURE_EXTRAS_JSON = `  "temperatureExtras": {
    "idealCelsiusMin": number,
    "idealCelsiusMax": number,
    "timelines": [
      {
        "kind": "indoor" | "outdoorPot" | "outdoorGround",
        "startMonth": 1-12,
        "endMonth": 1-12,
        "label": "short label e.g. year-round or mar-oct",
        "description": "optional sentence"
      }
    ],
    "locationLabel": "optional city/region name if location was provided"
  }`

function locationContextLine(
  location: { lat: number, lon: number } | null | undefined,
  locale: AppLocale
): string {
  if (!location) {
    return locale === 'en'
      ? 'User location: not set. Assume Northern Hemisphere temperate Europe for outdoor month windows.'
      : 'Ubicación del usuario: no configurada. Asume Europa templada del hemisferio norte para meses en exterior.'
  }
  return `User home coordinates: latitude ${location.lat}, longitude ${location.lon}. Tailor outdoorPot and outdoorGround timelines to this climate.`
}

export function buildSpeciesGeneratePrompt(
  speciesQuery: string,
  locale: AppLocale,
  location?: { lat: number, lon: number } | null
): string {
  const language = locale === 'en' ? 'English' : 'Spanish'
  return `You are an indoor plant care expert. The Perenual plant database has no entry for this species. Create a practical houseplant encyclopedia entry.

Species: ${speciesQuery}
Response language: ${language} (all string values must be in ${language})
${locationContextLine(location, locale)}

Respond ONLY with valid JSON (no markdown). For EVERY care section provide:
1. A short summary string (watering, light, etc.)
2. sectionItems.{key}.rows: 1–4 structured facts. Each row: "label" = main value, "sublabel" = category shown in UI (use the language of the response).
3. sectionItems.{key}.info: optional paragraph for details NOT covered by rows.

Examples (adapt to species): light row label "Bright indirect light", sublabel "Preferred light"; humidity rows for humidity level AND misting method.
Include temperatureExtras with indoor + outdoor month timelines.

{
  "commonName": "string",
  "scientificName": ["string"],
  "watering": "string",
  "light": "string",
  "humidity": "string",
  "fertilizing": "string",
  "soil": "string",
  "repotting": "string",
  "toxicity": "string",
  "characteristics": "string",
  "temperature": "string",
  "pestsAndProblems": "string",
${SECTION_ITEMS_JSON},
${TEMPERATURE_EXTRAS_JSON}
}`
}

export function buildSpeciesEnrichPrompt(
  speciesQuery: string,
  profile: SpeciesProfile,
  missingFields: SpeciesCareFieldKey[],
  locale: AppLocale,
  options?: {
    includeTemperatureExtras?: boolean
    location?: { lat: number, lon: number } | null
  }
): string {
  const language = locale === 'en' ? 'English' : 'Spanish'
  const sections = missingFields
    .map(key => `- ${translate(locale, SPECIES_SECTION_I18N[key])} (${key})`)
    .join('\n')

  const knownLines = [
    profile.commonName ? `Common name: ${profile.commonName}` : null,
    profile.scientificName.length ? `Scientific name: ${profile.scientificName.join(', ')}` : null,
    !isUnavailableField(profile.watering, locale) ? `Watering (reference): ${profile.watering}` : null,
    !isUnavailableField(profile.light, locale) ? `Light (reference): ${profile.light}` : null,
    !isUnavailableField(profile.characteristics, locale)
      ? `Characteristics (reference): ${profile.characteristics}`
      : null
  ].filter(Boolean).join('\n')

  const temperatureExtrasNote = options?.includeTemperatureExtras
    ? (locale === 'en'
        ? '\nAlso include temperatureExtras with indoor, outdoorPot, and outdoorGround month timelines (startMonth/endMonth 1–12).'
        : '\nIncluye también temperatureExtras con timelines de meses interior, exterior en maceta y exterior en suelo (startMonth/endMonth 1–12).')
    : ''

  const locationLine = options?.includeTemperatureExtras
    ? `\n${locationContextLine(options.location, locale)}`
    : ''

  return `You are an indoor plant care expert. A plant encyclopedia returned incomplete data for this species. Complete ONLY the missing sections with practical advice for houseplant care.

Species searched: ${speciesQuery}
Response language: ${language} (all string values must be in ${language})
${locationLine}

Known data (do not repeat verbatim; use for consistency):
${knownLines || '(none)'}

Missing sections to complete:
${sections || '(none — only temperatureExtras requested)'}${temperatureExtrasNote}

Respond ONLY with valid JSON (no markdown). For each section you fill, include BOTH the summary string AND sectionItems.{key} with rows (label + sublabel) and optional info for extra details.

Expected JSON shape (omit keys you cannot fill):
{
  "commonName": "string (only if missing)",
  "scientificName": ["string"],
  "watering": "string",
  "light": "string",
  "humidity": "string",
  "fertilizing": "string",
  "soil": "string",
  "repotting": "string",
  "toxicity": "string",
  "characteristics": "string",
  "temperature": "string",
  "pestsAndProblems": "string",
${SECTION_ITEMS_JSON},
${TEMPERATURE_EXTRAS_JSON}
}`
}

export function extractJsonFromText(text: string): string {
  const trimmed = text.trim()
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch?.[1]) {
    return fenceMatch[1].trim()
  }
  const start = trimmed.indexOf('{')
  const end = trimmed.lastIndexOf('}')
  if (start !== -1 && end !== -1) {
    return trimmed.slice(start, end + 1)
  }
  return trimmed
}
