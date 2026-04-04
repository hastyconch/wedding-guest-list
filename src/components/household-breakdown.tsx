import type { HouseholdStat } from '@/lib/data/guests'

type Props = { stats: HouseholdStat[] }

export function HouseholdBreakdownPanel({ stats }: Props) {
  if (stats.length === 0) {
    return (
      <div className="rounded-lg border border-white/8 bg-[#2b2d31] p-4 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#949ba4]">
          Households
        </p>
        <p className="mt-2 text-sm text-[#949ba4]">No guests in this scenario yet.</p>
      </div>
    )
  }

  const maxInvited = Math.max(...stats.map((s) => s.invited), 1)

  return (
    <div className="rounded-lg border border-white/8 bg-[#2b2d31] p-4 shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-wider text-[#949ba4]">
        Households
      </p>
      <p className="mt-1 text-xs text-[#6d737a]">
        Invited vs total in this scenario, by group label.
      </p>
      <div className="mt-4 space-y-3">
        {stats.map((s) => {
          const barPct = Math.round((s.invited / maxInvited) * 100)
          return (
            <div key={s.groupId ?? 'none'} className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-2 text-xs">
                <span className="min-w-0 truncate font-medium text-[#dbdee1]">
                  {s.label}
                </span>
                <span className="shrink-0 tabular-nums text-[#b5bac1]">
                  <span className="text-[#dbdee1]">{s.invited}</span>
                  <span className="text-[#6d737a]"> / {s.total}</span>
                  <span className="text-[#6d737a]"> invited</span>
                </span>
              </div>
              <div
                className="h-2 overflow-hidden rounded-full bg-[#1e1f22]"
                role="img"
                aria-label={`${s.label}: ${s.invited} invited of ${s.total} in household`}
              >
                <div
                  className="h-full rounded-full bg-[#23a55a]/90"
                  style={{ width: `${barPct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
