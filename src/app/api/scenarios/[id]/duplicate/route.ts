import { NextResponse } from 'next/server'
import { z } from 'zod'

import { duplicateScenario } from '@/lib/data/scenario-actions'

export const runtime = 'nodejs'

const bodySchema = z.object({ name: z.string().min(1) })

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params
  const json = await req.json().catch(() => ({}))
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  try {
    const scenario = await duplicateScenario(id, parsed.data.name)
    return NextResponse.json({ scenario })
  } catch {
    return NextResponse.json({ error: 'Scenario not found' }, { status: 404 })
  }
}
