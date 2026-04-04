'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { normalizeGuestTagsInput, parseGuestTags } from '@/lib/guest-display'

type Props = {
  guestId: string
  notes: string | null
  tags: string | null
}

export function GuestNotesCell({ guestId, notes: n0 }: Props) {
  const router = useRouter()
  const [notes, setNotes] = useState(n0 ?? '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setNotes(n0 ?? '')
  }, [n0])

  async function persist() {
    setSaving(true)
    try {
      const res = await fetch(`/api/guests/${guestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: notes.trim() || null,
        }),
      })
      if (!res.ok) {
        alert('Could not save notes.')
        return
      }
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-w-[120px] max-w-[min(280px,100%)]">
      <textarea
        rows={2}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={() => void persist()}
        disabled={saving}
        placeholder="Decisions, follow-ups…"
        className="w-full resize-y rounded border border-white/10 bg-[#1e1f22] px-2 py-1 text-xs text-[#dbdee1] placeholder:text-[#6d737a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5865f2]/50"
      />
      {saving ? (
        <span className="text-[10px] text-[#6d737a]">Saving…</span>
      ) : null}
    </div>
  )
}

export function GuestTagsCell({ guestId, tags: t0 }: Props) {
  const router = useRouter()
  const [tags, setTags] = useState(t0 ?? '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setTags(t0 ?? '')
  }, [t0])

  async function persist() {
    setSaving(true)
    try {
      const res = await fetch(`/api/guests/${guestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tags: normalizeGuestTagsInput(tags),
        }),
      })
      if (!res.ok) {
        alert('Could not save tags.')
        return
      }
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  const chips = parseGuestTags(tags)

  return (
    <div className="min-w-[100px] max-w-[200px] space-y-1">
      <div className="flex flex-wrap gap-1">
        {chips.length === 0 ? (
          <span className="text-[10px] text-[#6d737a]">—</span>
        ) : (
          chips.map((t) => (
            <span
              key={t}
              className="rounded bg-[#1e1f22] px-1.5 py-0.5 text-[10px] text-[#b5bac1]"
            >
              {t}
            </span>
          ))
        )}
      </div>
      <input
        type="text"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        onBlur={() => void persist()}
        disabled={saving}
        placeholder="cut, rsvp…"
        className="w-full rounded border border-white/10 bg-[#1e1f22] px-2 py-1 text-xs text-[#dbdee1] placeholder:text-[#6d737a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5865f2]/50"
      />
    </div>
  )
}

/** Combined block for mobile cards */
export function GuestNotesTagsCell(props: Props) {
  return (
    <div className="space-y-2">
      <GuestNotesCell {...props} />
      <GuestTagsCell {...props} />
    </div>
  )
}
