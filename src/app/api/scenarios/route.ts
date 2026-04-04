import { NextResponse } from 'next/server'
import { z } from 'zod'

import { listScenarios } from '@/lib/data/scenarios'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

const postBody = z.object({
  name: z.string().min(1),
  filterPreset: z.string().nullable().optional(),
})

export async function GET() {
  const scenarios = await listScenarios()
  return NextResponse.json({ scenarios })
}

export async function POST(req: Request) {
  const json = await req.json()
  const parsed = postBody.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const scenario = await prisma.scenario.create({
    data: {
      name: parsed.data.name,
      filterPreset: parsed.data.filterPreset ?? undefined,
    },
  })

  const guests = await prisma.guest.findMany({ select: { id: true } })
  if (guests.length) {
    await prisma.scenarioGuest.createMany({
      data: guests.map((g) => ({
        scenarioId: scenario.id,
        guestId: g.id,
        invited: false,
      })),
    })
  }

  return NextResponse.json({ scenario })
}
