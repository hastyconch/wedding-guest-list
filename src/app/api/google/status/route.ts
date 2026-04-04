import { NextResponse } from 'next/server'

import { OAUTH_ID } from '@/lib/google-oauth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET() {
  const row = await prisma.oAuthCredential.findUnique({
    where: { id: OAUTH_ID },
  })
  return NextResponse.json({ connected: !!row?.refreshToken })
}
