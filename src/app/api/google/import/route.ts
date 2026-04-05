import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { z } from 'zod'

import { createOAuth2Client, OAUTH_ID } from '@/lib/google-oauth'
import { normalizeSpreadsheetId } from '@/lib/google-sheet-id'
import { parseHeaderRow, rowToGuest } from '@/lib/google-sheet-import'
import { resolveScenarioForImport } from '@/lib/data/scenarios'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

const bodySchema = z.object({
  spreadsheetId: z.string().min(1),
  range: z.string().min(1).optional().default('Sheet1!A1:Z500'),
  scenarioId: z.string().min(1),
})

export async function POST(req: Request) {
  const json = await req.json()
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const { spreadsheetId: rawSpreadsheetId, range, scenarioId } = parsed.data
  const spreadsheetId = normalizeSpreadsheetId(rawSpreadsheetId)
  if (!spreadsheetId) {
    return NextResponse.json(
      { error: 'Invalid spreadsheet ID or URL' },
      { status: 400 }
    )
  }

  const scenario = await resolveScenarioForImport(scenarioId)
  const resolvedScenarioId = scenario.id

  const cred = await prisma.oAuthCredential.findUnique({
    where: { id: OAUTH_ID },
  })
  if (!cred?.refreshToken) {
    return NextResponse.json(
      { error: 'Google not connected — open /api/google/auth first' },
      { status: 401 }
    )
  }

  const oauth2 = createOAuth2Client()
  oauth2.setCredentials({ refresh_token: cred.refreshToken })
  const sheets = google.sheets({ version: 'v4', auth: oauth2 })

  let values: string[][] = []
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    })
    values = (res.data.values as string[][]) ?? []
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'sheets_error'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  if (values.length < 2) {
    return NextResponse.json(
      { error: 'Need a header row plus at least one data row' },
      { status: 400 }
    )
  }

  const headerMap = parseHeaderRow(values[0] ?? [])
  let imported = 0
  const errors: string[] = []

  for (let i = 1; i < values.length; i++) {
    const row = values[i] ?? []
    const guestData = rowToGuest(row, headerMap)
    if (!guestData) continue
    try {
      const guest = await prisma.guest.create({
        data: {
          firstName: guestData.firstName,
          lastName: guestData.lastName,
          category: guestData.category,
          side: guestData.side,
          manualPriority: guestData.manualPriority,
          priorityScore: 0,
          notes: guestData.notes,
          tags: guestData.tags,
        },
      })
      await prisma.scenarioGuest.upsert({
        where: {
          scenarioId_guestId: {
            scenarioId: resolvedScenarioId,
            guestId: guest.id,
          },
        },
        create: {
          scenarioId: resolvedScenarioId,
          guestId: guest.id,
          invited: false,
        },
        update: {},
      })
      imported += 1
    } catch (e) {
      errors.push(
        `Row ${i + 1}: ${e instanceof Error ? e.message : 'create failed'}`
      )
    }
  }

  return NextResponse.json({ imported, errors, rowCount: values.length - 1 })
}
