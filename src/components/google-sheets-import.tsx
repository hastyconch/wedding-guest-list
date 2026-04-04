'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { normalizeSpreadsheetId } from '@/lib/google-sheet-id'

type Props = { scenarioId: string }

export function GoogleSheetsImport({ scenarioId }: Props) {
  const router = useRouter()
  const [connected, setConnected] = useState<boolean | null>(null)
  const [spreadsheetId, setSpreadsheetId] = useState('')
  const [range, setRange] = useState('Sheet1!A1:Z500')
  const [loading, setLoading] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  /** Rich help text only renders after mount so SSR + hydration HTML match (avoids React 19 text-node mismatches). */
  const [helpReady, setHelpReady] = useState(false)

  useEffect(() => {
    setHelpReady(true)
    fetch('/api/google/status')
      .then((r) => r.json())
      .then((d: { connected?: boolean }) => setConnected(!!d.connected))
      .catch(() => setConnected(false))
  }, [])

  async function onImport(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    try {
      const res = await fetch('/api/google/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheetId: normalizeSpreadsheetId(spreadsheetId),
          range: range.trim() || 'Sheet1!A1:Z500',
          scenarioId,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMsg(data.error ?? 'Import failed')
        return
      }
      setMsg(
        `Imported ${data.imported} guest(s).${data.errors?.length ? ` Warnings: ${data.errors.join(' · ')}` : ''}`
      )
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function disconnect() {
    await fetch('/api/google/disconnect', { method: 'POST' })
    setConnected(false)
    setMsg('Disconnected from Google.')
  }

  async function clearImportedGuests() {
    if (
      !confirm(
        'Remove all guests from this scenario in the app? This does not change your Google Sheet. You can import again later.'
      )
    ) {
      return
    }
    setClearing(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/scenarios/${scenarioId}/clear-import`, {
        method: 'POST',
      })
      const data = (await res.json()) as {
        error?: string
        removedGuests?: number
      }
      if (!res.ok) {
        setMsg(data.error ?? 'Could not clear guests')
        return
      }
      setMsg(
        `Removed ${data.removedGuests ?? 0} guest(s) from this scenario.`
      )
      router.refresh()
    } finally {
      setClearing(false)
    }
  }

  return (
    <div className="rounded-lg border border-white/8 bg-[#2b2d31] p-4">
      <p className="text-[11px] font-bold uppercase tracking-wider text-[#949ba4]">
        Google Sheets
      </p>
      <p className="mt-1 text-sm text-[#b5bac1]">
        Connect your Google account, then paste the sheet URL or spreadsheet ID and
        import rows into this scenario.
      </p>

      {connected === null ? (
        <p className="mt-3 text-sm text-[#949ba4]">Checking connection…</p>
      ) : !connected ? (
        <div className="mt-4">
          <a
            href="/api/google/auth"
            className="inline-flex min-h-10 items-center justify-center rounded-md bg-[#5865f2] px-4 text-sm font-semibold text-white hover:bg-[#4752c4]"
          >
            Connect Google
          </a>
          <p className="mt-2 text-xs text-[#949ba4]">
            Uses read-only access to Sheets. Add redirect URI in Google Cloud (see
            README).
          </p>
        </div>
      ) : (
        <form onSubmit={onImport} className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="sheet-id" className="text-[#b5bac1]">
              Sheet URL or ID
            </Label>
            <Input
              id="sheet-id"
              value={spreadsheetId}
              onChange={(e) => setSpreadsheetId(e.target.value)}
              placeholder="Paste full URL or ID (between /d/ and /edit)"
              className="border-white/10 bg-[#1e1f22] text-[#dbdee1] placeholder:text-[#6d737a]"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="range" className="text-[#b5bac1]">
              Range (A1 notation)
            </Label>
            <Input
              id="range"
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="border-white/10 bg-[#1e1f22] text-[#dbdee1]"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#5865f2] font-semibold text-white hover:bg-[#4752c4]"
            >
              {loading ? 'Importing…' : 'Import rows'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-white/10 bg-transparent text-[#b5bac1] hover:bg-[#35373c]"
              onClick={() => void disconnect()}
            >
              Disconnect Google
            </Button>
          </div>
        </form>
      )}

      <div className="mt-4 border-t border-white/8 pt-4">
        <p className="text-xs text-[#949ba4]">
          Clear everyone this scenario had imported or added here (same list as
          Guests). Your Google Sheet is not modified.
        </p>
        <Button
          type="button"
          variant="destructive"
          disabled={clearing}
          className="mt-2 border-[#f23f43]/40 bg-[#f23f43]/15 text-[#f23f43] hover:bg-[#f23f43]/25"
          onClick={() => void clearImportedGuests()}
        >
          {clearing ? 'Clearing…' : 'Clear imported guests'}
        </Button>
      </div>

      {msg ? (
        <p className="mt-3 text-sm text-[#949ba4]" role="status">
          {msg}
        </p>
      ) : null}

      <details className="mt-4 text-xs text-[#6d737a]">
        <summary className="cursor-pointer text-[#949ba4]">Expected columns</summary>
        {helpReady ? (
          <p className="mt-2 leading-relaxed">
            {
              'Row 1 = headers. Required: first_name, last_name. Optional: category, side or ria_sunny (Ria/Sunny), ceremony (Y = must invite, blank = nice to have), priority if no ceremony. No header: order first-last-category-side-ceremony. notes. Aliases: priority_level.'
            }
          </p>
        ) : null}
      </details>
    </div>
  )
}
