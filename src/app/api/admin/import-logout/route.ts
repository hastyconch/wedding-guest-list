import { NextResponse } from 'next/server'

import { clearAdminImportSessionCookie } from '@/lib/admin-import-auth'

export const runtime = 'nodejs'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  clearAdminImportSessionCookie(res)
  return res
}
