import {
  GuestCategory,
  GuestSide,
} from '@/generated/prisma/enums'
import { prisma } from '@/lib/prisma'

const CATEGORY_ORDER = Object.values(GuestCategory)
const SIDE_ORDER = Object.values(GuestSide)

export type InvitedBreakdown = {
  byCategory: { category: GuestCategory; count: number }[]
  bySide: { side: GuestSide; count: number }[]
  totalInvited: number
}

export async function listGuestsForScenario(scenarioId: string) {
  const [guests, scenarioGuests] = await Promise.all([
    prisma.guest.findMany({
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      include: { group: true },
    }),
    prisma.scenarioGuest.findMany({ where: { scenarioId } }),
  ])
  const invitedMap = new Map(scenarioGuests.map((s) => [s.guestId, s.invited]))
  return guests.map((g) => ({
    ...g,
    invited: invitedMap.get(g.id) ?? false,
  }))
}

export async function countInvitedForScenario(scenarioId: string) {
  return prisma.scenarioGuest.count({
    where: { scenarioId, invited: true },
  })
}

/** Invited guests only — grouped for dashboard charts. */
export async function getInvitedBreakdownForScenario(
  scenarioId: string
): Promise<InvitedBreakdown> {
  const invitedFilter = {
    scenarioGuests: {
      some: { scenarioId, invited: true },
    },
  } as const

  const [catRows, sideRows] = await Promise.all([
    prisma.guest.groupBy({
      by: ['category'],
      where: invitedFilter,
      _count: { _all: true },
    }),
    prisma.guest.groupBy({
      by: ['side'],
      where: invitedFilter,
      _count: { _all: true },
    }),
  ])

  const catMap = new Map(
    catRows.map((r) => [r.category, r._count._all])
  )
  const sideMap = new Map(sideRows.map((r) => [r.side, r._count._all]))

  const byCategory = CATEGORY_ORDER.map((category) => ({
    category,
    count: catMap.get(category) ?? 0,
  })).filter((x) => x.count > 0)

  const bySide = SIDE_ORDER.map((side) => ({
    side,
    count: sideMap.get(side) ?? 0,
  })).filter((x) => x.count > 0)

  const totalInvited = catRows.reduce((s, r) => s + r._count._all, 0)

  return { byCategory, bySide, totalInvited }
}

export type HouseholdStat = {
  groupId: string | null
  label: string
  invited: number
  total: number
}

/** Invited vs total guests per household for the scenario (includes “No household”). */
export async function getHouseholdStatsForScenario(
  scenarioId: string
): Promise<HouseholdStat[]> {
  const rows = await prisma.guest.findMany({
    where: {
      scenarioGuests: { some: { scenarioId } },
    },
    select: {
      groupId: true,
      group: { select: { label: true } },
      scenarioGuests: {
        where: { scenarioId },
        select: { invited: true },
      },
    },
  })

  const map = new Map<
    string | null,
    { label: string; invited: number; total: number }
  >()

  for (const g of rows) {
    const key = g.groupId
    const fallback = key ? 'Household' : 'No household'
    const label = g.group?.label?.trim() || fallback
    const cur = map.get(key) ?? { label, invited: 0, total: 0 }
    cur.total += 1
    if (g.scenarioGuests[0]?.invited) cur.invited += 1
    if (g.group?.label?.trim()) cur.label = g.group.label.trim()
    map.set(key, cur)
  }

  return [...map.entries()]
    .map(([groupId, v]) => ({ groupId, ...v }))
    .sort((a, b) => {
      if (b.invited !== a.invited) return b.invited - a.invited
      if (b.total !== a.total) return b.total - a.total
      return a.label.localeCompare(b.label)
    })
}
