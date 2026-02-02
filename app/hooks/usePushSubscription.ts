"use client"

import { useState, useEffect } from "react"
import { saveSubscriptionAction } from "@/actions"

export function usePushSubscription() {
    const [isSupported, setIsSupported] = useState(false)
    const [subscription, setSubscription] = useState<PushSubscription | null>(null)
    const [headerKey, setHeaderKey] = useState<string | null>(null)

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true)
            registerServiceWorker()

            // In production this should be environment variable
            setHeaderKey(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "BOvYPQrB3IXuIyqqn1YCP5uual0hfqS3JiBTMtWNFmSrXXxJ7br7T8LcrbQAbmaYgtcuKwXd963bTuec6vzSyEg")
        }
    }, [])

    async function registerServiceWorker() {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/',
                updateViaCache: 'none',
            })
            const sub = await registration.pushManager.getSubscription()
            setSubscription(sub)
        } catch (error) {
            console.error("SW Register failed", error)
        }
    }

    async function subscribeToPush() {
        if (!headerKey) return
        try {
            const registration = await navigator.serviceWorker.ready
            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(headerKey),
            })
            setSubscription(sub)
            await saveSubscriptionAction(JSON.parse(JSON.stringify(sub)))
            return true
        } catch (error) {
            console.error("Subscription failed", error)
            return false
        }
    }

    function urlBase64ToUint8Array(base64String: string) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4)
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/')

        const rawData = window.atob(base64)
        const outputArray = new Uint8Array(rawData.length)

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i)
        }
        return outputArray
    }

    return { isSupported, subscription, subscribeToPush }
}
