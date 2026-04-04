import { prisma } from '@/lib/prisma'
import { autoFillInvitedIds } from '@/lib/priority'
import { CAPACITY, partnerWarnings, sideImbalanceWarning } from '@/lib/warnings'

export async function duplicateScenario(sourceId: string, name: string) {
  const orig = await prisma.scenario.findUnique({
    where: { id: sourceId },
    include: { scenarioGuests: true },
  })
  if (!orig) {
    throw new Error('Scenario not found')
  }
  return prisma.scenario.create({
    data: {
      name,
      filterPreset: orig.filterPreset,
      isDefault: false,
      scenarioGuests: {
        create: orig.scenarioGuests.map((sg) => ({
          guestId: sg.guestId,
          invited: sg.invited,
        })),
      },
    },
  })
}

export async function runAutoFill(scenarioId: string) {
  const guests = await prisma.guest.findMany()
  const { invitedIds, warnings: priorityWarnings } = autoFillInvitedIds(
    guests,
    CAPACITY
  )
  const set = new Set(invitedIds)

  await prisma.$transaction(
    guests.map((g) =>
      prisma.scenarioGuest.upsert({
        where: {
          scenarioId_guestId: { scenarioId, guestId: g.id },
        },
        create: {
          scenarioId,
          guestId: g.id,
          invited: set.has(g.id),
        },
        update: { invited: set.has(g.id) },
      })
    )
  )

  const allWarnings = [...priorityWarnings]
  allWarnings.push(...partnerWarnings(guests, set))
  const side = sideImbalanceWarning(guests, set)
  if (side) allWarnings.push(side)

  const totalInvited = invitedIds.length
  if (totalInvited > CAPACITY) {
    allWarnings.push(
      `Guest count ${totalInvited} exceeds venue capacity (${CAPACITY}).`
    )
  }

  return { warnings: allWarnings, invitedCount: totalInvited }
}
