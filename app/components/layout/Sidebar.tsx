
"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { X } from "lucide-react"
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

  const getLinkStyle = (href: string) => {
    const isActive = pathname === href
    return `group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:bg-white/10 ${isActive ? "text-white font-semibold bg-white/5" : "text-white/70"
      }`
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
          <li>
            <Link href="/dashboard" className={getLinkStyle("/dashboard")} onClick={onClose}>
              <LayoutDashboard size={20} className={pathname === "/dashboard" ? "text-brand-yellow" : ""} />
              Dashboard
              {pathname === "/dashboard" && (
                <div className="absolute left-0 w-1.5 h-6 bg-brand-yellow rounded-r-full" />
              )}
            </Link>
          </li>

          <li>
            <Link href="/profile" className={getLinkStyle("/profile")} onClick={onClose}>
              <User size={20} className={pathname === "/profile" ? "text-brand-yellow" : ""} />
              Profile
            </Link>
          </li>

          <li>
            <Link href="/feedback/submit" className={getLinkStyle("/feedback/submit")} onClick={onClose}>
              <MessageSquareText size={20} />
              Submit Feedback
            </Link>
          </li>

          <li>
            <Link href="/checkpoints" className={getLinkStyle("/checkpoints")} onClick={onClose}>
              <MapPin size={20} />
              Checkpoints
            </Link>
          </li>

          <li>
            <Link href="/daily-update" className={getLinkStyle("/daily-update")} onClick={onClose}>
              <CalendarCheck size={20} />
              Daily Update
            </Link>
          </li>

          {permissions.canViewFeedbackInbox(role) && (
            <li>
              <Link href="/feedback/inbox" className={getLinkStyle("/feedback/inbox")} onClick={onClose}>
                <Inbox size={20} />
                Feedback Inbox
              </Link>
            </li>
          )}

          {permissions.canManageCheckpoints(role) && (
            <li>
              <Link href="/checkpoints" className={getLinkStyle("/checkpoints")} onClick={onClose}>
                <MapPin size={20} />
                Manage Checkpoints
              </Link>
            </li>
          )}

          {permissions.canCreateAnnouncements(role) && (
            <li>
              <Link href="/announcements" className={getLinkStyle("/announcements")} onClick={onClose}>
                <Megaphone size={20} />
                Announcements
              </Link>
            </li>
          )}

          {role === "admin" && (
            <li>
              <Link href="/admin" className={getLinkStyle("/admin")} onClick={onClose}>
                <ShieldCheck size={20} />
                Admin
              </Link>
            </li>
          )}
        </ul>
      </nav>

      {/* Role footer */}
      <div className="pt-6 border-t border-white/10 mt-auto">
        <p className="text-[10px] uppercase tracking-wider text-white/40 px-4 mb-1">
          Role
        </p>
        <p className="text-xs font-bold text-white/80 px-4 uppercase">
          {role}
        </p>
      </div>
    </aside>
  )
}
