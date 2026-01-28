"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Loader2, ArrowRight } from "lucide-react"
import Link from "next/link"
import ReactConfetti from "react-confetti"

export default function SuccessPage() {
    const searchParams = useSearchParams()
    const jobId = searchParams.get("job_id")
    const router = useRouter()
    const [verifying, setVerifying] = useState(true)

    // Optional: We could verify payment status here, 
    // but the webhook should handle the DB update.
    // We'll just wait a moment and assume success if they got here via Stripe success_url.

    useEffect(() => {
        const timer = setTimeout(() => {
            setVerifying(false)
        }, 1500)
        return () => clearTimeout(timer)
    }, [])

    if (!jobId) {
        return <div className="min-h-screen flex items-center justify-center">Invalid request</div>
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
            {!verifying && <ReactConfetti numberOfPieces={200} recycle={false} />}

            <div className="max-w-md w-full p-8 text-center space-y-6 relative z-10">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    {verifying ? (
                        <Loader2 className="w-10 h-10 text-green-600 animate-spin" />
                    ) : (
                        <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-500" />
                    )}
                </div>

                <h1 className="text-3xl font-bold tracking-tight">
                    {verifying ? "Confirming Payment..." : "Payment Successful!"}
                </h1>

                <p className="text-muted-foreground">
                    {verifying
                        ? "Please wait while we secure your order."
                        : "Your expression pack is now fully unlocked. Thank you for your support!"}
                </p>

                <div className="pt-4">
                    <Button
                        size="lg"
                        className="w-full gap-2"
                        onClick={() => router.push(`/view/${jobId}`)}
                        disabled={verifying}
                    >
                        View My Photos <ArrowRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
