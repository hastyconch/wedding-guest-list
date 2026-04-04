import type { GuestCategory, ManualPriority } from '@/generated/prisma/enums'

const CATEGORY_WEIGHT: Record<GuestCategory, number> = {
  IMMEDIATE_FAMILY: 4000,
  FAMILY_FRIENDS: 3000,
  FRIENDS: 2000,
  PLUS_ONE: 1000,
}

const MANUAL_WEIGHT: Record<ManualPriority, number> = {
  MUST_INVITE: 2000,
  NICE_TO_HAVE: 0,
  CUT_IF_NEEDED: -5000,
}

export function computeEffectiveScore(guest: {
  category: GuestCategory
  manualPriority: ManualPriority
  priorityScore: number
}): number {
  return (
    CATEGORY_WEIGHT[guest.category] +
    MANUAL_WEIGHT[guest.manualPriority] +
    guest.priorityScore
  )
}

export function sortGuestsForAutoFill<
  T extends {
    id: string
    category: GuestCategory
    manualPriority: ManualPriority
    priorityScore: number
  },
>(guests: T[]): T[] {
  return [...guests].sort((a, b) => {
    const sa = computeEffectiveScore(a)
    const sb = computeEffectiveScore(b)
    if (sb !== sa) return sb - sa
    return a.id.localeCompare(b.id)
  })
}

/** Must-invite guests always invited; fill remaining slots up to `cap` from sorted non-must guests. */
export function autoFillInvitedIds(
  guests: Array<{
    id: string
    category: GuestCategory
    manualPriority: ManualPriority
    priorityScore: number
  }>,
  cap = 200
): { invitedIds: string[]; warnings: string[] } {
  const warnings: string[] = []
  const must = guests.filter((g) => g.manualPriority === 'MUST_INVITE')
  const nonMust = guests.filter((g) => g.manualPriority !== 'MUST_INVITE')
  const sortedRest = sortGuestsForAutoFill(nonMust)

  const invited = new Set<string>()
  for (const g of must) invited.add(g.id)

  if (must.length > cap) {
    warnings.push(
      `Must Invite list exceeds capacity (${must.length} > ${cap}). All Must Invite guests remain invited.`
    )
  }

  const remainingSlots = Math.max(0, cap - must.length)
  for (let i = 0; i < remainingSlots && i < sortedRest.length; i++) {
    invited.add(sortedRest[i].id)
  }

  return { invitedIds: [...invited], warnings }
}
