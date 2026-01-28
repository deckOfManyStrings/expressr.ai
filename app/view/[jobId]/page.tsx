"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Download, Loader2, Share2, ArrowLeft, Lock, RefreshCw } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"

type Job = {
    status: string
    images: Array<{ expression: string, name?: string, url: string, regenerationCount?: number }>
    error?: string
    is_paid: boolean
}

export default function ViewPage() {
    const params = useParams()
    const jobId = params.jobId as string
    const router = useRouter()
    const [job, setJob] = useState<Job | null>(null)
    const [loading, setLoading] = useState(true)
    const [checkingOut, setCheckingOut] = useState(false)
    const [regenerating, setRegenerating] = useState<string | null>(null)

    useEffect(() => {
        let interval: NodeJS.Timeout

        const fetchJob = async () => {
            try {
                const res = await fetch(`/api/status/${jobId}`)
                if (!res.ok) throw new Error("Failed to fetch job")
                const data = await res.json()
                setJob(data)

                // Keep polling if generating premium or still training/generating
                if (data.status === "generating_premium" || data.status === "training" || data.status === "generating") {
                    // Poll will continue via interval
                } else if (interval) {
                    clearInterval(interval)
                }
            } catch (error) {
                console.error("Error fetching job:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchJob()

        // Setup polling
        interval = setInterval(fetchJob, 3000)

        return () => clearInterval(interval)
    }, [jobId])

    const handleDownload = async (url: string, filename: string) => {
        try {
            const response = await fetch(url)
            const blob = await response.blob()
            const link = document.createElement("a")
            link.href = window.URL.createObjectURL(blob)
            link.download = filename
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        } catch (error) {
            console.error("Download failed:", error)
        }
    }

    const handleUnlock = async () => {
        setCheckingOut(true)
        try {
            const res = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ jobId }),
            })
            const data = await res.json()
            if (data.url) {
                window.location.href = data.url
            } else {
                toast.error("Failed to start checkout")
            }
        } catch (error) {
            console.error("Checkout error:", error)
            toast.error("Something went wrong")
        } finally {
            setCheckingOut(false)
        }
    }

    const handleRegenerate = async (expressionName: string) => {
        setRegenerating(expressionName)
        try {
            const res = await fetch("/api/jobs/regenerate-expression", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ jobId, expressionName }),
            })

            const data = await res.json()

            if (!res.ok) {
                toast.error(data.error || "Failed to regenerate")
                return
            }

            // Update the job state with new image
            if (job) {
                const updatedImages = job.images.map(img => {
                    if (img.expression === expressionName || img.name === expressionName) {
                        return {
                            ...img,
                            url: data.newUrl,
                            regenerationCount: data.regenerationCount
                        }
                    }
                    return img
                })
                setJob({ ...job, images: updatedImages })
            }

            toast.success(`${expressionName} regenerated! (${data.remainingAttempts} attempts left)`)
        } catch (error) {
            console.error("Regeneration error:", error)
            toast.error("Failed to regenerate expression")
        } finally {
            setRegenerating(null)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!job || (job.status !== "complete" && job.status !== "complete_free" && job.status !== "generating_premium")) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4">
                <h1 className="text-2xl font-bold">Pack Not Ready</h1>
                <p className="text-muted-foreground">This expression pack is still processing or wasn't found.</p>
                <Link href={`/status/${jobId}`}>
                    <Button>Check Status</Button>
                </Link>
            </div>
        )
    }

    // Determine current state
    // Paid if status is complete OR generating_premium (webhook sets this)
    const isPaid = job.status === "complete" || job.status === "generating_premium" || job.is_paid;
    // Show premium content if complete. If generating_premium, show specific loading state.
    const isGeneratingPremium = job.status === "generating_premium";

    // Fallback for older jobs or manual paid updates
    const isLocked = !isPaid;

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="w-4 h-4" /> Back
                    </Link>
                    <h1 className="font-bold text-lg hidden sm:block">Your Expressions</h1>
                    <div className="flex gap-2">
                        {isLocked && (
                            <Button size="sm" onClick={handleUnlock} disabled={checkingOut}>
                                {checkingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : "Unlock Full Pack ($9.99)"}
                            </Button>
                        )}
                        <Button variant="outline" size="sm" className="gap-2">
                            <Share2 className="w-4 h-4" /> Share
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto p-6 space-y-8">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {job.images
                        .filter(img => img.url && typeof img.url === 'string' && img.url.length > 0)
                        .map((img, idx) => {
                            const isImageLocked = isLocked && idx >= 3;
                            return (
                                <Card key={idx} className={`overflow-hidden group relative ${isImageLocked ? "border-muted-foreground/20" : ""}`}>
                                    <CardContent className="p-0 aspect-square relative selection:bg-none">
                                        <Image
                                            src={img.url}
                                            alt={`${img.expression || img.name || 'Expression'} expression`}
                                            fill
                                            className={`object-cover transition-transform duration-500
                                            ${isImageLocked ? "blur-md brightness-[0.4] scale-105" : "group-hover:scale-105"}
                                            ${regenerating === (img.expression || img.name) ? "opacity-50" : ""}
                                        `}
                                            unoptimized
                                            loading={idx < 2 ? "eager" : "lazy"}
                                        />

                                        {/* Regenerating Loader Overlay */}
                                        {regenerating === (img.expression || img.name) && (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-20">
                                                <Loader2 className="w-12 h-12 animate-spin text-white mb-2" />
                                                <span className="text-white text-sm font-medium">Regenerating...</span>
                                            </div>
                                        )}

                                        {isImageLocked ? (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/90 gap-2">
                                                <Lock className="w-8 h-8 opacity-80" />
                                                <span className="text-xs font-semibold uppercase tracking-wider">Premium Style</span>
                                            </div>
                                        ) : (
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <Button
                                                    size="icon"
                                                    variant="secondary"
                                                    className="rounded-full"
                                                    onClick={() => handleDownload(img.url, `expressr-${img.expression}.webp`)}
                                                >
                                                    <Download className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="secondary"
                                                    className="rounded-full"
                                                    onClick={() => handleRegenerate(img.expression || img.name || '')}
                                                    disabled={regenerating === (img.expression || img.name) || (img.regenerationCount || 0) >= 3}
                                                >
                                                    {regenerating === (img.expression || img.name) ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <RefreshCw className="w-4 h-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                    <div className="p-3 border-t bg-card relative z-10">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium capitalize flex items-center gap-1">
                                                <span className="truncate">{img.expression || img.name || 'Expression'}</span>
                                                {isImageLocked && <Lock className="w-3 h-3 text-muted-foreground" />}
                                            </p>
                                            {!isImageLocked && (
                                                <span className="text-xs text-muted-foreground">
                                                    {3 - (img.regenerationCount || 0)} left
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            )
                        })}

                    {/* Ghost/Loading placeholders for Generating Premium */}
                    {isGeneratingPremium && job.images.length < 12 && Array.from({ length: 12 - job.images.length }).map((_, i) => (
                        <Card key={`loading-${i}`} className="overflow-hidden relative border-primary/20 bg-primary/5 animate-pulse">
                            <CardContent className="p-0 aspect-square relative flex items-center justify-center">
                                <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
                            </CardContent>
                            <div className="p-3 border-t bg-card relative z-10">
                                <p className="text-sm font-medium capitalize text-center text-muted-foreground">Generating...</p>
                            </div>
                        </Card>
                    ))}

                    {/* Placeholder slots for Free Tier (Locked view) if we only have 3 images but want to show 12 slots */}
                    {/* Actually, if status is complete_free, we only have 3 images in job.images. 
                         We should show 9 "Locked" slots to entice user. */}
                    {isLocked && job.images.length === 3 && ["Shocked", "Excited", "Thinking", "Laughing", "Surprised", "Confused", "Serious", "Smirking", "Disgusted"].map((expressionName, i) => (
                        <Card key={`locked-${i}`} className="overflow-hidden relative border-muted-foreground/20">
                            <CardContent className="p-0 aspect-square relative flex items-center justify-center bg-muted/10">
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/50 gap-2">
                                    <Lock className="w-8 h-8 opacity-50" />
                                    <span className="text-xs font-semibold uppercase tracking-wider">Premium Style</span>
                                </div>
                            </CardContent>
                            <div className="p-3 border-t bg-card relative z-10">
                                <p className="text-sm font-medium capitalize text-center text-muted-foreground">{expressionName}</p>
                            </div>
                        </Card>
                    ))}
                </div>

                {isLocked ? (
                    <div className="fixed bottom-6 left-0 right-0 px-6 z-20 pointer-events-none">
                        <div className="max-w-xl mx-auto bg-foreground text-background p-4 rounded-full shadow-2xl flex items-center justify-between pointer-events-auto">
                            <div className="pl-4">
                                <p className="font-bold">Unlock 9 more expressions</p>
                                <p className="text-xs opacity-80">High quality, watermark-free</p>
                            </div>
                            <Button size="lg" variant="secondary" onClick={handleUnlock} disabled={checkingOut} className="rounded-full px-8">
                                {checkingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : "Unlock for $9.99"}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-10 space-y-4">
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold">🎉 Collection Unlocked!</h2>
                            <p className="text-muted-foreground">Thank you for your purchase. Enjoy your expressions!</p>
                        </div>
                        <Button variant="outline" size="lg" className="gap-2" onClick={() => window.open(`/api/download/pdf?job_id=${jobId}`, '_blank')}>
                            <Download className="w-4 h-4" /> Download PDF Booklet
                        </Button>
                    </div>
                )}
            </main>
        </div>
    )
}
