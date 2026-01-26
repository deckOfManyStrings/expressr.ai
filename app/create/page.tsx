"use client"

import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import { PhotoUploader } from "@/components/PhotoUploader"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Sparkles } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

function CreatePageContent() {
    const searchParams = useSearchParams()
    const email = searchParams.get("email")
    const [files, setFiles] = useState<File[]>([])

    const handleUpload = (uploadedFiles: File[]) => {
        setFiles(uploadedFiles)
    }

    const handleGenerate = () => {
        if (files.length < 10) {
            toast.error("Please upload at least 10 photos")
            return
        }
        // TODO: Implement API call
        toast.success("Starting training... (Day 2 task)")
    }

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
                <p className="font-medium text-blue-600 dark:text-blue-400">💡 Photo Tips:</p>
                <ul className="space-y-1 list-disc list-inside">
                    <li>Good lighting (no harsh shadows)</li>
                    <li>Different angles (left, right, straight)</li>
                    <li>Just you (no other people)</li>
                    <li>No sunglasses or masks</li>
                </ul>
            </div>

            {/* Floating Bottom CTA for Mobile */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t safe-bottom z-10 sm:static sm:p-0 sm:bg-transparent sm:border-0">
                <div className="max-w-md mx-auto">
                    <Button
                        size="lg"
                        className="w-full text-lg shadow-lg shadow-primary/20"
                        onClick={handleGenerate}
                    >
                        <Sparkles className="w-5 h-5 mr-2" />
                        Generate My Expression Pack
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
