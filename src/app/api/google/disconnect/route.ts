import { NextResponse } from 'next/server'

import { requireAdminImportSession } from '@/lib/admin-import-auth'
import { OAUTH_ID } from '@/lib/google-oauth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function POST() {
  const denied = await requireAdminImportSession()
  if (denied) return denied

  await prisma.oAuthCredential.deleteMany({ where: { id: OAUTH_ID } })
  return NextResponse.json({ ok: true })
}
