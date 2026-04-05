import { NextResponse } from 'next/server'

import { requireAdminImportSession } from '@/lib/admin-import-auth'
import { OAUTH_ID } from '@/lib/google-oauth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET() {
  const denied = await requireAdminImportSession()
  if (denied) return denied

  const row = await prisma.oAuthCredential.findUnique({
    where: { id: OAUTH_ID },
  })
  return NextResponse.json({ connected: !!row?.refreshToken })
}
