/** Human-readable labels for Prisma enum strings in the guest UI. */
export function formatGuestEnum(s: string) {
  if (s === 'PLUS_ONE') return 'Plus 1'
  return s
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ')
}

/** Split comma-separated tags for chips and search. */
export function parseGuestTags(tags: string | null | undefined): string[] {
  if (!tags?.trim()) return []
  return tags
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
}

/** Normalize tags for PATCH (comma-separated, trimmed). */
export function normalizeGuestTagsInput(raw: string): string | null {
  const parts = parseGuestTags(raw)
  return parts.length > 0 ? parts.join(', ') : null
}
