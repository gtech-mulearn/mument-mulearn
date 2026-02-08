"use client"

import React, { useEffect, useState } from "react"
import { fetchAnnouncements } from "@/actions/announcements"

type Announcement = { id: number; content: string; created_at: string }

export default function ViewAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    fetchAnnouncements()
      .then((result) => {
        if (!mounted) return
        if (result.error) {
          setError(result.error)
          return
        }
        setAnnouncements(result?.announcements || [])
      })
      .catch((err) => {
        if (!mounted) return
        console.error("Failed to fetch announcements:", err)
        setError(err?.message || "Failed to fetch")
      })

    return () => {
      mounted = false
    }
  }, [])

  if (error) return <div className="text-red-600">{error}</div>
  if (!announcements) return <div className="text-sm text-gray-500">Loading...</div>
  if (announcements.length === 0) return <div className="text-sm text-gray-700">No announcements</div>
  const renderContent = (text: string) => {
    const parts: React.ReactNode[] = []
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi
    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = urlRegex.exec(text)) !== null) {
      const url = match[0]
      const index = match.index
      if (index > lastIndex) {
        parts.push(text.slice(lastIndex, index))
      }

      const href = url.startsWith("http") ? url : `https://${url}`
      parts.push(
        <a key={`${href}-${index}`} href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
          {url}
        </a>
      )

      lastIndex = index + url.length
    }

    if (lastIndex < text.length) parts.push(text.slice(lastIndex))

    return <div className="whitespace-pre-wrap text-black">{parts}</div>
  }

  return (
    <ul className="space-y-4">
      {announcements.map((a) => (
        <li key={a.id} className="p-4 border rounded">
          <h1 className="text-xs text-gray-600 mb-1">From Admin</h1>
          <div className="text-xs text-blue-400 mb-2">{new Date(a.created_at).toLocaleString()}</div>
          {renderContent(a.content || "")}
        </li>
      ))}
    </ul>
  )
}
