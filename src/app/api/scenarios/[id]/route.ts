import { NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

const patchBody = z
  .object({
    name: z.string().min(1).optional(),
    filterPreset: z.string().nullable().optional(),
    isLocked: z.boolean().optional(),
    isDefault: z.boolean().optional(),
  })
  .strict()

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params
  const scenario = await prisma.scenario.findUnique({ where: { id } })
  if (!scenario) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json({ scenario })
}

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
  if (d.isDefault) {
    await prisma.scenario.updateMany({ where: { isDefault: true }, data: { isDefault: false } })
  }
  const scenario = await prisma.scenario.update({
    where: { id },
    data: {
      ...('name' in d && d.name !== undefined ? { name: d.name } : {}),
      ...('filterPreset' in d ? { filterPreset: d.filterPreset } : {}),
      ...('isLocked' in d && d.isLocked !== undefined ? { isLocked: d.isLocked } : {}),
      ...('isDefault' in d && d.isDefault !== undefined ? { isDefault: d.isDefault } : {}),
    },
  })
  return NextResponse.json({ scenario })
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params
  await prisma.scenario.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
