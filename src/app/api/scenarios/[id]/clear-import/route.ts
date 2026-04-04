import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

type Ctx = { params: Promise<{ id: string }> }

export async function POST(_req: Request, ctx: Ctx) {
  const { id: scenarioId } = await ctx.params

  const scenario = await prisma.scenario.findUnique({
    where: { id: scenarioId },
    select: { id: true },
  })
  if (!scenario) {
    return NextResponse.json({ error: 'Scenario not found' }, { status: 404 })
  }

  const links = await prisma.scenarioGuest.findMany({
    where: { scenarioId },
    select: { guestId: true },
  })
  const guestIds = [...new Set(links.map((l) => l.guestId))]

  const removedGuests = await prisma.$transaction(async (tx) => {
    await tx.scenarioGuest.deleteMany({ where: { scenarioId } })
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
