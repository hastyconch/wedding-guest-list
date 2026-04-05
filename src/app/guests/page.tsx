import { GuestsFilteredList } from '@/components/guests-filtered-list'
import { listGuestsForScenario } from '@/lib/data/guests'
import { ensureDefaultScenario } from '@/lib/data/scenarios'
import { CAPACITY, partnerWarnings, sideImbalanceWarning } from '@/lib/warnings'

export const dynamic = 'force-dynamic'

export default async function GuestsPage() {
  let scenario: Awaited<ReturnType<typeof ensureDefaultScenario>>
  let guests: Awaited<ReturnType<typeof listGuestsForScenario>>
  try {
    scenario = await ensureDefaultScenario()
    guests = await listGuestsForScenario(scenario.id)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return (
      <div className="rounded-lg border border-[#f23f43]/30 bg-[#f23f43]/10 p-6 text-sm text-[#dbdee1]">
        <p className="font-semibold">Could not load guests</p>
        <p className="mt-2 text-[#949ba4]">{msg}</p>
        <p className="mt-4 text-xs text-[#6d737a]">
          Set <code className="rounded bg-[#1e1f22] px-1.5 py-0.5">DATABASE_URL</code> to PostgreSQL and run{' '}
          <code className="rounded bg-[#1e1f22] px-1.5 py-0.5">npx prisma migrate dev</code>.
        </p>
      </div>
    )
  }

  const invitedIds = new Set(guests.filter((g) => g.invited).map((g) => g.id))
  const invitedCount = invitedIds.size
  const partnerWarn = partnerWarnings(guests, invitedIds)
  const sideWarn = sideImbalanceWarning(guests, invitedIds)

  return (
    <div className="space-y-5">
      <div className="border-b border-white/8 pb-4">
        <div className="flex items-center gap-2 text-[#949ba4]">
          <span className="text-xl font-light text-[#6d737a]">#</span>
          <h1 className="text-xl font-bold tracking-tight text-[#dbdee1]">
            guests
          </h1>
        </div>
        <p className="mt-1 text-sm text-[#949ba4]">
          {scenario.name} ·{' '}
          <span className="tabular-nums text-[#dbdee1]">
            {invitedCount} / {CAPACITY}
          </span>{' '}
          invited
        </p>
      </div>

      {(partnerWarn.length > 0 || sideWarn) && (
        <div
          className="rounded-lg border border-[#fee75c]/30 bg-[#fee75c]/10 px-4 py-3 text-sm"
          role="status"
        >
          <p className="font-semibold text-[#fee75c]">Warnings</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-[#dbdee1]/90">
            {partnerWarn.map((w) => (
              <li key={w}>{w}</li>
            ))}
            {sideWarn ? <li>{sideWarn}</li> : null}
          </ul>
        </div>
      )}

      <GuestsFilteredList
        scenarioId={scenario.id}
        guests={guests.map((g) => ({
          id: g.id,
          firstName: g.firstName,
          lastName: g.lastName,
          category: g.category,
          side: g.side,
          manualPriority: g.manualPriority,
          invited: g.invited,
          notes: g.notes,
          tags: g.tags,
          groupId: g.groupId,
          groupLabel: g.group?.label ?? null,
          updatedAt: g.updatedAt.toISOString(),
        }))}
      />
    </div>
  )
}
