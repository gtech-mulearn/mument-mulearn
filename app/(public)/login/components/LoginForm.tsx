'use client'

import React, { useState } from 'react'
import { Eye, EyeClosed } from "lucide-react"
import { signIn } from "@/actions/auth"

type Props = {
  onSignedIn?: () => void
}

export default function LoginForm({ onSignedIn }: Props) {
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await signIn(email, password)
      // Successful sign in
      onSignedIn?.()
    } catch (err) {
      const error = err as { message?: string }
      setError(error?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-2xl shadow relative z-10">
      <h1 className="text-blue-700 text-2xl font-bold mb-4 text-center">Login</h1>

      <form onSubmit={handleLogin} className="space-y-4" aria-describedby="login-error">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-blue-700">Email</label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            className="mt-1 block w-full rounded-md border-blue-500 p-2 bg-blue-50 text-blue-700 placeholder-blue-700"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-medium text-blue-700">Password</label>
            <a href="/magic-link" className="text-xs font-semibold text-brand-blue hover:text-blue-800 hover:underline">
              Sign in with magic link
            </a>
          </div>
          <div className="relative mt-1">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="block w-full rounded-md border-blue-500 p-2 pr-10 text-blue-700 bg-blue-50 placeholder-blue-700"
            />

            <button
              type="button"
              onClick={() => setShowPassword((s: boolean) => !s)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-700"
            >
              {showPassword ? <Eye size={16} /> : <EyeClosed size={16} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="px-4 py-2 bg-brand-blue text-white rounded w-full"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      {error && (
        <p id="login-error" className="text-sm text-red-600 mt-2">
          {error}
        </p>
      )}
    </div>
  )
}