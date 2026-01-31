"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useToast } from "@/components/ToastProvider"
import { Calendar } from "lucide-react"

type DailyUpdate = {
  id: string
  user_id: string | null
  content: string
  created_at: string
  college_id: string | null
}

function formatDateISO(d: Date) {
  // Return date in local YYYY-MM-DD (use local components so calendar matches user's local day)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function getRangeDates(startISO: string, endISO: string) {
  const start = new Date(startISO)
  const end = new Date(endISO)
  const days: { date: string; display: string }[] = []
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const copy = new Date(d)
    days.push({ date: formatDateISO(copy), display: copy.toLocaleDateString() })
  }
  return days
}

export default function DailyUpdateClient() {
  const [content, setContent] = useState("")
  const [updates, setUpdates] = useState<DailyUpdate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fixed date range: Feb 01 -> Feb 28 (inclusive)
  const days = useMemo(() => getRangeDates("2026-02-01", "2026-03-01"), [])

  async function fetchUpdates() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/daily-updates")
      if (!res.ok) throw new Error("Failed to fetch updates")
      const data = await res.json()
      setUpdates(data)
    } catch (err: unknown) {
      const e = err as { message?: string }
      setError(e.message || "Error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUpdates()
  }, [])

  const marks = useMemo(() => {
    const map = new Map<string, number>()
    for (const u of updates) {
      const date = new Date(u.created_at)
      const iso = formatDateISO(date)
      map.set(iso, (map.get(iso) || 0) + 1)
    }
    return map
  }, [updates])

  const todayISO = useMemo(() => {
    const d = new Date()
    return formatDateISO(d)
  }, [])

  const { show } = useToast()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    try {
      setLoading(true)
      // compute user's local day boundaries and send to server so server enforces per-local-day limit
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
      const end = new Date(start.getTime() + 24 * 60 * 60 * 1000)

      const res = await fetch("/api/daily-updates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, startISO: start.toISOString(), endISO: end.toISOString() }),
      })
      if (!res.ok) {
        if (res.status === 409) {
          // Duplicate for the local day
          const text = await res.text()
          const msg = text || 'You have already submitted today.'
          show({ title: 'Already submitted', description: msg })
          setError(msg)
          return
        }
        const txt = await res.text()
        const errMsg = txt || "Failed to save"
        show({ title: 'Error', description: errMsg })
        throw new Error(errMsg)
      }

      setContent("")
      show({ title: 'Saved', description: 'Your daily update was saved.' })
      await fetchUpdates()
    } catch (err: unknown) {
      const e = err as { message?: string }
      setError(e.message || "Error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-blue-500">Daily Updates</h1>
        <p className="text-sm text-slate-500">Update your daily progress and activities</p>
      </header>


      <form onSubmit={handleSubmit} className="mb-6">
        <label className="block mb-2 font-medium text-black">What did you do today?</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full p-2 border rounded mb-2 text-black placeholder-blue-200"
          placeholder="Write your updates"
          rows={4}
        />
        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
            disabled={loading || (marks.get(todayISO) || 0) > 0}
            title={(marks.get(todayISO) || 0) > 0 ? "You have already submitted today" : undefined}
          >
            {(marks.get(todayISO) || 0) > 0 ? 'Submitted today' : (loading ? 'Saving...' : 'Save')}
          </button>
          <button
            type="button"
            className="px-4 py-2 border rounded text-black"
            onClick={() => setContent("")}
          >
            Clear
          </button>
        </div>
        {error && <p className="text-red-600 mt-2">{error}</p>}
      </form>

      <section className="mb-6">
        <h2 className="font-medium mb-2 text-blue-500">Coming 30 days</h2>
        <div className="grid lg:grid-cols-7 grid-cols-4 gap-2">
          {days.map((d) => {
            const count = marks.get(d.date) || 0
            const dt = new Date(d.date)
            // Highlight a specific checkpoint date (Feb 01, 2026) instead of Sundays
            const isCheckpoint = formatDateISO(dt) === "2026-01-31"
            return (
              <div
                key={d.date}
                className={`p-2 text-sm border rounded text-center ${isCheckpoint ? "bg-yellow-50 border-yellow-300" : count > 0 ? "bg-green-100 border-green-300" : "bg-white"
                  }`}
                title={isCheckpoint ? "Checkpoint (2026-01-31)" : count > 0 ? `${count} update(s)` : "No updates"}
              >
                <div className={`font-medium ${isCheckpoint ? 'text-yellow-700' : 'text-blue-500'}`}>{dt.toLocaleString(undefined, { weekday: 'short' })}</div>
                <div className={`${isCheckpoint ? 'text-yellow-700' : 'text-blue-500'} text-xs`}>{dt.getDate()}</div>
                {isCheckpoint && <div className="mt-1 text-xs text-yellow-700">Checkpoint</div>}
                {!isCheckpoint && count > 0 && <div className="mt-1 text-xs text-green-700">●</div>}
              </div>
            )
          })}
        </div>
      </section>

      <section>
        <h2 className="font-medium mb-2 text-gray-700">Previous updates</h2>
        {loading && <p className="text-blue-500">Loading...</p>}
        {!loading && updates.length === 0 && <p className="text-sm text-black">No updates yet.</p>}
        <ul className="space-y-3">
          {updates.map((u) => (
            <li key={u.id} className="p-3 border rounded">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Calendar size={12} />
                {new Date(u.created_at).toLocaleDateString()}
              </span>
              <div className="whitespace-pre-wrap mt-1 text-black">{u.content}</div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
