import { NextResponse } from 'next/server'

import { runAutoFill } from '@/lib/data/scenario-actions'

export const runtime = 'nodejs'

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params
  try {
    const result = await runAutoFill(id)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Scenario not found' }, { status: 404 })
  }
}
