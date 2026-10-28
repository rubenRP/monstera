/** Number of avatar tints available (see PLANT_AVATAR_TINTS in PlantAvatar.vue). */
export const PLANT_AVATAR_TINT_COUNT = 6

/** Up to two initials from the plant name: "Ave del paraíso" → "AP", "Costilla" → "CO". */
export function plantInitials(name: string): string {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(w => w.length > 2 || /^\p{Lu}/u.test(w))
  if (!words.length) return name.trim().slice(0, 2).toUpperCase() || '?'
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase()
  return `${words[0]![0]}${words[words.length - 1]![0]}`.toUpperCase()
}

/** Stable tint index for a name, so each plant keeps its colour across screens. */
export function plantAvatarTint(name: string): number {
  let hash = 0
  for (const ch of name.trim().toLowerCase()) {
    hash = (hash * 31 + ch.codePointAt(0)!) >>> 0
  }
  return hash % PLANT_AVATAR_TINT_COUNT
}
