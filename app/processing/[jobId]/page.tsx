"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Loader2, CheckCircle2, Upload, Sparkles, AlertCircle } from "lucide-react"

type ProcessingStatus = {
    stage: "uploading" | "validating" | "training" | "generating" | "complete" | "error"
    message: string
    progress?: number
}

export default function ProcessingPage() {
    const params = useParams()
    const jobId = params.jobId as string
    const router = useRouter()
    const [status, setStatus] = useState<ProcessingStatus>({
        stage: "uploading",
        message: "Preparing your photos..."
    })

    useEffect(() => {
        let interval: NodeJS.Timeout

        const checkStatus = async () => {
            try {
                const res = await fetch(`/api/status/${jobId}`)
                if (!res.ok) throw new Error("Failed to fetch status")

                const data = await res.json()

                // Map backend status to UI status
                if (data.status === "validating") {
                    setStatus({
                        stage: "validating",
                        message: "Validating your photos..."
                    })
                } else if (data.status === "training") {
                    setStatus({
                        stage: "training",
                        message: "Training your AI model (10-20 minutes)..."
                    })
                } else if (data.status === "generating" || data.status === "generating_free") {
                    setStatus({
                        stage: "generating",
                        message: "Generating your expressions..."
                    })
                } else if (data.status === "complete" || data.status === "complete_free") {
                    setStatus({
                        stage: "complete",
                        message: "Complete! Redirecting..."
                    })
                    // Redirect to view page
                    setTimeout(() => {
                        router.push(`/view/${jobId}`)
                    }, 1000)
                } else if (data.status === "failed") {
                    setStatus({
                        stage: "error",
                        message: data.error || "Something went wrong"
                    })
                }
            } catch (error) {
                console.error("Error checking status:", error)
            }
        }

        // Initial check
        checkStatus()

        // Poll every 3 seconds
        interval = setInterval(checkStatus, 3000)

        return () => clearInterval(interval)
    }, [jobId, router])

    const getIcon = () => {
        switch (status.stage) {
            case "uploading":
                return <Upload className="w-16 h-16 text-primary animate-pulse" />
            case "validating":
                return <Loader2 className="w-16 h-16 text-primary animate-spin" />
            case "training":
                return <Sparkles className="w-16 h-16 text-primary animate-pulse" />
            case "generating":
                return <Loader2 className="w-16 h-16 text-primary animate-spin" />
            case "complete":
                return <CheckCircle2 className="w-16 h-16 text-green-500" />
            case "error":
                return <AlertCircle className="w-16 h-16 text-destructive" />
        }
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center space-y-8">
                {/* Icon */}
                <div className="flex justify-center">
                    {getIcon()}
                </div>

                {/* Status Message */}
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold">
                        {status.stage === "error" ? "Oops!" : "Processing..."}
                    </h1>
                    <p className="text-muted-foreground">{status.message}</p>
                </div>

                {/* Progress Bar (if applicable) */}
                {status.stage === "training" && (
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div className="bg-primary h-full animate-pulse" style={{ width: "60%" }} />
                    </div>
                )}

                {/* Additional Info */}
                {status.stage === "training" && (
                    <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg text-sm text-left">
                        <p className="font-medium text-blue-900 dark:text-blue-100 mb-2">What's happening?</p>
                        <ul className="space-y-1 text-blue-700 dark:text-blue-300 text-xs">
                            <li>✓ Photos validated</li>
                            <li className="animate-pulse">⏳ Training AI model on your face...</li>
                            <li className="text-muted-foreground">⏱ Generating expressions (next)</li>
                        </ul>
                    </div>
                )}

                {status.stage === "error" && (
                    <div className="bg-destructive/10 p-4 rounded-lg text-sm">
                        <p className="text-destructive">Please try again or contact support if the issue persists.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
