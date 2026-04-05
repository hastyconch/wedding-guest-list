import { NextResponse } from 'next/server'
import { z } from 'zod'

import {
  adminImportPasswordMatches,
  adminImportUsernameMatches,
  setAdminImportSessionCookie,
} from '@/lib/admin-import-auth'

export const runtime = 'nodejs'

const bodySchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})

export async function POST(req: Request) {
  if (!process.env.ADMIN_IMPORT_PASSWORD?.trim()) {
    return NextResponse.json(
      {
        error:
          'ADMIN_IMPORT_PASSWORD is not configured. Set it in .env.local or Vercel.',
      },
      { status: 503 }
    )
  }

  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { username, password } = parsed.data
  if (
    !adminImportUsernameMatches(username) ||
    !adminImportPasswordMatches(password)
  ) {
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  setAdminImportSessionCookie(res)
  return res
}
