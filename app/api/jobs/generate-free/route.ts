import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import Replicate from "replicate"
import { z } from "zod"
import { sendFreePackReadyEmail } from "@/lib/email"

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
})

const generateSchema = z.object({
    jobId: z.string().uuid(),
    modelUrl: z.string(),
})

const EXPRESSIONS = [
    { name: "Happy", emoji: "😊", isPaid: false, prompt: "TOK person with genuine happiness, warm bright smile, joyful eyes, friendly welcoming expression" },
    { name: "Sad", emoji: "😢", isPaid: false, prompt: "TOK person with sadness, downturned mouth, melancholic expression, sad eyes" },
    { name: "Angry", emoji: "😠", isPaid: false, prompt: "TOK person with intense anger, furrowed brow, aggressive expression, stern face" },
]

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { jobId, modelUrl } = generateSchema.parse(body)
        const supabase = await createClient()

        // 1. Verify Job
        const { data: job, error } = await supabase
            .from("jobs")
            .select("*")
            .eq("id", jobId)
            .single()

        if (error || !job) {
            return NextResponse.json({ error: "Job not found" }, { status: 404 })
        }

        // 2. Generate Images
        // We will simulate parallel generation
        const generationPromises = EXPRESSIONS.map(async (expr) => {
            // In real app, call Replicate
            /*
            const output = await replicate.run(
              modelUrl,
              { input: { prompt: expr.prompt, num_inference_steps: 25 } }
            )
            */

            // MOCK GENERATION
            // Simulate 2s delay
            await new Promise(r => setTimeout(r, 2000))
            const mockUrl = `https://placehold.co/800x800?text=${expr.name}` // Placeholder image

            return {
                name: expr.name,
                emoji: expr.emoji,
                url: mockUrl,
                isPaid: expr.isPaid
            }
        })

        const results = await Promise.all(generationPromises)

        // 3. Update Job
        await supabase
            .from("jobs")
            .update({
                status: "completed_free",
                expressions_urls: results,
                completed_at: new Date().toISOString()
            })
            .eq("id", jobId)

        // 4. Send Email
        await sendFreePackReadyEmail(job.email, jobId, results)

        return NextResponse.json({ success: true, count: results.length })

    } catch (error) {
        console.error("Generation failed:", error)
        return NextResponse.json({ error: "Generation failed" }, { status: 500 })
    }
}
