
"use client"

import React from "react"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Send, University, X } from "lucide-react"
import { Role } from "@/types/user"
import { permissions } from "@/lib/permissions"
import {
  LayoutDashboard,
  User,
  MessageSquareText,
  MapPin,
  CalendarCheck,
  Inbox,
  Megaphone,
  ShieldCheck,
} from "lucide-react"

type Props = {
  role: Role
  open: boolean
  onClose: () => void
}

export default function Sidebar({ role, open, onClose }: Props) {
  const pathname = usePathname()

  const getLinkStyle = React.useCallback((href: string) => {
    const isActive = pathname === href
    // Prefer animating only color/opacity instead of `transition-all` which forces expensive layout/paint work
    return `group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-200 hover:bg-white/10 ${isActive ? "text-white font-semibold bg-white/5" : "text-white/70"}`
  }, [pathname])

  const NavItem = ({ href, label, icon: Icon }: { href: string; label: string; icon: any }) => {
    // Exact match for most, but maybe startsWith for sub-pages?
    // adherence to original logic: strict match
    const isActive = pathname === href
    return (
      <li>
        <Link href={href} className={getLinkStyle(href)} onClick={onClose}>
          <Icon size={20} className={isActive ? "text-brand-yellow" : ""} />
          {label}
          {isActive && (
            <div className="absolute left-0 w-1.5 h-6 bg-brand-yellow rounded-r-full" />
          )}
        </Link>
      </li>
    )
  }

  return (
    <aside
      className={`
        fixed z-40 inset-y-0 left-0 w-64
        bg-brand-blue text-white font-redhat
        flex flex-col p-6 shadow-xl
        transform transition-transform duration-300 ease-in-out
        ${open ? "translate-x-0" : "-translate-x-full"}
        md:static md:translate-x-0
        md:h-[calc(100vh-2rem)] md:m-4 md:rounded-3xl
      `}
    >
      {/* Mobile close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 md:hidden p-2 rounded-lg bg-white/10"
      >
        <X size={20} />
      </button>

      {/* Logo */}
      <div className="mb-10 px-2 flex justify-center">
        <Image
          src="/logo_white.png"
          width={180}
          height={60}
          alt="Mument 2.0"
          className="object-contain"
          priority
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar">
        <ul className="flex flex-col gap-2">
          <NavItem href="/dashboard" label="Dashboard" icon={LayoutDashboard} />
          <NavItem href="/profile" label="Profile" icon={User} />
          <NavItem href="/feedback/submit" label="Submit Feedback" icon={MessageSquareText} />

          {/* Show regular Checkpoints link if not managing or just one link? 
                The original code had two links for checkpoints depending on permission. 
                I will preserve the original logic structure but use NavItem.
            */}
          {!permissions.canManageCheckpoints(role) && (
            <NavItem href="/checkpoints" label="Checkpoints" icon={MapPin} />
          )}

          <NavItem href="/daily-forum" label="Forum" icon={Send} />

          <NavItem href="/daily-update" label="Daily Update" icon={CalendarCheck} />

          {permissions.canViewFeedbackInbox(role) && (
            <NavItem href="/feedback/inbox" label="Feedback Inbox" icon={Inbox} />
          )}

          {permissions.canManageCheckpoints(role) && (
            <NavItem href="/checkpoints" label="Manage Checkpoints" icon={MapPin} />
          )}

          <NavItem href="/announcements" label="Announcements" icon={Megaphone} />

          {role === "admin" && (
            <NavItem href="/admin" label="Admin" icon={ShieldCheck} />
          )}

          {role === "campus_coordinator" && (
            <NavItem href="/campus" label="Coordinator" icon={University} />
          )}
        </ul>
      </nav>

      {/* Role footer */}
      <div className="pt-6 border-t border-white/10 mt-auto">
        <p className="text-[10px] uppercase tracking-wider text-white/40 px-4 mb-1">
          Role
        </p>
        <p className="text-xs font-bold text-white/80 px-4 uppercase">
          {role.replace(/_/g, " ")}
        </p>
      </div>
    </aside>
  )
}
