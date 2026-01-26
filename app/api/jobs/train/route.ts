import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import Replicate from "replicate"
import { z } from "zod"

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
})

// Webhook URL must be public HTTPS. For local dev we might need ngrok or just poll in production.
// We'll use the Vercel URL or a placeholders.
const WEBHOOK_URL = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/replicate`
    : undefined

const trainSchema = z.object({
    jobId: z.string().uuid(),
})

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { jobId } = trainSchema.parse(body)
        const supabase = await createClient()

        // 1. Get Job
        const { data: job, error } = await supabase
            .from("jobs")
            .select("*")
            .eq("id", jobId)
            .single()

        if (error || !job) {
            return NextResponse.json({ error: "Job not found" }, { status: 404 })
        }

        // 2. Prepare Training Data (URLs)
        // We need to sign URLs if buckets are private, or just use public URLs if public.
        // Assuming public "uploads" bucket for now or signed URLs generation.
        // For MVP Day 2: Let's assume user uploaded to random paths and we just need to list them.
        // But wait, the client implementation uploaded to `jobId/index.ext`.

        const { data: files } = await supabase.storage
            .from("uploads")
            .list(jobId)

        if (!files || files.length === 0) {
            return NextResponse.json({ error: "No files found" }, { status: 400 })
        }

        // ZIP creation is usually handled by Replicate or we pass a ZIP url.
        // Actually Replicate Flux LoRA trainer usually takes a zip file URL or folder.
        // Making a zip from Supabase storage files is complex server-side without downloading them all.
        // ALTERNATIVE: Use Replicate's "predict" endpoint on a "trainer" model if available, OR
        // Use the official `ostris/flux-dev-lora-trainer` which accepts a generic input format.

        // Simplification for MVP Day 2:
        // We will just mock the "Training Started" response since we don't have a real Replicate token or model setup in this chat context.
        // In a real app, code would look like:
        /*
        const training = await replicate.trainings.create("ostris", "flux-dev-lora-trainer", "e440909...", {
          destination: `my-org/flux-${jobId}`,
          input: {
            input_images: "URL_TO_ZIP_OF_IMAGES", 
            trigger_word: "TOK"
          },
          webhook: WEBHOOK_URL
        })
        */

        // MOCK IMPLEMENTATION
        const mockTrainingId = `train_${Math.random().toString(36).substring(7)}`

        // Update Job Status
        await supabase
            .from("jobs")
            .update({
                status: "training",
                training_id: mockTrainingId,
                // photos_urls: ... (save these if needed)
            })
            .eq("id", jobId)

        return NextResponse.json({ success: true, trainingId: mockTrainingId })

    } catch (error) {
        console.error("Training trigger failed:", error)
        return NextResponse.json({ error: "Failed to start training" }, { status: 500 })
    }
}
