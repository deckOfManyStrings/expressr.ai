"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Progress } from "@/components/ui/progress"
// import { useInterval } from "@/hooks/use-interval" // shadcn doesn't have useInterval, native JS setInterval is fine or custom hook
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"

export default function StatusPage({ params }: { params: { id: string } }) {
    const [job, setJob] = useState<any>(null)
    const [polling, setPolling] = useState(true)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        let interval: NodeJS.Timeout

        const checkStatus = async () => {
            if (!polling) return

            const { data, error } = await supabase
                .from("jobs")
                .select("*")
                .eq("id", params.id)
                .single()

            if (error) {
                console.error("Error fetching job:", error)
                return
            }

            setJob(data)

            if (data.status === "completed_free") {
                setPolling(false)
                router.push(`/view/${params.id}`)
            } else if (data.status === "failed") {
                setPolling(false)
            }
        }

        checkStatus() // Initial check
        interval = setInterval(checkStatus, 5000) // Poll every 5s

        return () => clearInterval(interval)
    }, [params.id, polling, router, supabase])

    if (!job) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    const isTraining = job.status === "training" || job.status === "uploading"
    const isGenerating = job.status === "generating_free"
    const progress = isTraining ? 45 : isGenerating ? 85 : 100

    return (
        <div className="min-h-screen bg-muted/30 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-background border rounded-2xl p-8 shadow-sm space-y-8 text-center">

                {/* Status Icon */}
                <div className="flex justify-center">
                    {job.status === "failed" ? (
                        <div className="bg-destructive/10 p-4 rounded-full">
                            <AlertCircle className="w-12 h-12 text-destructive" />
                        </div>
                    ) : (
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                            <div className="bg-primary/10 p-4 rounded-full relative">
                                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Text */}
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold">
                        {job.status === "uploading" && "Uploading Photos..."}
                        {job.status === "training" && "Training AI Model..."}
                        {job.status === "generating_free" && "Generating Expressions..."}
                        {job.status === "failed" && "Training Failed"}
                    </h1>
                    <p className="text-muted-foreground">
                        {job.status === "training" && "This takes about 10 minutes. We'll email you when it's done."}
                        {job.status === "generating_free" && "Almost there! Creating your first 3 expressions."}
                        {job.status === "failed" && "Something went wrong. Please try again or contact support."}
                    </p>
                </div>

                {/* Progress Bar */}
                {job.status !== "failed" && (
                    <div className="space-y-2">
                        <Progress value={progress} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Training</span>
                            <span>Generating</span>
                            <span>Done</span>
                        </div>
                    </div>
                )}

                {/* Failure Actions */}
                {job.status === "failed" && (
                    <p className="text-sm">
                        <a href="/create" className="text-primary hover:underline">Try Again</a>
                    </p>
                )}

                {/* Warning */}
                {job.status !== "failed" && (
                    <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg text-xs text-amber-700 dark:text-amber-400">
                        You can safely close this tab. We'll email you when your expressions are ready.
                    </div>
                )}

            </div>
        </div>
    )
}
