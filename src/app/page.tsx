import Link from 'next/link'
import { Suspense } from 'react'

import { AutoFillButton } from '@/components/auto-fill-button'
import { GoogleOAuthBanner } from '@/components/google-oauth-banner'
import { GoogleSheetsImport } from '@/components/google-sheets-import'
import { HouseholdBreakdownPanel } from '@/components/household-breakdown'
import { InvitedBreakdownPanel } from '@/components/invited-breakdown'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  countInvitedForScenario,
  getHouseholdStatsForScenario,
  getInvitedBreakdownForScenario,
} from '@/lib/data/guests'
import { getDefaultScenario } from '@/lib/data/scenarios'
import { CAPACITY } from '@/lib/warnings'

export const dynamic = 'force-dynamic'

const secondaryBtnClass =
  'inline-flex min-h-10 items-center justify-center rounded-md border border-white/8 bg-[#2b2d31] px-4 text-sm font-medium text-[#dbdee1] shadow-sm transition-colors hover:bg-[#35373c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5865f2]'

export default async function Home() {
  let scenario: Awaited<ReturnType<typeof getDefaultScenario>>
  let invited: number
  let breakdown: Awaited<ReturnType<typeof getInvitedBreakdownForScenario>>
  let householdStats: Awaited<ReturnType<typeof getHouseholdStatsForScenario>>
  try {
    scenario = await getDefaultScenario()
    if (!scenario) {
      return (
        <div className="rounded-lg border border-white/10 bg-[#2b2d31] p-6 shadow-sm">
          <p className="font-semibold text-[#dbdee1]">No scenarios yet.</p>
          <p className="mt-2 text-sm text-[#949ba4]">
            Locally: run{' '}
            <code className="rounded bg-[#1e1f22] px-1.5 py-0.5 text-xs text-[#dbdee1]">
              npx prisma db seed
            </code>{' '}
            then refresh. On Vercel: set{' '}
            <code className="rounded bg-[#1e1f22] px-1.5 py-0.5 text-xs">SEED_SECRET</code>{' '}
            in project env, redeploy, then{' '}
            <code className="rounded bg-[#1e1f22] px-1.5 py-0.5 text-xs">
              POST /api/admin/seed
            </code>{' '}
            with header{' '}
            <code className="rounded bg-[#1e1f22] px-1.5 py-0.5 text-xs">
              x-seed-secret
            </code>
            .
          </p>
        </div>
      )
    }
    ;[invited, breakdown, householdStats] = await Promise.all([
      countInvitedForScenario(scenario.id),
      getInvitedBreakdownForScenario(scenario.id),
      getHouseholdStatsForScenario(scenario.id),
    ])
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return (
      <div className="rounded-lg border border-[#f23f43]/30 bg-[#f23f43]/10 p-6 text-sm">
        <p className="font-semibold text-[#dbdee1]">Could not load the dashboard</p>
        <p className="mt-2 text-[#949ba4]">{msg}</p>
        <p className="mt-4 text-xs text-[#6d737a]">
          From the project folder, run{' '}
          <code className="rounded bg-[#1e1f22] px-1.5 py-0.5 text-[#dbdee1]">
            npx prisma migrate dev
          </code>{' '}
          then{' '}
          <code className="rounded bg-[#1e1f22] px-1.5 py-0.5 text-[#dbdee1]">
            npx prisma db seed
          </code>
          . Ensure <code className="rounded bg-[#1e1f22] px-1.5 py-0.5">DATABASE_URL</code>{' '}
          in <code className="rounded bg-[#1e1f22] px-1.5 py-0.5">.env</code> points at your SQLite file.
        </p>
      </div>
    )
  }
  const over = invited > CAPACITY
  const pct = Math.min(100, (invited / CAPACITY) * 100)

  return (
    <div className="space-y-6">
      <Suspense fallback={null}>
        <GoogleOAuthBanner />
      </Suspense>

      {/* Channel-style header */}
      <div className="border-b border-white/8 pb-4">
        <div className="flex items-center gap-2 text-[#949ba4]">
          <span className="text-xl font-light text-[#6d737a]">#</span>
          <h1 className="text-xl font-bold tracking-tight text-[#dbdee1]">
            dashboard
          </h1>
        </div>
        <p className="mt-1 text-sm text-[#949ba4]">
          Scenario:{' '}
          <span className="font-medium text-[#dbdee1]">{scenario.name}</span>
          {scenario.isLocked ? (
            <span className="ml-2 rounded bg-[#3f4248] px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-[#949ba4]">
              Locked
            </span>
          ) : null}
        </p>
      </div>

      {/* Capacity panel — Discord “status” card */}
      <div className="rounded-lg border border-white/8 bg-[#2b2d31] p-4 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#949ba4]">
              Ceremony capacity
            </p>
            <p className="mt-1 text-3xl font-semibold tabular-nums text-[#dbdee1]">
              {invited}{' '}
              <span className="text-lg font-normal text-[#6d737a]">/</span>{' '}
              {CAPACITY}
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#1e1f22]">
              <div
                className={`h-full rounded-full transition-all ${
                  over ? 'bg-[#f23f43]' : 'bg-[#5865f2]'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
            {over ? (
              <p className="mt-2 text-sm font-medium text-[#f23f43]">
                Over capacity — trim or adjust Must Invite.
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <AutoFillButton scenarioId={scenario.id} />
            <Link href="/guests" className={secondaryBtnClass}>
              Manage guests
            </Link>
          </div>
        </div>
      </div>

      <InvitedBreakdownPanel breakdown={breakdown} />

      <HouseholdBreakdownPanel stats={householdStats} />

      <Card className="border-white/8 bg-[#2b2d31] shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-[#dbdee1]">
            Guest list
          </CardTitle>
          <CardDescription className="text-[#949ba4]">
            Toggle invites, categories, and warnings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/guests" className={secondaryBtnClass}>
            Open guests
          </Link>
        </CardContent>
      </Card>

      <GoogleSheetsImport scenarioId={scenario.id} />
    </div>
  )
}
