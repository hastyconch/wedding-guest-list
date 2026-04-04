import type { Guest } from '@/generated/prisma/client'

export const CAPACITY = 200

export function partnerWarnings(
  guests: Guest[],
  invitedIds: Set<string>
): string[] {
  const byId = new Map(guests.map((g) => [g.id, g]))
  const seen = new Set<string>()
  const out: string[] = []

  for (const g of guests) {
    if (!g.linkedGuestId) continue
    const pairKey = [g.id, g.linkedGuestId].sort().join(':')
    if (seen.has(pairKey)) continue
    seen.add(pairKey)

    const a = g
    const b = byId.get(g.linkedGuestId)
    if (!b) continue

    const ia = invitedIds.has(a.id)
    const ib = invitedIds.has(b.id)
    if (ia !== ib) {
      out.push(
        `Partner mismatch: ${a.firstName} ${a.lastName} and ${b.firstName} ${b.lastName} — one invited, one not.`
      )
    }
  }

  return out
}

export function sideImbalanceWarning(
  guests: Guest[],
  invitedIds: Set<string>,
  threshold = 30
): string | null {
  let ria = 0
  let sunny = 0
  for (const g of guests) {
    if (!invitedIds.has(g.id)) continue
    if (g.side === 'RIA' || g.side === 'BOTH') ria += 1
    if (g.side === 'SUNNY' || g.side === 'BOTH') sunny += 1
  }
  const diff = Math.abs(ria - sunny)
  if (diff > threshold) {
    return `Side imbalance: Ria-side count ~${ria} vs Sunny-side ~${sunny} (difference ${diff}).`
  }
  return null
}
