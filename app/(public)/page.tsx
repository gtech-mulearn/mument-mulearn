'use client';

import Silk from '@/components/Silk';
import Image from 'next/image';

export default function LandingPage() {
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
          <h1 className="text-white text-7xl lg:text-9xl font-black text-center mx-10">
            where curiosity meets action
          </h1>
        </div>
        <button
          className="px-6 py-3 bg-white text-black font-semibold rounded-full shadow-lg hover:bg-gray-200 transition"
          onClick={() => {
            window.location.href = '/login';
          }}
        >
          Get Started
        </button>
      </div>

      <footer className="absolute bottom-4 w-full text-center text-white text-sm z-10">
        &copy; {new Date().getFullYear()} µment. All rights reserved.
      </footer>
    </div>
  )
}