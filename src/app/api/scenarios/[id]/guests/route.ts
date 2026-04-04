import { NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

const patchBody = z.object({
  guestId: z.string().min(1),
  invited: z.boolean(),
})

const bulkBody = z.object({
  guestIds: z
    .array(z.string().min(1))
    .min(1)
    .max(2000)
    .transform((ids) => [...new Set(ids)]),
  invited: z.boolean(),
})

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id: scenarioId } = await ctx.params
  const json = await req.json()
  const parsed = bulkBody.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const { guestIds, invited } = parsed.data

  const scenario = await prisma.scenario.findUnique({
    where: { id: scenarioId },
    select: { id: true },
  })
  if (!scenario) {
    return NextResponse.json({ error: 'Scenario not found' }, { status: 404 })
  }

  const result = await prisma.scenarioGuest.updateMany({
    where: {
      scenarioId,
      guestId: { in: guestIds },
    },
    data: { invited },
  })

  return NextResponse.json({ updated: result.count, requested: guestIds.length })
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id: scenarioId } = await ctx.params
  const json = await req.json()
  const parsed = patchBody.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const { guestId, invited } = parsed.data

  await prisma.scenarioGuest.upsert({
    where: {
      scenarioId_guestId: { scenarioId, guestId },
    },
    create: { scenarioId, guestId, invited },
    update: { invited },
  })

  return NextResponse.json({ ok: true })
}
