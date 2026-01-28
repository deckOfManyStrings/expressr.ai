"use client"

import { Suspense, useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { PhotoUploader } from "@/components/PhotoUploader"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Sparkles } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { ConfirmTrainingDialog } from "@/components/ConfirmTrainingDialog"

// ... imports
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

// ...

function CreatePageContent() {
    const searchParams = useSearchParams()
    const email = searchParams.get("email")
    const router = useRouter()
    const [files, setFiles] = useState<File[]>([])
    const [isUploading, setIsUploading] = useState(false)
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const [hasSubmitted, setHasSubmitted] = useState(false)

    // Check if user already submitted recently
    useEffect(() => {
        if (email) {
            const key = `training_submitted_${email}`
            const lastSubmit = localStorage.getItem(key)
            if (lastSubmit) {
                const timeSince = Date.now() - parseInt(lastSubmit)
                if (timeSince < 30 * 60 * 1000) { // 30 minutes
                    setHasSubmitted(true)
                }
            }
        }
    }, [email])

    const handleUpload = (uploadedFiles: File[]) => {
        setFiles(uploadedFiles)
    }

    const handleGenerateClick = () => {
        if (files.length < 10) {
            toast.error("Please upload at least 10 photos")
            return
        }

        if (!email) {
            toast.error("Email is required")
            return
        }

        if (hasSubmitted) {
            toast.error("You've already started training recently. Check your email for the status link.")
            return
        }

        // Show confirmation dialog
        setShowConfirmDialog(true)
    }

    const handleConfirmTraining = async () => {
        setShowConfirmDialog(false)
        setIsUploading(true)

        try {
            // Create FormData with email and photos
            const formData = new FormData()
            formData.append("email", email!)

            files.forEach((file) => {
                formData.append("photos", file)
            })

            // Start training
            const res = await fetch("/api/train", {
                method: "POST",
                body: formData,
            })

            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.error || "Failed to start training")
            }

            const { job_id } = await res.json()

            // Mark as submitted in localStorage
            localStorage.setItem(`training_submitted_${email}`, Date.now().toString())
            setHasSubmitted(true)

            // toast.success("Training started!") 
            router.push(`/processing/${job_id}`)

        } catch (error: any) {
            console.error(error)
            toast.error(error.message || "Something went wrong")
            setIsUploading(false)
        }
    }

    // ... rest of component


    return (
        <main className="flex-1 max-w-md mx-auto w-full p-6 space-y-8">
            <div className="space-y-2 text-center">
                <h1 className="text-2xl font-bold">Upload Your Selfies</h1>
                <p className="text-muted-foreground">
                    We need 10-15 photos to learn your face.
                </p>
            </div>

            {/* Email Confirmation (Visual only for now) */}
            {email && (
                <div className="bg-muted/50 p-3 rounded-lg text-sm text-center text-muted-foreground">
                    Using email: <span className="font-medium text-foreground">{email}</span>
                </div>
            )}

            <PhotoUploader
                onUpload={handleUpload}
                minFiles={10}
                maxFiles={15}
            />

            {/* Instruction Tips */}
            <div className="space-y-3 text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-4 rounded-xl">
                <p className="font-medium text-blue-600 dark:text-blue-400">💡 Photo Tips for Best Results:</p>
                <ul className="space-y-1 list-disc list-inside">
                    <li><strong>Good lighting</strong> - Natural light works best, avoid harsh shadows</li>
                    <li><strong>Multiple angles</strong> - Front, left, right, slight up/down</li>
                    <li><strong>Clear face</strong> - No sunglasses, masks, or heavy filters</li>
                    <li><strong>Solo shots</strong> - Just you, no other people in frame</li>
                    <li><strong>Variety</strong> - Different backgrounds and expressions help</li>
                    <li><strong>High quality</strong> - Clear, in-focus photos (not blurry)</li>
                </ul>
            </div>

            <ConfirmTrainingDialog
                open={showConfirmDialog}
                onConfirm={handleConfirmTraining}
                onCancel={() => setShowConfirmDialog(false)}
                photoCount={files.length}
            />

            {/* Floating Bottom CTA for Mobile */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t safe-bottom z-10 sm:static sm:p-0 sm:bg-transparent sm:border-0">
                <div className="max-w-md mx-auto">
                    <Button
                        size="lg"
                        className="w-full text-lg shadow-lg shadow-primary/20"
                        onClick={handleGenerateClick}
                        disabled={isUploading || hasSubmitted}
                    >
                        <Sparkles className="w-5 h-5 mr-2" />
                        {hasSubmitted ? "Training Already Started" : "Generate My Expression Pack"}
                    </Button>
                </div>
            </div>
            <div className="h-20 sm:hidden" /> {/* Spacer for fixed bottom */}
        </main>
    )
}

export default function CreatePage() {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <header className="px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md z-10">
                <Link href="/" className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" /> Back
                </Link>
                <span className="font-bold text-lg">Expressr.ai</span>
                <div className="w-10" /> {/* Spacer */}
            </header>

            <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
                <CreatePageContent />
            </Suspense>
        </div>
    )
}
