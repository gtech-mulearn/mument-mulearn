"use client"

import { useEffect, useState } from "react"
import { usePushSubscription } from "@/hooks/usePushSubscription"
import { Download, Bell, X } from "lucide-react"

import { useToast } from "@/components/ToastProvider"

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
    const [showPrompt, setShowPrompt] = useState(false)
    const { isSupported, subscription, subscribeToPush } = usePushSubscription()
    const { show } = useToast()


    useEffect(() => {
        // 1. Check if already installed
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches
        if (isStandalone) return

        // 2. Listen for install prompt
        const handler = (e: any) => {
            e.preventDefault()
            setDeferredPrompt(e)
            // Only show if not installed and maybe add a small delay or check user preference
            setShowPrompt(true)
        }

        window.addEventListener('beforeinstallprompt', handler)

        return () => window.removeEventListener('beforeinstallprompt', handler)
    }, [])

    const handleInstall = async () => {
        if (!deferredPrompt) return
        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        if (outcome === 'accepted') {
            setDeferredPrompt(null)
            setShowPrompt(false)
        }
    }

    const handleSubscribe = async () => {
        const success = await subscribeToPush()
        if (success) {
            show({ title: "Success", description: "Notifications enabled!" })
        } else {
            show({ title: "Error", description: "Could not enable notifications." })
        }
    }

    if (!showPrompt && subscription) return null // If installed or prompt dismissed AND notifications enabled, hide.

    // If we have an install prompt available OR notifications are supported but disabled, show something.
    // Prioritize Install.
    const showInstall = showPrompt && deferredPrompt
    const showNotify = isSupported && !subscription

    if (!showInstall && !showNotify) return null

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:w-96 bg-white p-4 rounded-xl shadow-2xl border border-slate-100 z-50 animate-in slide-in-from-bottom-10 fade-in duration-500">
            <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-slate-800">
                    {showInstall ? "Install App" : "Enable Notifications"}
                </h3>
                <button onClick={() => setShowPrompt(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={18} />
                </button>
            </div>

            <p className="text-sm text-slate-500 mb-4">
                {showInstall
                    ? "Install Mument for the best experience and quick access."
                    : "Get real-time updates on your feedback replies and status changes."}
            </p>

            <div className="flex gap-2">
                {showInstall && (
                    <button
                        onClick={handleInstall}
                        className="flex-1 bg-brand-blue text-white py-2 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
                    >
                        <Download size={16} /> Install
                    </button>
                )}

                {showNotify && (
                    <button
                        onClick={handleSubscribe}
                        className={`flex-1 ${!showInstall ? 'bg-brand-blue text-white' : 'bg-slate-100 text-slate-700'} py-2 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-colors`}
                    >
                        <Bell size={16} /> Notify Me
                    </button>
                )}
            </div>
        </div>
    )
}
