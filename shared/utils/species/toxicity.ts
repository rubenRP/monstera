import type { SpeciesProfile } from '../../types/species'
import type { AppLocale } from '../i18n/locale'
import { translate } from '../i18n/translate'

const LOCALES: AppLocale[] = ['es', 'en']

/** "No tóxica", "non-toxic", "not toxic", "no es tóxico", "considerada no tóxica"… */
const NEGATED = /\b(no|non|not|nada)[\s-]+(es\s+|is\s+|son\s+|are\s+)?(t[oó]xic|toxic|venenos|poison)/i
const TOXIC = /(t[oó]xic|toxic|venenos|poison)/i

/**
 * Pet toxicity: structured flag when present, else parsed from the `toxicity` text of older
 * cached profiles — either our own format ("Mascotas: Tóxica" / "Pets: Toxic") or free text
 * written by the AI enrichment ("Mildly toxic if ingested…"). Free text errs on the side of
 * caution: any non-negated mention of toxicity counts. null = unknown.
 */
export function petToxicity(profile: Pick<SpeciesProfile, 'toxicity' | 'toxicToPets'> | null | undefined): boolean | null {
  if (!profile) return null
  if (typeof profile.toxicToPets === 'boolean') return profile.toxicToPets
  const text = profile.toxicity ?? ''
  for (const locale of LOCALES) {
    // Check "non-toxic" first: "No tóxica" contains "tóxica"
    if (text.includes(translate(locale, 'species.pets', { value: translate(locale, 'species.nonToxic') }))) return false
    if (text.includes(translate(locale, 'species.pets', { value: translate(locale, 'species.toxic') }))) return true
  }
  if (NEGATED.test(text)) return false
  if (TOXIC.test(text)) return true
  return null
}
