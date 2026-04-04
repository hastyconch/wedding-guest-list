import { NextResponse } from 'next/server'
import { z } from 'zod'

import {
  GuestCategory,
  GuestSide,
  ManualPriority,
} from '@/generated/prisma/enums'
import { listGuestsForScenario } from '@/lib/data/guests'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

const createBody = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  category: z.enum(['IMMEDIATE_FAMILY', 'FAMILY_FRIENDS', 'FRIENDS', 'PLUS_ONE']),
  side: z.enum(['RIA', 'SUNNY', 'BOTH']),
  manualPriority: z
    .enum(['MUST_INVITE', 'NICE_TO_HAVE', 'CUT_IF_NEEDED'])
    .optional(),
  priorityScore: z.number().optional(),
  groupId: z.string().nullable().optional(),
  isPlusOne: z.boolean().optional(),
  linkedGuestId: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  tags: z.string().nullable().optional(),
  scenarioId: z.string().min(1),
})

export async function GET(req: Request) {
  const scenarioId = new URL(req.url).searchParams.get('scenarioId')
  if (!scenarioId) {
    return NextResponse.json(
      { error: 'Missing scenarioId query parameter' },
      { status: 400 }
    )
  }
  const guests = await listGuestsForScenario(scenarioId)
  return NextResponse.json({ guests })
}

export async function POST(req: Request) {
  const json = await req.json()
  const parsed = createBody.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const d = parsed.data
  const guest = await prisma.guest.create({
    data: {
      firstName: d.firstName,
      lastName: d.lastName,
      category: d.category as GuestCategory,
      side: d.side as GuestSide,
      manualPriority: (d.manualPriority ?? 'NICE_TO_HAVE') as ManualPriority,
      priorityScore: d.priorityScore ?? 0,
      groupId: d.groupId ?? undefined,
      isPlusOne: d.isPlusOne ?? false,
      linkedGuestId: d.linkedGuestId ?? undefined,
      notes: d.notes ?? undefined,
      tags: d.tags ?? undefined,
    },
  })

  await prisma.scenarioGuest.upsert({
    where: {
      scenarioId_guestId: { scenarioId: d.scenarioId, guestId: guest.id },
    },
    create: { scenarioId: d.scenarioId, guestId: guest.id, invited: false },
    update: {},
  })

  return NextResponse.json({ guest })
}
