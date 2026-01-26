"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Check, Loader2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

function SuccessPageContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const jobId = searchParams.get("job_id")
    const [countdown, setCountdown] = useState(5)

    useEffect(() => {
        if (!jobId) return

        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer)
                    router.push(`/view/${jobId}`)
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(timer)
    }, [jobId, router])

    if (!jobId) return <div className="p-10 text-center">Invalid Request</div>

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
            <Card className="max-w-md w-full p-8 text-center space-y-6">
                <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-10 h-10 text-green-600" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold">Payment Successful!</h1>
                    <p className="text-muted-foreground">
                        Thank you for your purchase. Your full expression pack is being generated now.
                    </p>
                </div>

                <div className="bg-primary/5 p-4 rounded-lg flex items-center justify-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span className="font-medium text-sm">Redirecting in {countdown}s...</span>
                </div>

                <Button
                    variant="outline"
                    onClick={() => router.push(`/view/${jobId}`)}
                    className="w-full"
                >
                    Go to Expression Pack
                </Button>
            </Card>
        </div>
    )
}

export default function SuccessPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>}>
            <SuccessPageContent />
        </Suspense>
    )
}
