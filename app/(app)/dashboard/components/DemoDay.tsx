'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import Image from 'next/image'

export default function DemoDay() {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            {/* Banner */}
            <div
                className="bg-blue-100 border border-blue-300 text-blue-800 px-4 py-3 rounded-xl relative cursor-pointer hover:bg-blue-200 transition-colors"
                role="alert"
                onClick={() => setIsOpen(true)}
            >
                <strong className="font-bold animate-pulse">Demo day is waiting for you...</strong>
            </div>

            {/* Modal Overlay */}
            {isOpen && (
                <div className="fixed h-full inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50" onClick={() => setIsOpen(false)}>
                    <div
                        className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center p-6">
                            <h2 className="text-2xl font-bold text-gray-900">
                                Demo Day
                                <span className="inline-block ml-3 px-3 py-1 bg-linear-to-r from-blue-500 to-blue-600 text-white text-xs font-semibold rounded-full shadow-md hover:shadow-lg transition-shadow">
                                    Coming soon
                                </span>
                            </h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <Image
                            src="/demo.png"
                            alt="Demo Day Banner"
                            width={800}
                            height={400}
                            className="w-full h-auto object-cover"
                        />

                        {/* Content */}
                        <div className="p-6 space-y-4">
                            <p className="text-gray-600">
                                Get ready to present your work and learn from your peers.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}