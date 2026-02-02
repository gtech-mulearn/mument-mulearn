"use client"

import { useState, useEffect, useRef } from "react"
import { Bell, Check, Trash2, BellOff, X } from "lucide-react"
import { usePushSubscription } from "@/hooks/usePushSubscription"
import { getNotificationsAction, markNotificationReadAction, markAllNotificationsReadAction } from "@/actions"
import { useToast } from "@/components/ToastProvider"
import { useRouter } from "next/navigation"

type Notification = {
    id: string
    title: string
    message: string
    link: string | null
    is_read: boolean
    created_at: string
    type: string
}

export default function NotificationCenter() {
    const [isOpen, setIsOpen] = useState(false)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    const { isSupported, subscription, subscribeToPush } = usePushSubscription()
    const { show } = useToast()
    const router = useRouter()
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Fetch notifications
    useEffect(() => {
        const fetchNotes = async () => {
            const data = await getNotificationsAction()
            setNotifications(data)
            setUnreadCount(data.filter((n: Notification) => !n.is_read).length)
        }
        fetchNotes()

        // Poll every minute (simple real-time sim)
        const interval = setInterval(fetchNotes, 60000)
        return () => clearInterval(interval)
    }, [])

    // Close on click outside
    useEffect(() => {
        if(!isOpen) return

        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const handleEnablePush = async () => {
        setIsLoading(true)
        try {
            const success = await subscribeToPush()
            if (success) {
                show({ title: "Success", description: "You will now receive notifications!" })
            } else {
                show({ title: "Error", description: "Failed to enable notifications. Check permissions." })
            }
        } catch (error) {
            console.error(error)
            show({ title: "Error", description: "An unexpected error occurred." })
        } finally {
            setIsLoading(false)
        }
    }

    const handleMarkAllRead = async () => {
        await markAllNotificationsReadAction()
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
        setUnreadCount(0)
        show({ title: "Marked Read", description: "All notifications marked as read." })
    }

    const handleNotificationClick = async (n: Notification) => {
        if (!n.is_read) {
            await markNotificationReadAction(n.id)
            setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, is_read: true } : item))
            setUnreadCount(prev => Math.max(0, prev - 1))
        }
        if (n.link) {
            setIsOpen(false)
            router.push(n.link)
        }
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-full transition-all"
                title="Notifications"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-white">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                    {/* Header */}
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-bold text-slate-700">Notifications</h3>
                        {notifications.length > 0 && (
                            <button onClick={handleMarkAllRead} className="text-xs text-blue-600 hover:underline">
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* Enable Push Banner */}
                    {isSupported && !subscription && (
                        <div className="px-4 py-3 bg-blue-50 border-b border-blue-100 flex items-start gap-3">
                            <BellOff className="text-blue-500 shrink-0 mt-0.5" size={16} />
                            <div>
                                <p className="text-xs text-blue-700 font-medium mb-1">
                                    Enable push notifications?
                                </p>
                                <p className="text-[10px] text-blue-600 mb-2 leading-tight">
                                    Get alerts even when you're away.
                                </p>
                                <button
                                    onClick={handleEnablePush}
                                    disabled={isLoading}
                                    className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition disabled:opacity-50"
                                >
                                    {isLoading ? "Enabling..." : "Enable Now"}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* List */}
                    <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-sm">
                                <Bell className="mx-auto mb-2 opacity-20" size={32} />
                                No notifications yet
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {notifications.map(n => (
                                    <div
                                        key={n.id}
                                        onClick={() => handleNotificationClick(n)}
                                        className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 ${!n.is_read ? 'bg-blue-50/30' : ''}`}
                                    >
                                        <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${!n.is_read ? 'bg-blue-500' : 'bg-slate-200'}`} />
                                        <div className="flex-1">
                                            <p className={`text-sm ${!n.is_read ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>
                                                {n.title}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                                {n.message}
                                            </p>
                                            <p className="text-[10px] text-slate-400 mt-2">
                                                {new Date(n.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
