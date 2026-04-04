import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

/**
 * One-time seed for hosted (e.g. Vercel) where `npx prisma db seed` cannot reach the DB.
 * Set SEED_SECRET in the host env, then POST with header `x-seed-secret: <value>`.
 * Remove or rotate the secret after use.
 */
export async function POST(req: Request) {
  const secret = process.env.SEED_SECRET
  if (!secret?.trim()) {
    return NextResponse.json(
      {
        error:
          'SEED_SECRET is not set. Add it in Vercel → Environment Variables, redeploy, then try again.',
      },
      { status: 503 }
    )
  }

  let body: { secret?: string } = {}
  try {
    body = (await req.json()) as { secret?: string }
  } catch {
    /* optional body */
  }
  const provided =
    req.headers.get('x-seed-secret')?.trim() ||
    body.secret?.trim() ||
    new URL(req.url).searchParams.get('secret')?.trim()

  if (provided !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const count = await prisma.scenario.count()
  if (count > 0) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      message: 'Scenarios already exist.',
    })
  }

  await prisma.scenario.create({
    data: {
      name: 'Base List',
      isDefault: true,
    },
  })

  return NextResponse.json({
    ok: true,
    message: 'Default scenario created. Refresh the dashboard.',
  })
}
