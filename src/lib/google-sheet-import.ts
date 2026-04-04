import type { GuestCategory, GuestSide, ManualPriority } from '@/generated/prisma/enums'

function norm(s: string): string {
  return (s || '')
    .replace(/^\uFEFF/, '')
    .replace(/\u00a0/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/\//g, '_')
    .replace(/-/g, '_')
    .replace(/\s+/g, '_')
}

/** Map header label → column index */
export function parseHeaderRow(row: string[]): Record<string, number> {
  const map: Record<string, number> = {}
  row.forEach((cell, i) => {
    const key = norm(cell || '')
    if (key) map[key] = i
  })
  return map
}

function col(
  map: Record<string, number>,
  keys: string[]
): number | undefined {
  for (const k of keys) {
    if (k in map) return map[k]
  }
  return undefined
}

function minDefined(
  a: number | undefined,
  b: number | undefined
): number | undefined {
  if (a === undefined) return b
  if (b === undefined) return a
  return Math.min(a, b)
}

/** Strip NBSP / trim — Sheets often hides bad whitespace in cells. */
function cleanCell(s: string | undefined): string {
  return (s ?? '').replace(/\u00a0/g, ' ').trim()
}

const SIDE_HEADER_KEYS = [
  'side',
  'ria_sunny',
  'bride_side',
  'groom_side',
  'whose_side',
  'whos_side',
  'party',
  'ria',
  'sunny',
  'bride_or_groom',
] as const

/** Ceremony column: Y = must invite, blank = nice to have (see parseCeremony). */
const CEREMONY_HEADER_KEYS = ['ceremony'] as const

const OTHER_PRIORITY_HEADER_KEYS = [
  'manual_priority',
  'priority',
  'priority_level',
  'invite_priority',
  'importance',
  'tier',
  'manual',
  'invite',
  'invited',
  'must_invite',
] as const

/**
 * When a column has no header (empty / merged cell), it is absent from `map`.
 * Infer "side" as the only column index between category and priority, or as
 * index 3 in a standard 5-column row (first, last, category, side, priority).
 */
function inferSideColumnIndex(
  map: Record<string, number>,
  row: string[],
  fi: number,
  li: number,
  ci: number | undefined,
  mpi: number | undefined,
  ni: number | undefined
): number | undefined {
  const used = new Set(Object.values(map))
  const unmapped: number[] = []
  for (let i = 0; i < row.length; i++) {
    if (!used.has(i)) unmapped.push(i)
  }
  if (unmapped.length === 0) return undefined
  if (ci !== undefined && mpi !== undefined) {
    const between = unmapped.filter((i) => i > ci && i < mpi)
    if (between.length === 1) return between[0]
  }
  if (ci === undefined && li !== undefined && mpi !== undefined) {
    const between = unmapped.filter((i) => i > li && i < mpi)
    if (between.length === 1) return between[0]
  }
  if (
    unmapped.length === 1 &&
    fi === 0 &&
    li === 1 &&
    ci === 2 &&
    mpi === 4 &&
    unmapped[0] === 3
  ) {
    return 3
  }
  if (
    unmapped.length === 2 &&
    fi === 0 &&
    li === 1 &&
    ci === 2 &&
    unmapped[0] === 3 &&
    unmapped[1] === 4
  ) {
    return 3
  }
  if (ni !== undefined && unmapped.length === 1) {
    const i = unmapped[0]
    if (ci !== undefined && i > ci && i < ni) return i
  }
  return undefined
}

/** Infer priority column when its header is missing (unmapped index after side). */
function inferPriorityColumnIndex(
  map: Record<string, number>,
  row: string[],
  fi: number,
  li: number,
  ci: number | undefined,
  si: number | undefined,
  ni: number | undefined
): number | undefined {
  const used = new Set<number>(Object.values(map))
  if (si !== undefined) used.add(si)
  const unmapped: number[] = []
  for (let i = 0; i < row.length; i++) {
    if (!used.has(i)) unmapped.push(i)
  }
  if (unmapped.length === 0) return undefined
  if (unmapped.length === 1) return unmapped[0]
  if (ni !== undefined) {
    const beforeNotes = unmapped.filter((i) => i < ni)
    if (beforeNotes.length === 1) return beforeNotes[0]
  }
  if (si !== undefined) {
    const afterSide = unmapped.filter((i) => i > si)
    if (afterSide.length === 1) return afterSide[0]
  }
  if (
    unmapped.length === 2 &&
    fi === 0 &&
    li === 1 &&
    ci === 2 &&
    unmapped[0] === 3 &&
    unmapped[1] === 4
  ) {
    return 4
  }
  return undefined
}

function parseCategory(raw: string): GuestCategory {
  const u = raw.trim().toUpperCase().replace(/\s+/g, '_')
  if (u.includes('IMMEDIATE')) return 'IMMEDIATE_FAMILY'
  if (u.includes('FAMILY_FRIEND') || u === 'FAMILY_FRIENDS') {
    return 'FAMILY_FRIENDS'
  }
  if (u === 'FRIENDS' || u === 'FRIEND') return 'FRIENDS'
  if (u.includes('PLUS') || u === 'PLUS_ONE') return 'PLUS_ONE'
  return 'FRIENDS'
}

function parseSide(raw: string): GuestSide {
  const t = cleanCell(raw)
  if (!t) return 'BOTH'
  const u = t.toUpperCase().replace(/\s+/g, '_')
  if (u === 'RIA' || u === 'R' || u === 'BRIDE' || u.startsWith('BRIDE_')) {
    return 'RIA'
  }
  if (u === 'SUNNY' || u === 'S' || u === 'GROOM' || u.startsWith('GROOM_')) {
    return 'SUNNY'
  }
  if (u === 'BOTH' || u === 'B') return 'BOTH'
  if (/\bBRIDE\b/i.test(t)) return 'RIA'
  if (/\bGROOM\b/i.test(t)) return 'SUNNY'
  if (/\bRIA\b/i.test(t)) return 'RIA'
  if (/\bSUNNY\b/i.test(t)) return 'SUNNY'
  return 'BOTH'
}

function parseManual(raw: string | undefined): ManualPriority {
  if (!raw) return 'NICE_TO_HAVE'
  const t = cleanCell(raw)
  if (!t) return 'NICE_TO_HAVE'
  const u = t.toUpperCase().replace(/\s+/g, '_')
  if (u === 'Y' || u === 'YES') return 'MUST_INVITE'
  if (u === 'N' || u === 'NO') return 'NICE_TO_HAVE'
  if (u.includes('MUST') || u === 'MUST_INVITE') return 'MUST_INVITE'
  if (u.includes('CUT')) return 'CUT_IF_NEEDED'
  if (u === 'HIGH' || u === 'P1' || u === '1' || u.includes('HIGHEST')) {
    return 'MUST_INVITE'
  }
  if (u === 'LOW' || u === 'P3' || u === '3' || u.includes('LOWEST')) {
    return 'CUT_IF_NEEDED'
  }
  if (
    u === 'NICE_TO_HAVE' ||
    u === 'MEDIUM' ||
    u === 'P2' ||
    u === '2' ||
    u === 'NICE' ||
    u === 'NORMAL'
  ) {
    return 'NICE_TO_HAVE'
  }
  const n = Number(t.replace(/,/g, '').trim())
  if (Number.isFinite(n)) {
    if (n <= 1) return 'MUST_INVITE'
    if (n >= 3) return 'CUT_IF_NEEDED'
    return 'NICE_TO_HAVE'
  }
  return 'NICE_TO_HAVE'
}

/**
 * Ceremony column — strict rules (no parseManual fallback):
 * - Blank / whitespace-only → nice to have
 * - Y (case-insensitive) → must invite
 * - TRUE → must invite (Google Sheets checkbox export)
 * - YES → must invite (optional spelling)
 * - Anything else (N, -, notes, numbers, etc.) → nice to have
 */
function parseCeremony(raw: string | undefined): ManualPriority {
  const t = cleanCell(raw)
  if (!t) return 'NICE_TO_HAVE'
  const u = t.toUpperCase()
  if (u === 'Y' || u === 'YES' || u === 'TRUE') return 'MUST_INVITE'
  return 'NICE_TO_HAVE'
}

export type ParsedGuestRow = {
  firstName: string
  lastName: string
  category: GuestCategory
  side: GuestSide
  manualPriority: ManualPriority
  notes?: string
  /** Comma-separated tags */
  tags?: string
}

export function rowToGuest(
  row: string[],
  map: Record<string, number>
): ParsedGuestRow | null {
  const fi = col(map, [
    'first_name',
    'firstname',
    'first',
    'given',
  ])
  const li = col(map, ['last_name', 'lastname', 'last', 'surname'])
  const ci = col(map, ['category'])
  const ni = col(map, ['notes', 'note'])
  const ti = col(map, ['tags', 'tag', 'labels', 'audit_tags'])
  const ceremonyIdx = col(map, [...CEREMONY_HEADER_KEYS])
  const priorityIdx = col(map, [...OTHER_PRIORITY_HEADER_KEYS])
  const mpiForInfer = minDefined(ceremonyIdx, priorityIdx)

  let si = col(map, [...SIDE_HEADER_KEYS])
  let mpi = mpiForInfer
  if (fi === undefined || li === undefined) return null
  if (si === undefined) {
    si = inferSideColumnIndex(map, row, fi, li, ci, mpiForInfer, ni)
  }
  if (mpi === undefined) {
    mpi = inferPriorityColumnIndex(map, row, fi, li, ci, si, ni)
  }

  const firstName = (row[fi] ?? '').trim()
  const lastName = (row[li] ?? '').trim()
  if (!firstName && !lastName) return null
  const category = ci !== undefined ? parseCategory(row[ci] ?? '') : 'FRIENDS'
  const side = si !== undefined ? parseSide(row[si] ?? '') : 'BOTH'

  const priorityCellIdx =
    ceremonyIdx !== undefined
      ? ceremonyIdx
      : priorityIdx !== undefined
        ? priorityIdx
        : mpi
  const manualPriority =
    ceremonyIdx !== undefined
      ? parseCeremony(row[ceremonyIdx])
      : parseManual(
          priorityCellIdx !== undefined ? row[priorityCellIdx] : undefined
        )
  const notes =
    ni !== undefined ? (row[ni] ?? '').trim() || undefined : undefined
  const tags =
    ti !== undefined ? (row[ti] ?? '').trim() || undefined : undefined

  return {
    firstName: firstName || '—',
    lastName: lastName || '—',
    category,
    side,
    manualPriority,
    notes,
    tags,
  }
}
