import type { GuestCategory, GuestSide } from '@/generated/prisma/enums'
import type { InvitedBreakdown } from '@/lib/data/guests'
import { formatGuestEnum } from '@/lib/guest-display'
import { cn } from '@/lib/utils'

type Props = { breakdown: InvitedBreakdown }

const categoryBar: Record<GuestCategory, string> = {
  IMMEDIATE_FAMILY: 'bg-[#ed4245]/90',
  FAMILY_FRIENDS: 'bg-[#fee75c]/85',
  FRIENDS: 'bg-[#5865f2]',
  PLUS_ONE: 'bg-[#9b84ec]/90',
}

const sideBar: Record<GuestSide, string> = {
  RIA: 'bg-[#5865f2]',
  SUNNY: 'bg-[#23a55a]',
  BOTH: 'bg-[#6d737a]',
}

function BarBlock({
  label,
  count,
  total,
  barClass,
}: {
  label: string
  count: number
  total: number
  barClass: string
}) {
  const pct = total > 0 ? Math.round((count / total) * 1000) / 10 : 0
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="min-w-0 truncate text-[#b5bac1]">{label}</span>
        <span className="shrink-0 tabular-nums text-[#dbdee1]">
          {count}
          <span className="text-[#6d737a]"> · {pct}%</span>
        </span>
      </div>
      <div
        className="h-2.5 overflow-hidden rounded-full bg-[#1e1f22]"
        role="img"
        aria-label={`${label}: ${count} invited, ${pct} percent of invited guests`}
      >
        <div
          className={cn('h-full min-w-0 rounded-full', barClass)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export function InvitedBreakdownPanel({ breakdown }: Props) {
  const { byCategory, bySide, totalInvited } = breakdown

  if (totalInvited === 0) {
    return (
      <div className="rounded-lg border border-white/8 bg-[#2b2d31] p-4 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#949ba4]">
          Invited breakdown
        </p>
        <p className="mt-2 text-sm text-[#949ba4]">
          No invited guests yet — toggle invites on the guests page to see category
          and side splits here.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-white/8 bg-[#2b2d31] p-4 shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-wider text-[#949ba4]">
        Invited breakdown
      </p>
      <p className="mt-1 text-xs text-[#6d737a]">
        Share of invited guests ({totalInvited} total), by category and side.
      </p>
      <div className="mt-4 grid gap-6 md:grid-cols-2 md:gap-8">
        <div>
          <p className="mb-3 text-xs font-semibold text-[#dbdee1]">By category</p>
          <div className="space-y-4">
            {byCategory.map(({ category, count }) => (
              <BarBlock
                key={category}
                label={formatGuestEnum(category)}
                count={count}
                total={totalInvited}
                barClass={categoryBar[category]}
              />
            ))}
          </div>
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold text-[#dbdee1]">By side</p>
          <div className="space-y-4">
            {bySide.map(({ side, count }) => (
              <BarBlock
                key={side}
                label={formatGuestEnum(side)}
                count={count}
                total={totalInvited}
                barClass={sideBar[side]}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
