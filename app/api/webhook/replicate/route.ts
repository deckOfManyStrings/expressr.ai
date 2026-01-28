import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import Replicate from "replicate"

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
})

export async function POST(request: Request) {
    try {
        const body = await request.json()
        // Replicate webhook payload usually has 'status', 'id', 'output', etc.
        const { id, status, output } = body

        // In real implementation, verify webhook signature for security

        console.log(`Webhook received for training ${id}: ${status}`)

        const supabase = await createClient()

        // Find job by training_id
        const { data: job, error } = await supabase
            .from("jobs")
            .select("*")
            .eq("training_id", id)
            .single()

        if (error || !job) {
            // If not found by training ID (due to our mock implementation in Day 2 using random string),
            // we might fail here. In real app, training_id in DB matches Replicate ID.
            // For this demo context, we just log.
            console.error("Job not found for training ID:", id)
            return NextResponse.json({ received: true })
        }

        if (status === "succeeded") {
            // Update job with model URL (result of training)
            // output.weights is usually the URL for LoRA
            const modelUrl = output?.weights || "mock_model_url"

            await supabase
                .from("jobs")
                .update({
                    status: "generating_free",
                    model_version: modelUrl
                })
                .eq("id", job.id)

            // Trigger Free Expression Generation (Background Job)
            // In Vercel, we can't easily spawn background threads that live long.
            // Best practice: Use Inngest, Upstash QStash, or just fire-and-forget an API call securely.
            // For MVP: We will call an internal API endpoint that handles generation, without awaiting.

            // We need the full URL for fetch in server context (or use a helper function)
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

            fetch(`${appUrl}/api/jobs/generate-free`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ jobId: job.id, modelUrl })
            }).catch(err => console.error("Failed to trigger generation:", err))

        } else if (status === "failed" || status === "canceled") {
            await supabase
                .from("jobs")
                .update({
                    status: "failed",
                    error_message: "Training failed on provider side."
                })
                .eq("id", job.id)
        }

        return NextResponse.json({ received: true })

    } catch (error) {
        console.error("Webhook error:", error)
        return NextResponse.json({ error: "Webhook failed" }, { status: 500 })
    }
}
