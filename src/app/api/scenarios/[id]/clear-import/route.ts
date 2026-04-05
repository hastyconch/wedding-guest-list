import { NextResponse } from 'next/server'

import { resolveScenarioForImport } from '@/lib/data/scenarios'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

type Ctx = { params: Promise<{ id: string }> }

export async function POST(_req: Request, ctx: Ctx) {
  const { id: scenarioId } = await ctx.params

  const scenario = await resolveScenarioForImport(scenarioId)
  const resolvedScenarioId = scenario.id

  const links = await prisma.scenarioGuest.findMany({
    where: { scenarioId: resolvedScenarioId },
    select: { guestId: true },
  })
  const guestIds = [...new Set(links.map((l) => l.guestId))]

  const removedGuests = await prisma.$transaction(async (tx) => {
    await tx.scenarioGuest.deleteMany({ where: { scenarioId: resolvedScenarioId } })
    if (guestIds.length === 0) return 0
    const r = await tx.guest.deleteMany({
      where: {
        id: { in: guestIds },
        scenarioGuests: { none: {} },
      },
    })
    return r.count
  })

  return NextResponse.json({ removedGuests })
}
