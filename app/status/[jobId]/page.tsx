"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, AlertCircle, CheckCircle2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

type JobStatus = {
    status: "training" | "generating" | "complete" | "failed"
    progress: number
    message?: string
    error?: string
    images?: Array<{ expression: string, url: string }>
}

export default function StatusPage() {
    const params = useParams()
    const router = useRouter()
    const jobId = params.jobId as string
    const [jobState, setJobState] = useState<JobStatus | null>(null)
    const [polling, setPolling] = useState(true)

    useEffect(() => {
        let interval: NodeJS.Timeout

        const checkStatus = async () => {
            try {
                const res = await fetch(`/api/status/${jobId}`)
                if (!res.ok) throw new Error("Failed to fetch status")

                const data = await res.json()
                setJobState(data)

                if (data.status === "complete") {
                    setPolling(false)
                    // Optional: Redirect to view page automatically
                    // router.push(`/view/${jobId}`)
                } else if (data.status === "failed") {
                    setPolling(false)
                }
            } catch (error) {
                console.error("Polling error:", error)
            }
        }

        // Initial check
        checkStatus()

        // Poll every 5 seconds if active
        if (polling) {
            interval = setInterval(checkStatus, 5000)
        }

        return () => clearInterval(interval)
    }, [jobId, polling, router])

    if (!jobState) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    if (jobState.status === "complete") {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 space-y-8">
                <div className="text-center space-y-4 max-w-md animate-in fade-in zoom-in duration-500">
                    <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h1 className="text-3xl font-bold">Pack Generated!</h1>
                    <p className="text-muted-foreground">
                        Your personalized expression pack is ready.
                    </p>
                    <Button
                        size="lg"
                        className="w-full"
                        onClick={() => router.push(`/view/${jobId}`)}
                    >
                        View My Expressions
                    </Button>
                </div>
            </div>
        )
    }

    if (jobState.status === "failed") {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
                <Card className="w-full max-w-md border-destructive/50">
                    <CardHeader>
                        <div className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="w-5 h-5" />
                            <CardTitle>Generation Failed</CardTitle>
                        </div>
                        <CardDescription>
                            {jobState.error || "Something went wrong while generating your pack."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" onClick={() => window.location.reload()}>
                            Try Again
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px] pointer-events-none" />

            <div className="w-full max-w-md space-y-8 relative z-10">
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
                        <Sparkles className="w-6 h-6 text-primary animate-pulse" />
                    </div>
                    <h1 className="text-2xl font-bold">Creating Your Magic</h1>
                    <p className="text-muted-foreground">
                        {jobState.message || "Initializing..."}
                    </p>
                </div>

                <Card className="border-border/50 backdrop-blur-sm bg-background/50">
                    <CardContent className="pt-6 space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm font-medium">
                                <span>Progress</span>
                                <span>{Math.round(jobState.progress)}%</span>
                            </div>
                            <Progress value={jobState.progress} className="h-2" />
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-sm">
                                {jobState.status === "training" ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                                ) : (
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                )}
                                <span className={jobState.status === "training" ? "text-foreground font-medium" : "text-muted-foreground"}>
                                    Training AI Model (5-10 mins)
                                </span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                {jobState.status === "generating" ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                                ) : jobState.status === "complete" ? (
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                ) : (
                                    <div className="w-4 h-4 rounded-full border-2 border-muted" />
                                )}
                                <span className={jobState.status === "generating" ? "text-foreground font-medium" : "text-muted-foreground"}>
                                    Generating 12 Expressions
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <p className="text-xs text-center text-muted-foreground">
                    You can close this page. We'll email you when it's ready.
                </p>
            </div>
        </div>
    )
}
