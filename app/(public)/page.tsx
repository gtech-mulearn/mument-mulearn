'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';
import Silk from '@/components/Silk';
import Image from 'next/image';

export default function LandingPage() {
  const router = useRouter()
  // const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const supabase = useMemo(() => createClient(), [])


  const redirectToDashboard = useCallback(() => {
    setLoading(true)
    router.replace("/dashboard")
  }, [router])

  // If already logged in, skip login page

  const handleGetStarted = () => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        redirectToDashboard()
      } else {
        router.push("/login")
      }
    }
    checkSession()
  }


  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      <div className="absolute inset-0">
        <Silk
          speed={5}
          scale={1}
          color="#2e85fe"
          noiseIntensity={1.5}
          rotation={0}
        />
      </div>

      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-auto p-6 gap-10">
        <Image
          src="/logo_white.png"
          alt="Mument Logo"
          width={200}
          height={100}
          className="object-contain"
        />
        <div className='mx-20'>
          <h1 className="text-white text-7xl lg:text-9xl font-black text-center mx-10 select-none">
            where curiosity meets action
          </h1>
        </div>
        <button
          className="px-6 py-3 bg-white text-black font-semibold rounded-full shadow-lg hover:bg-gray-200 transition"
          onClick={() => {
            handleGetStarted();
          }}
        >
          {loading ? <Loader2 className="animate-spin text-blue-500" /> : "Get Started"}
        </button>
      </div>

      <footer className="absolute bottom-4 w-full text-center text-white text-sm z-10">
        &copy; {new Date().getFullYear()} µment. All rights reserved.
      </footer>
    </div>
  )
}