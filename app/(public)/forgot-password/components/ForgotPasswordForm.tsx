"use client"

import React, { useState } from 'react'
import { resetPasswordAction } from "@/actions"
import Link from "next/link"
import { ArrowLeft, Loader2, Mail } from "lucide-react"

export default function ForgotPasswordForm() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const form = new FormData()
            form.append('email', email)

            await resetPasswordAction(form)
            setSubmitted(true)
        } catch (err: any) {
            setError(err.message || "Failed to send reset email")
        } finally {
            setLoading(false)
        }
    }

    if (submitted) {
        return (
            <div className="bg-white p-8 rounded-2xl shadow-xl text-center">
                <div className="w-16 h-16 bg-blue-50 text-brand-blue rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail size={32} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Check your email</h2>
                <p className="text-slate-600 mb-6">
                    We have sent a password reset link to <strong>{email}</strong>.
                </p>
                <Link href="/login" className="text-brand-blue font-semibold hover:underline flex items-center justify-center gap-2">
                    <ArrowLeft size={16} />
                    Back to Login
                </Link>
            </div>
        )
    }

    return (
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100/50 backdrop-blur-sm">
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-brand-blue mb-2">Forgot Password?</h1>
                <p className="text-slate-500 text-sm">Enter your email and we'll send you a link to reset your password.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 text-left">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5 pl-1">Email Address</label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
                        placeholder="you@example.com"
                    />
                </div>

                {error && (
                    <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100 flex items-center gap-2">
                        <span className="shrink-0 font-bold">!</span> {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-brand-blue text-white font-semibold rounded-xl hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            Sending Link...
                        </>
                    ) : (
                        "Send Reset Link"
                    )}
                </button>

                <div className="text-center pt-2">
                    <Link href="/login" className="text-sm text-slate-500 hover:text-brand-blue transition-colors flex items-center justify-center gap-1">
                        <ArrowLeft size={14} />
                        Back to Login
                    </Link>
                </div>
            </form>
        </div>
    )
}
