import { NextResponse } from 'next/server'

import { OAUTH_ID, createOAuth2Client, getAppBaseUrl } from '@/lib/google-oauth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

/**
 * Google redirects here with ?code=... — exchange for tokens and store refresh token.
 * Add this exact URL to Google Cloud → OAuth client → Authorized redirect URIs:
 *   http://localhost:3000/api/google/callback
 */
export async function GET(req: Request) {
  const base = getAppBaseUrl()
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const err = searchParams.get('error')

  if (err) {
    return NextResponse.redirect(
      `${base}/?google=error&message=${encodeURIComponent(err)}`
    )
  }
  if (!code) {
    return NextResponse.redirect(`${base}/?google=error&message=missing_code`)
  }

  try {
    const oauth2 = createOAuth2Client()
    const { tokens } = await oauth2.getToken(code)
    const refresh = tokens.refresh_token
    if (refresh) {
      await prisma.oAuthCredential.upsert({
        where: { id: OAUTH_ID },
        create: { id: OAUTH_ID, refreshToken: refresh },
        update: { refreshToken: refresh },
      })
    } else {
      return NextResponse.redirect(
        `${base}/?google=error&message=${encodeURIComponent(
          'No refresh token — remove app access in Google Account → Security → Third-party access, then connect again'
        )}`
      )
    }
    return NextResponse.redirect(`${base}/?google=connected`)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'token_exchange_failed'
    return NextResponse.redirect(
      `${base}/?google=error&message=${encodeURIComponent(msg)}`
    )
  }
}
