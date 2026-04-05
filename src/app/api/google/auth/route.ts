import { NextResponse } from 'next/server'

import { requireAdminImportSession } from '@/lib/admin-import-auth'
import { GOOGLE_SCOPES, createOAuth2Client } from '@/lib/google-oauth'

export const runtime = 'nodejs'

/** Starts Google OAuth — browser hits this route, then redirects to Google consent. */
export async function GET() {
  const denied = await requireAdminImportSession()
  if (denied) return denied

  try {
    const oauth2 = createOAuth2Client()
    const url = oauth2.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [...GOOGLE_SCOPES],
    })
    return NextResponse.redirect(url)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'OAuth setup error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
