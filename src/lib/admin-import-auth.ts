import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

/** HttpOnly session cookie for Google Sheets admin UI + APIs. */
export const ADMIN_IMPORT_COOKIE = 'wedding_admin_import'

const SESSION_MS = 7 * 24 * 60 * 60 * 1000

function signingSecret(): string {
  const explicit = process.env.ADMIN_IMPORT_SECRET?.trim()
  if (explicit) return explicit
  const pw = process.env.ADMIN_IMPORT_PASSWORD?.trim()
  if (pw) {
    return createHmac('sha256', pw).update('wedding-admin-import-cookie').digest('hex')
  }
  return 'dev-only-insecure-set-admin-import-password'
}

export function createAdminImportSessionToken(): string {
  const exp = Date.now() + SESSION_MS
  const payload = JSON.stringify({ exp })
  const sig = createHmac('sha256', signingSecret()).update(payload).digest('hex')
  return Buffer.from(JSON.stringify({ p: payload, s: sig }), 'utf8').toString(
    'base64url'
  )
}

export function verifyAdminImportSessionToken(token: string): boolean {
  try {
    const { p, s } = JSON.parse(
      Buffer.from(token, 'base64url').toString('utf8')
    ) as { p: string; s: string }
    const expected = createHmac('sha256', signingSecret()).update(p).digest('hex')
    if (s.length !== expected.length) return false
    const a = Buffer.from(s, 'hex')
    const b = Buffer.from(expected, 'hex')
    if (a.length !== b.length) return false
    if (!timingSafeEqual(a, b)) return false
    const { exp } = JSON.parse(p) as { exp: number }
    return typeof exp === 'number' && exp > Date.now()
  } catch {
    return false
  }
}

function sha256Utf8(s: string): Buffer {
  return createHash('sha256').update(s, 'utf8').digest()
}

/** Constant-time compare of two secrets (hashed). */
export function adminImportPasswordMatches(provided: string): boolean {
  const expected = process.env.ADMIN_IMPORT_PASSWORD?.trim()
  if (!expected) return false
  const a = sha256Utf8(provided)
  const b = sha256Utf8(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

export function adminImportUsernameMatches(provided: string): boolean {
  const expected = (
    process.env.ADMIN_IMPORT_USER?.trim() || 'admin'
  ).toLowerCase()
  return provided.trim().toLowerCase() === expected
}

export async function hasAdminImportSession(): Promise<boolean> {
  const store = await cookies()
  const token = store.get(ADMIN_IMPORT_COOKIE)?.value
  return !!token && verifyAdminImportSessionToken(token)
}

/** Use in Route Handlers: returns 401 JSON response if not authenticated. */
export async function requireAdminImportSession(): Promise<NextResponse | null> {
  const store = await cookies()
  const token = store.get(ADMIN_IMPORT_COOKIE)?.value
  if (!token || !verifyAdminImportSessionToken(token)) {
    return NextResponse.json(
      { error: 'Unauthorized — sign in on /admin/import' },
      { status: 401 }
    )
  }
  return null
}

export function setAdminImportSessionCookie(res: NextResponse): void {
  res.cookies.set(ADMIN_IMPORT_COOKIE, createAdminImportSessionToken(), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: Math.floor(SESSION_MS / 1000),
  })
}

export function clearAdminImportSessionCookie(res: NextResponse): void {
  res.cookies.set(ADMIN_IMPORT_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
  })
}
