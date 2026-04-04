'use client'

import { useEffect, useState } from 'react'

type Props = {
  scenarioId: string
  guestId: string
  initialInvited: boolean
}

/** Discord-adjacent: green “online” when invited, neutral when not */
export function InviteToggle({ scenarioId, guestId, initialInvited }: Props) {
  const [invited, setInvited] = useState(initialInvited)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    setInvited(initialInvited)
  }, [initialInvited])

  async function onChange() {
    const next = !invited
    setInvited(next)
    setPending(true)
    try {
      const res = await fetch(`/api/scenarios/${scenarioId}/guests`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestId, invited: next }),
      })
      if (!res.ok) setInvited(!next)
    } catch {
      setInvited(!next)
    } finally {
      setPending(false)
    }
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={invited}
      disabled={pending}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5865f2] focus-visible:ring-offset-2 focus-visible:ring-offset-[#313338] disabled:opacity-50 ${
        invited
          ? 'border-[#23a55a]/80 bg-[#23a55a]/25'
          : 'border-white/15 bg-[#1e1f22]'
      }`}
      aria-label={invited ? 'Invited' : 'Not invited'}
    >
      <span
        className={`pointer-events-none block size-5 rounded-full shadow transition-transform ${
          invited
            ? 'translate-x-5 bg-[#23a55a]'
            : 'translate-x-0.5 bg-[#6d737a]'
        }`}
      />
    </button>
  )
}
