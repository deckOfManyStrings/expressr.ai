import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import Replicate from "replicate"
import { z } from "zod"

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
})

const generateSchema = z.object({
    jobId: z.string().uuid(),
})

const FULL_EXPRESSIONS = [
    // The first 3 are already generated, we skip or regenerate if we want consistency.
    // We'll regenerate all or check existing. For simplicity, let's assume we append or just overwrite with full set.
    // Actually, let's just generate the new 9.
    { name: "Shocked", emoji: "😱", isPaid: true, prompt: "TOK person with shocked expression, open mouth, wide eyes, disbelief" },
    { name: "Excited", emoji: "🤩", isPaid: true, prompt: "TOK person with excited expression, star struck, amazed, enthusiastic" },
    { name: "Thinking", emoji: "🤔", isPaid: true, prompt: "TOK person thinking, hand on chin, pensive expression, deep thought" },
    { name: "Laughing", emoji: "😂", isPaid: true, prompt: "TOK person laughing hard, tears of joy, huge smile, closed eyes" },
    { name: "Surprised", emoji: "😲", isPaid: true, prompt: "TOK person surprised, raised eyebrows, caught off guard" },
    { name: "Confused", emoji: "🤨", isPaid: true, prompt: "TOK person confused, one eyebrow raised, questioning look" },
    { name: "Serious", emoji: "😐", isPaid: true, prompt: "TOK person with serious expression, flat affect, straight face, professional headshot" },
    { name: "Smirking", emoji: "😏", isPaid: true, prompt: "TOK person smirking, confident, side smile, cool" },
    { name: "Disgusted", emoji: "🤢", isPaid: true, prompt: "TOK person disgusted, crinkled nose, repulsed expression" },
]

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { jobId } = generateSchema.parse(body)
        const supabase = await createClient()

        // 1. Verify Job and Payment
        const { data: job, error } = await supabase
            .from("jobs")
            .select("*")
            .eq("id", jobId)
            .single()

        if (error || !job) {
            return NextResponse.json({ error: "Job not found" }, { status: 404 })
        }

        if (!job.paid) {
            return NextResponse.json({ error: "Job not paid" }, { status: 402 })
        }

        // 2. Generate Images
        const generationPromises = FULL_EXPRESSIONS.map(async (expr) => {
            // MOCK GENERATION
            await new Promise(r => setTimeout(r, 2200)) // Slight delay variation
            const mockUrl = `https://placehold.co/800x800?text=${expr.name}`

            return {
                name: expr.name,
                emoji: expr.emoji,
                url: mockUrl,
                isPaid: expr.isPaid
            }
        })

        const newResults = await Promise.all(generationPromises)

        // Combine with existing expressions
        // job.expressions_urls is JSONB, so it comes as array
        const existing = Array.isArray(job.expressions_urls) ? job.expressions_urls : []
        const allExpressions = [...existing, ...newResults]

        // 3. Update Job
        await supabase
            .from("jobs")
            .update({
                status: "completed_full",
                expressions_urls: allExpressions,
                updated_at: new Date().toISOString()
            })
            .eq("id", jobId)

        // 4. Send "Full Pack Ready" Email (Day 5 task, or can do now)
        // We will leave this for Day 5 PDF task or assume user refreshes page

        return NextResponse.json({ success: true, count: allExpressions.length })

    } catch (error) {
        console.error("Full generation failed:", error)
        return NextResponse.json({ error: "Generation failed" }, { status: 500 })
    }
}
