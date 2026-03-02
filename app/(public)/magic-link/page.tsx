"use client"

import ForgotPasswordForm from "../forgot-password/components/ForgotPasswordForm"
import Silk from "@/components/Silk"

export default function MagicLinkPage() {
    return (
        <>
            <div className="h-screen flex items-center justify-center p-6 text-center">
                <div className="absolute inset-0 z-0">
                    <Silk
                        speed={4}
                        scale={1.2}
                        color="#2e85fe"
                        noiseIntensity={1.0}
                        rotation={45}
                    />
                </div>

                <div className="w-full max-w-md relative z-10">
                    <ForgotPasswordForm />
                </div>
            </div>
        </>
    )
}
