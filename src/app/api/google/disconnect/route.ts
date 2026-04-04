import { NextResponse } from 'next/server'

import { OAUTH_ID } from '@/lib/google-oauth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function POST() {
  await prisma.oAuthCredential.deleteMany({ where: { id: OAUTH_ID } })
  return NextResponse.json({ ok: true })
}
