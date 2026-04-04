'use client'

import { ChevronDown, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'

import {
  GuestNotesCell,
  GuestTagsCell,
} from '@/components/guest-notes-tags-cell'
import { InviteToggle } from '@/components/invite-toggle'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatGuestEnum, parseGuestTags } from '@/lib/guest-display'
import { cn } from '@/lib/utils'
import {
  GuestCategory,
  GuestSide,
  ManualPriority,
} from '@/generated/prisma/enums'

export type GuestListRow = {
  id: string
  firstName: string
  lastName: string
  category: string
  side: string
  manualPriority: string
  invited: boolean
  notes: string | null
  tags: string | null
  groupId: string | null
  groupLabel: string | null
  updatedAt: string
}

type Props = {
  scenarioId: string
  guests: GuestListRow[]
}

const CATEGORY_OPTIONS = Object.values(GuestCategory)
const SIDE_OPTIONS = Object.values(GuestSide)
const PRIORITY_OPTIONS = Object.values(ManualPriority)

const PRIORITY_ORDER: Record<string, number> = {
  MUST_INVITE: 0,
  NICE_TO_HAVE: 1,
  CUT_IF_NEEDED: 2,
}

const selectClass =
  'h-8 w-full min-w-0 rounded-md border border-white/10 bg-[#1e1f22] px-2 text-sm text-[#dbdee1] outline-none focus-visible:ring-2 focus-visible:ring-[#5865f2]/50'

export type SortKey =
  | 'name'
  | 'household'
  | 'category'
  | 'side'
  | 'priority'
  | 'invited'
  | 'notes'
  | 'tags'
  | 'updated'

type SortDir = 'asc' | 'desc'

/** Desktop table columns (Name is always shown). */
export type ColumnKey =
  | 'household'
  | 'category'
  | 'side'
  | 'priority'
  | 'notes'
  | 'tags'
  | 'updated'
  | 'invited'

export type ColumnVisibility = Record<ColumnKey, boolean>

const DEFAULT_COLUMN_VISIBILITY: ColumnVisibility = {
  household: true,
  category: true,
  side: true,
  priority: true,
  notes: true,
  tags: true,
  updated: true,
  invited: true,
}

const COLUMN_LABELS: Record<ColumnKey, string> = {
  household: 'Household',
  category: 'Category',
  side: 'Side',
  priority: 'Priority',
  notes: 'Notes',
  tags: 'Tags',
  updated: 'Updated',
  invited: 'Invited',
}

function countVisibleColumns(
  vis: ColumnVisibility,
  layout: 'flat' | 'household'
): number {
  let n = 1
  if (layout === 'flat' && vis.household) n++
  if (vis.category) n++
  if (vis.side) n++
  if (vis.priority) n++
  if (vis.notes) n++
  if (vis.tags) n++
  if (vis.updated) n++
  if (vis.invited) n++
  return Math.max(1, n)
}

function householdLabel(g: GuestListRow): string {
  if (g.groupLabel?.trim()) return g.groupLabel.trim()
  if (g.groupId) return 'Household'
  return 'No household'
}

function compareRows(
  a: GuestListRow,
  b: GuestListRow,
  key: SortKey,
  dir: SortDir
): number {
  const m = dir === 'asc' ? 1 : -1
  switch (key) {
    case 'name': {
      const ln = a.lastName.localeCompare(b.lastName, undefined, {
        sensitivity: 'base',
      })
      if (ln !== 0) return ln * m
      return (
        a.firstName.localeCompare(b.firstName, undefined, {
          sensitivity: 'base',
        }) * m
      )
    }
    case 'household': {
      const la = householdLabel(a)
      const lb = householdLabel(b)
      return la.localeCompare(lb, undefined, { sensitivity: 'base' }) * m
    }
    case 'category':
      return a.category.localeCompare(b.category) * m
    case 'side':
      return a.side.localeCompare(b.side) * m
    case 'priority': {
      const pa = PRIORITY_ORDER[a.manualPriority] ?? 99
      const pb = PRIORITY_ORDER[b.manualPriority] ?? 99
      return (pa - pb) * m
    }
    case 'invited': {
      const va = a.invited ? 1 : 0
      const vb = b.invited ? 1 : 0
      return (va - vb) * m
    }
    case 'notes': {
      const na = (a.notes ?? '').trim()
      const nb = (b.notes ?? '').trim()
      return na.localeCompare(nb, undefined, { sensitivity: 'base' }) * m
    }
    case 'tags': {
      const ta = (a.tags ?? '').trim()
      const tb = (b.tags ?? '').trim()
      return ta.localeCompare(tb, undefined, { sensitivity: 'base' }) * m
    }
    case 'updated': {
      return (
        (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) * m
      )
    }
    default:
      return 0
  }
}

function buildHouseholdGroups(sorted: GuestListRow[]) {
  const order: string[] = []
  const map = new Map<
    string,
    { label: string; guests: GuestListRow[] }
  >()
  for (const g of sorted) {
    const key = g.groupId ?? '__none__'
    if (!map.has(key)) {
      order.push(key)
      map.set(key, { label: householdLabel(g), guests: [] })
    }
    map.get(key)!.guests.push(g)
  }
  return order.map((key) => {
    const v = map.get(key)!
    return { key, label: v.label, guests: v.guests }
  })
}

function SortableTh({
  label,
  sortKey,
  activeKey,
  dir,
  onSort,
  className,
}: {
  label: string
  sortKey: SortKey
  activeKey: SortKey
  dir: SortDir
  onSort: (k: SortKey) => void
  className?: string
}) {
  const active = activeKey === sortKey
  return (
    <TableHead
      className={cn(
        'text-[11px] font-bold uppercase tracking-wider text-[#949ba4]',
        className
      )}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          'inline-flex items-center gap-1 rounded px-0.5 text-left hover:text-[#dbdee1]',
          active && 'text-[#dbdee1]'
        )}
      >
        {label}
        <span className="font-normal text-[#6d737a]" aria-hidden>
          {active ? (dir === 'asc' ? '↑' : '↓') : '↕'}
        </span>
      </button>
    </TableHead>
  )
}

export function GuestsFilteredList({ scenarioId, guests }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [side, setSide] = useState('')
  const [priority, setPriority] = useState('')
  const [invited, setInvited] = useState<'all' | 'yes' | 'no'>('all')
  const [notesFilter, setNotesFilter] = useState<'all' | 'yes' | 'no'>('all')
  const [tagFilter, setTagFilter] = useState('')
  const [layout, setLayout] = useState<'flat' | 'household'>('flat')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set())
  const [bulkLoading, setBulkLoading] = useState(false)
  const [columns, setColumns] = useState<ColumnVisibility>(() => ({
    ...DEFAULT_COLUMN_VISIBILITY,
  }))
  const [columnsMenuOpen, setColumnsMenuOpen] = useState(false)
  const [filtersPanelExpanded, setFiltersPanelExpanded] = useState(true)
  const columnsMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!filtersPanelExpanded) setColumnsMenuOpen(false)
  }, [filtersPanelExpanded])

  useEffect(() => {
    if (!columnsMenuOpen) return
    function onDocMouseDown(e: MouseEvent) {
      if (
        columnsMenuRef.current &&
        !columnsMenuRef.current.contains(e.target as Node)
      ) {
        setColumnsMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [columnsMenuOpen])

  const visibleColCount = useMemo(
    () => countVisibleColumns(columns, layout),
    [columns, layout]
  )

  const uniqueTags = useMemo(() => {
    const s = new Set<string>()
    for (const g of guests) {
      for (const t of parseGuestTags(g.tags)) s.add(t)
    }
    return [...s].sort((a, b) => a.localeCompare(b))
  }, [guests])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const tagQ = tagFilter.trim().toLowerCase()
    return guests.filter((g) => {
      if (q) {
        const name = `${g.firstName} ${g.lastName}`.toLowerCase()
        const notes = (g.notes ?? '').toLowerCase()
        const tags = (g.tags ?? '').toLowerCase()
        if (!name.includes(q) && !notes.includes(q) && !tags.includes(q)) {
          return false
        }
      }
      if (category && g.category !== category) return false
      if (side && g.side !== side) return false
      if (priority && g.manualPriority !== priority) return false
      if (invited === 'yes' && !g.invited) return false
      if (invited === 'no' && g.invited) return false
      const hasNotes = !!(g.notes && g.notes.trim())
      if (notesFilter === 'yes' && !hasNotes) return false
      if (notesFilter === 'no' && hasNotes) return false
      if (tagQ) {
        const blob = (g.tags ?? '').toLowerCase()
        if (!blob.includes(tagQ)) return false
      }
      return true
    })
  }, [
    guests,
    search,
    category,
    side,
    priority,
    invited,
    notesFilter,
    tagFilter,
  ])

  const sorted = useMemo(() => {
    const copy = [...filtered]
    copy.sort((a, b) => compareRows(a, b, sortKey, sortDir))
    return copy
  }, [filtered, sortKey, sortDir])

  const householdGroups = useMemo(
    () => buildHouseholdGroups(sorted),
    [sorted]
  )

  function onSort(next: SortKey) {
    if (next === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(next)
      setSortDir('asc')
    }
  }

  function toggleCollapsed(key: string) {
    setCollapsed((prev) => {
      const n = new Set(prev)
      if (n.has(key)) n.delete(key)
      else n.add(key)
      return n
    })
  }

  const hasActiveFilters =
    search.trim() !== '' ||
    category !== '' ||
    side !== '' ||
    priority !== '' ||
    invited !== 'all' ||
    notesFilter !== 'all' ||
    tagFilter.trim() !== ''

  function clearFilters() {
    setSearch('')
    setCategory('')
    setSide('')
    setPriority('')
    setInvited('all')
    setNotesFilter('all')
    setTagFilter('')
  }

  async function postInvites(ids: string[], invitedFlag: boolean) {
    if (ids.length === 0) return
    setBulkLoading(true)
    try {
      const res = await fetch(`/api/scenarios/${scenarioId}/guests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestIds: ids, invited: invitedFlag }),
      })
      if (!res.ok) {
        alert('Could not update invites. Try again.')
        return
      }
      router.refresh()
    } finally {
      setBulkLoading(false)
    }
  }

  async function inviteAllShown() {
    const ids = sorted.map((g) => g.id)
    if (ids.length === 0) return
    const notInvited = sorted.filter((g) => !g.invited).length
    if (
      !confirm(
        `Mark ${ids.length} guest(s) currently shown as invited? (${notInvited} not invited yet.)`
      )
    ) {
      return
    }
    await postInvites(ids, true)
  }

  async function inviteWholeGroup(groupKey: string) {
    const groupId = groupKey === '__none__' ? null : groupKey
    const ids = guests
      .filter((g) => (g.groupId ?? null) === (groupId ?? null))
      .map((g) => g.id)
    if (ids.length === 0) return
    const notInvited = guests.filter(
      (g) => (g.groupId ?? null) === (groupId ?? null) && !g.invited
    ).length
    if (
      !confirm(
        `Invite all ${ids.length} guest(s) in this household? (${notInvited} not invited yet.)`
      )
    ) {
      return
    }
    await postInvites(ids, true)
  }

  function toggleColumn(key: ColumnKey) {
    setColumns((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-white/8 bg-[#2b2d31] p-3">
        <button
          type="button"
          onClick={() => setFiltersPanelExpanded((e) => !e)}
          className="flex w-full items-center justify-between gap-3 rounded-md py-1 text-left transition-colors hover:bg-[#35373c]/40"
          aria-expanded={filtersPanelExpanded}
          aria-controls="guests-filters-panel"
          id="guests-filters-toggle"
        >
          <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#949ba4]">
              Filters & view
            </span>
            {!filtersPanelExpanded ? (
              <span className="text-xs text-[#6d737a]">
                <span className="tabular-nums text-[#b5bac1]">
                  {sorted.length} / {guests.length}
                </span>{' '}
                shown
                {hasActiveFilters ? (
                  <span className="text-[#fee75c]/90"> · filters on</span>
                ) : null}
              </span>
            ) : null}
          </div>
          <ChevronDown
            className={cn(
              'size-5 shrink-0 text-[#949ba4] transition-transform',
              filtersPanelExpanded && 'rotate-180'
            )}
            aria-hidden
          />
        </button>
        {filtersPanelExpanded ? (
          <div id="guests-filters-panel" role="region" aria-labelledby="guests-filters-toggle">
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-1 xl:col-span-2">
            <Label htmlFor="guest-search" className="text-[#b5bac1]">
              Search
            </Label>
            <Input
              id="guest-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, notes, or tags"
              className="border-white/10 bg-[#1e1f22] text-[#dbdee1] placeholder:text-[#6d737a]"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="filter-category" className="text-[#b5bac1]">
              Category
            </Label>
            <select
              id="filter-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={selectClass}
            >
              <option value="">All</option>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {formatGuestEnum(c)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="filter-side" className="text-[#b5bac1]">
              Side
            </Label>
            <select
              id="filter-side"
              value={side}
              onChange={(e) => setSide(e.target.value)}
              className={selectClass}
            >
              <option value="">All</option>
              {SIDE_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {formatGuestEnum(s)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="filter-priority" className="text-[#b5bac1]">
              Priority
            </Label>
            <select
              id="filter-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className={selectClass}
            >
              <option value="">All</option>
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {formatGuestEnum(p)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="filter-invited" className="text-[#b5bac1]">
              Invited
            </Label>
            <select
              id="filter-invited"
              value={invited}
              onChange={(e) =>
                setInvited(e.target.value as 'all' | 'yes' | 'no')
              }
              className={selectClass}
            >
              <option value="all">All</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="filter-notes" className="text-[#b5bac1]">
              Notes
            </Label>
            <select
              id="filter-notes"
              value={notesFilter}
              onChange={(e) =>
                setNotesFilter(e.target.value as 'all' | 'yes' | 'no')
              }
              className={selectClass}
            >
              <option value="all">Any</option>
              <option value="yes">Has notes</option>
              <option value="no">Empty</option>
            </select>
          </div>
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-1 xl:col-span-2">
            <Label htmlFor="filter-tag" className="text-[#b5bac1]">
              Tag contains
            </Label>
            <Input
              id="filter-tag"
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              list="guest-tag-suggestions"
              placeholder="Substring in tags"
              className="border-white/10 bg-[#1e1f22] text-[#dbdee1] placeholder:text-[#6d737a]"
            />
            <datalist id="guest-tag-suggestions">
              {uniqueTags.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </div>
          <div className="space-y-1.5">
            <span className="block text-[#b5bac1] text-sm">Layout</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setLayout('flat')}
                className={cn(
                  'h-8 flex-1 rounded-md border px-2 text-xs font-medium',
                  layout === 'flat'
                    ? 'border-[#5865f2] bg-[#5865f2]/20 text-[#dbdee1]'
                    : 'border-white/10 bg-[#1e1f22] text-[#949ba4]'
                )}
              >
                Flat list
              </button>
              <button
                type="button"
                onClick={() => setLayout('household')}
                className={cn(
                  'h-8 flex-1 rounded-md border px-2 text-xs font-medium',
                  layout === 'household'
                    ? 'border-[#5865f2] bg-[#5865f2]/20 text-[#dbdee1]'
                    : 'border-white/10 bg-[#1e1f22] text-[#949ba4]'
                )}
              >
                By household
              </button>
            </div>
          </div>
          <div
            className="space-y-1.5 sm:col-span-2 lg:col-span-2"
            ref={columnsMenuRef}
          >
            <span className="block text-[#b5bac1] text-sm">Columns</span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setColumnsMenuOpen((o) => !o)}
                className={cn(
                  'flex h-8 w-full min-w-[160px] items-center justify-between gap-2 rounded-md border px-2.5 text-xs font-medium',
                  columnsMenuOpen
                    ? 'border-[#5865f2] bg-[#5865f2]/20 text-[#dbdee1]'
                    : 'border-white/10 bg-[#1e1f22] text-[#949ba4]'
                )}
                aria-expanded={columnsMenuOpen}
                aria-haspopup="listbox"
              >
                <span>Show / hide columns</span>
                <ChevronDown
                  className={cn(
                    'size-4 shrink-0 transition-transform',
                    columnsMenuOpen && 'rotate-180'
                  )}
                />
              </button>
              {columnsMenuOpen ? (
                <div
                  className="absolute left-0 top-full z-30 mt-1 min-w-[240px] rounded-md border border-white/10 bg-[#1e1f22] p-3 shadow-xl"
                  role="listbox"
                  aria-label="Table columns"
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#6d737a]">
                    Desktop table
                  </p>
                  <ul className="mt-2 max-h-[min(60vh,320px)] space-y-2 overflow-y-auto pr-1">
                    {(Object.keys(COLUMN_LABELS) as ColumnKey[]).map((key) => {
                      const disabled =
                        key === 'household' && layout !== 'flat'
                      return (
                        <li key={key}>
                          <label
                            className={cn(
                              'flex cursor-pointer items-center gap-2.5 text-sm text-[#dbdee1]',
                              disabled && 'cursor-not-allowed opacity-50'
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={columns[key]}
                              disabled={disabled}
                              onChange={() => {
                                if (!disabled) toggleColumn(key)
                              }}
                              className="size-4 shrink-0 rounded border-white/20 bg-[#2b2d31] accent-[#5865f2]"
                            />
                            <span>{COLUMN_LABELS[key]}</span>
                            {key === 'household' && layout !== 'flat' ? (
                              <span className="text-[11px] text-[#6d737a]">
                                (flat list only)
                              </span>
                            ) : null}
                          </label>
                        </li>
                      )
                    })}
                  </ul>
                  <button
                    type="button"
                    onClick={() =>
                      setColumns({ ...DEFAULT_COLUMN_VISIBILITY })
                    }
                    className="mt-3 w-full rounded-md border border-white/10 py-1.5 text-xs font-medium text-[#5865f2] transition-colors hover:bg-white/5"
                  >
                    Reset all columns
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
        <div className="mt-3 flex flex-col gap-3 border-t border-white/8 pt-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <p className="text-xs text-[#949ba4]">
            Showing{' '}
            <span className="tabular-nums text-[#dbdee1]">
              {sorted.length}
            </span>
            {' / '}
            <span className="tabular-nums">{guests.length}</span> guests
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              disabled={sorted.length === 0 || bulkLoading}
              className="bg-[#23a55a] font-semibold text-white hover:bg-[#1e8e4a] disabled:opacity-50"
              onClick={() => void inviteAllShown()}
            >
              {bulkLoading ? 'Updating…' : `Invite all shown (${sorted.length})`}
            </Button>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-semibold text-[#5865f2] underline-offset-2 hover:underline"
              >
                Clear filters
              </button>
            ) : null}
          </div>
        </div>
        <p className="mt-2 text-[11px] leading-snug text-[#6d737a]">
          Sort columns in the table header. Use Columns to show or hide fields
          (applies to the table and mobile cards). Household view groups rows
          and adds invite-whole-group per section.
        </p>
          </div>
        ) : null}
      </div>

      {sorted.length === 0 ? (
        <p className="rounded-lg border border-white/8 bg-[#2b2d31] px-4 py-8 text-center text-sm text-[#949ba4]">
          No guests match these filters.
        </p>
      ) : (
        <>
          {/* Mobile */}
          <div className="space-y-4 md:hidden">
            {layout === 'household'
              ? householdGroups.map((hg) => {
                  const isCollapsed = collapsed.has(hg.key)
                  return (
                    <div
                      key={hg.key}
                      className="overflow-hidden rounded-lg border border-white/8 bg-[#2b2d31]"
                    >
                      <div className="flex items-center gap-2 border-b border-white/8 bg-[#1e1f22] px-3 py-2">
                        <button
                          type="button"
                          onClick={() => toggleCollapsed(hg.key)}
                          className="flex min-w-0 flex-1 items-center gap-2 text-left"
                          aria-expanded={!isCollapsed}
                        >
                          {isCollapsed ? (
                            <ChevronRight className="size-4 shrink-0 text-[#949ba4]" />
                          ) : (
                            <ChevronDown className="size-4 shrink-0 text-[#949ba4]" />
                          )}
                          <span className="truncate font-semibold text-[#dbdee1]">
                            {hg.label}
                          </span>
                          <span className="shrink-0 text-xs text-[#6d737a]">
                            ({hg.guests.length})
                          </span>
                        </button>
                        <button
                          type="button"
                          disabled={bulkLoading}
                          onClick={() => void inviteWholeGroup(hg.key)}
                          className="shrink-0 rounded bg-[#23a55a]/20 px-2 py-1 text-[11px] font-semibold text-[#23a55a] hover:bg-[#23a55a]/30 disabled:opacity-50"
                        >
                          Invite group
                        </button>
                      </div>
                      {!isCollapsed ? (
                        <ul className="divide-y divide-white/8">
                          {hg.guests.map((g) => (
                            <GuestMobileRow
                              key={g.id}
                              g={g}
                              scenarioId={scenarioId}
                              vis={columns}
                              layout={layout}
                            />
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  )
                })
              : sorted.map((g) => (
                  <div
                    key={g.id}
                    className="overflow-hidden rounded-lg border border-white/8 bg-[#2b2d31]"
                  >
                    <GuestMobileRow
                      g={g}
                      scenarioId={scenarioId}
                      vis={columns}
                      layout={layout}
                    />
                  </div>
                ))}
          </div>

          {/* Desktop */}
          <div className="hidden overflow-hidden rounded-lg border border-white/8 bg-[#2b2d31] md:block">
            <Table>
              <TableHeader>
                <TableRow className="border-white/8 hover:bg-transparent">
                  <SortableTh
                    label="Name"
                    sortKey="name"
                    activeKey={sortKey}
                    dir={sortDir}
                    onSort={onSort}
                    className="min-w-[140px]"
                  />
                  {layout === 'flat' && columns.household ? (
                    <SortableTh
                      label="Household"
                      sortKey="household"
                      activeKey={sortKey}
                      dir={sortDir}
                      onSort={onSort}
                    />
                  ) : null}
                  {columns.category ? (
                    <SortableTh
                      label="Category"
                      sortKey="category"
                      activeKey={sortKey}
                      dir={sortDir}
                      onSort={onSort}
                    />
                  ) : null}
                  {columns.side ? (
                    <SortableTh
                      label="Side"
                      sortKey="side"
                      activeKey={sortKey}
                      dir={sortDir}
                      onSort={onSort}
                    />
                  ) : null}
                  {columns.priority ? (
                    <SortableTh
                      label="Priority"
                      sortKey="priority"
                      activeKey={sortKey}
                      dir={sortDir}
                      onSort={onSort}
                    />
                  ) : null}
                  {columns.notes ? (
                    <SortableTh
                      label="Notes"
                      sortKey="notes"
                      activeKey={sortKey}
                      dir={sortDir}
                      onSort={onSort}
                      className="min-w-[180px]"
                    />
                  ) : null}
                  {columns.tags ? (
                    <SortableTh
                      label="Tags"
                      sortKey="tags"
                      activeKey={sortKey}
                      dir={sortDir}
                      onSort={onSort}
                      className="min-w-[100px]"
                    />
                  ) : null}
                  {columns.updated ? (
                    <SortableTh
                      label="Updated"
                      sortKey="updated"
                      activeKey={sortKey}
                      dir={sortDir}
                      onSort={onSort}
                    />
                  ) : null}
                  {columns.invited ? (
                    <SortableTh
                      label="Invited"
                      sortKey="invited"
                      activeKey={sortKey}
                      dir={sortDir}
                      onSort={onSort}
                      className="w-24 text-center [&>button]:w-full [&>button]:justify-center"
                    />
                  ) : null}
                </TableRow>
              </TableHeader>
              {layout === 'flat' ? (
                <TableBody>
                  {sorted.map((g) => (
                    <GuestTableRow
                      key={g.id}
                      g={g}
                      scenarioId={scenarioId}
                      showHousehold={layout === 'flat' && columns.household}
                      vis={columns}
                    />
                  ))}
                </TableBody>
              ) : (
                householdGroups.map((hg) => {
                  const isCollapsed = collapsed.has(hg.key)
                  return (
                    <TableBody key={hg.key}>
                      <TableRow className="border-white/8 bg-[#1e1f22] hover:bg-[#1e1f22]">
                        <TableCell
                          colSpan={visibleColCount}
                          className="py-2 font-semibold text-[#dbdee1]"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => toggleCollapsed(hg.key)}
                              className="inline-flex items-center gap-2"
                            >
                              {isCollapsed ? (
                                <ChevronRight className="size-4 text-[#949ba4]" />
                              ) : (
                                <ChevronDown className="size-4 text-[#949ba4]" />
                              )}
                              {hg.label}
                              <span className="text-xs font-normal text-[#6d737a]">
                                ({hg.guests.length})
                              </span>
                            </button>
                            <button
                              type="button"
                              disabled={bulkLoading}
                              onClick={() => void inviteWholeGroup(hg.key)}
                              className="rounded bg-[#23a55a]/20 px-2 py-1 text-xs font-semibold text-[#23a55a] hover:bg-[#23a55a]/30 disabled:opacity-50"
                            >
                              Invite whole group
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {!isCollapsed
                        ? hg.guests.map((g) => (
                            <GuestTableRow
                              key={g.id}
                              g={g}
                              scenarioId={scenarioId}
                              showHousehold={false}
                              vis={columns}
                            />
                          ))
                        : null}
                    </TableBody>
                  )
                })
              )}
            </Table>
          </div>
        </>
      )}
    </div>
  )
}

function formatShortDate(iso: string) {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return '—'
  }
}

function GuestTableRow({
  g,
  scenarioId,
  showHousehold,
  vis,
}: {
  g: GuestListRow
  scenarioId: string
  showHousehold: boolean
  vis: ColumnVisibility
}) {
  return (
    <TableRow className="border-white/8 hover:bg-[#35373c]/60">
      <TableCell className="font-medium text-[#dbdee1]">
        <div className="flex items-center gap-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#5865f2] text-xs font-bold text-white">
            {g.firstName[0]}
            {g.lastName[0]}
          </span>
          {g.firstName} {g.lastName}
        </div>
      </TableCell>
      {showHousehold ? (
        <TableCell className="text-[#b5bac1]">
          {householdLabel(g)}
        </TableCell>
      ) : null}
      {vis.category ? (
        <TableCell className="text-[#b5bac1]">
          {formatGuestEnum(g.category)}
        </TableCell>
      ) : null}
      {vis.side ? (
        <TableCell className="text-[#b5bac1]">
          {formatGuestEnum(g.side)}
        </TableCell>
      ) : null}
      {vis.priority ? (
        <TableCell>
          <Badge
            variant="outline"
            className="border-white/10 bg-[#1e1f22] text-[#949ba4]"
          >
            {formatGuestEnum(g.manualPriority)}
          </Badge>
        </TableCell>
      ) : null}
      {vis.notes ? (
        <TableCell className="align-top">
          <GuestNotesCell guestId={g.id} notes={g.notes} tags={g.tags} />
        </TableCell>
      ) : null}
      {vis.tags ? (
        <TableCell className="align-top">
          <GuestTagsCell guestId={g.id} notes={g.notes} tags={g.tags} />
        </TableCell>
      ) : null}
      {vis.updated ? (
        <TableCell className="whitespace-nowrap text-xs text-[#6d737a]">
          {formatShortDate(g.updatedAt)}
        </TableCell>
      ) : null}
      {vis.invited ? (
        <TableCell className="text-center">
          <div className="flex justify-center">
            <InviteToggle
              scenarioId={scenarioId}
              guestId={g.id}
              initialInvited={g.invited}
            />
          </div>
        </TableCell>
      ) : null}
    </TableRow>
  )
}

function GuestMobileRow({
  g,
  scenarioId,
  vis,
  layout,
}: {
  g: GuestListRow
  scenarioId: string
  vis: ColumnVisibility
  layout: 'flat' | 'household'
}) {
  const metaParts: string[] = []
  if (vis.category) metaParts.push(formatGuestEnum(g.category))
  if (vis.side) metaParts.push(formatGuestEnum(g.side))
  if (layout === 'flat' && vis.household) metaParts.push(householdLabel(g))

  return (
    <li className="flex flex-col gap-2 p-3 transition-colors hover:bg-[#35373c]/80">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-[#5865f2] text-xs font-bold text-white">
            {g.firstName[0]}
            {g.lastName[0]}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-[#dbdee1]">
              {g.firstName} {g.lastName}
            </p>
            {metaParts.length > 0 ? (
              <p className="text-xs text-[#949ba4]">{metaParts.join(' · ')}</p>
            ) : null}
          </div>
        </div>
        {vis.invited ? (
          <InviteToggle
            scenarioId={scenarioId}
            guestId={g.id}
            initialInvited={g.invited}
          />
        ) : null}
      </div>
      {vis.priority ? (
        <Badge
          variant="secondary"
          className="w-fit border-0 bg-[#1e1f22] text-xs text-[#949ba4]"
        >
          {formatGuestEnum(g.manualPriority)}
        </Badge>
      ) : null}
      {vis.notes ? (
        <GuestNotesCell guestId={g.id} notes={g.notes} tags={g.tags} />
      ) : null}
      {vis.tags ? (
        <GuestTagsCell guestId={g.id} notes={g.notes} tags={g.tags} />
      ) : null}
      {vis.updated ? (
        <p className="text-[10px] text-[#6d737a]">
          Updated {formatShortDate(g.updatedAt)}
        </p>
      ) : null}
    </li>
  )
}
