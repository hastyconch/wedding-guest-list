import { NextResponse } from 'next/server'
import { z } from 'zod'

import {
  GuestCategory,
  GuestSide,
  ManualPriority,
} from '@/generated/prisma/enums'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

const patchBody = z
  .object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    category: z
      .enum(['IMMEDIATE_FAMILY', 'FAMILY_FRIENDS', 'FRIENDS', 'PLUS_ONE'])
      .optional(),
    side: z.enum(['RIA', 'SUNNY', 'BOTH']).optional(),
    manualPriority: z
      .enum(['MUST_INVITE', 'NICE_TO_HAVE', 'CUT_IF_NEEDED'])
      .optional(),
    priorityScore: z.number().optional(),
    groupId: z.string().nullable().optional(),
    isPlusOne: z.boolean().optional(),
    linkedGuestId: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    tags: z.string().nullable().optional(),
  })
  .strict()

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params
  const json = await req.json()
  const parsed = patchBody.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const d = parsed.data
  const guest = await prisma.guest.update({
    where: { id },
    data: {
      ...(d.firstName !== undefined ? { firstName: d.firstName } : {}),
      ...(d.lastName !== undefined ? { lastName: d.lastName } : {}),
      ...(d.category !== undefined ? { category: d.category as GuestCategory } : {}),
      ...(d.side !== undefined ? { side: d.side as GuestSide } : {}),
      ...(d.manualPriority !== undefined
        ? { manualPriority: d.manualPriority as ManualPriority }
        : {}),
      ...(d.priorityScore !== undefined ? { priorityScore: d.priorityScore } : {}),
      ...(d.groupId !== undefined ? { groupId: d.groupId } : {}),
      ...(d.isPlusOne !== undefined ? { isPlusOne: d.isPlusOne } : {}),
      ...(d.linkedGuestId !== undefined ? { linkedGuestId: d.linkedGuestId } : {}),
      ...(d.notes !== undefined ? { notes: d.notes } : {}),
      ...(d.tags !== undefined ? { tags: d.tags } : {}),
    },
  })
  return NextResponse.json({ guest })
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params
  await prisma.guest.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
