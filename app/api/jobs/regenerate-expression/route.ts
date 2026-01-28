import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import Replicate from "replicate"
import { z } from "zod"

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
})

const regenerateSchema = z.object({
    jobId: z.string().uuid(),
    expressionName: z.string(),
})

// Expression prompts (same as generate-free and generate-full)
const EXPRESSION_PROMPTS: Record<string, { prompt: string, emoji: string, isPaid: boolean }> = {
    "Happy": {
        prompt: "TOK person, extremely happy, wide open smile showing teeth, laughing eyes, pure joy, full head visible, head and shoulders portrait, soft studio lighting, neutral background, even illumination, high quality, youtube thumbnail style, 8k",
        emoji: "😊",
        isPaid: false
    },
    "Sad": {
        prompt: "TOK person, very sad expression, closed mouth, frowning downturned mouth, pouting lips, big teary eyes, upset, full head visible, head and shoulders portrait, soft studio lighting, neutral background, even illumination, high quality, youtube thumbnail style, 8k",
        emoji: "😢",
        isPaid: false
    },
    "Angry": {
        prompt: "TOK person, extremely angry facial expression, eyebrows down and together, gritted teeth showing, mouth open yelling, veins visible, fierce intense rage, confrontational, aggressive look, full head visible, head and shoulders portrait, soft studio lighting, neutral background, even illumination, high quality, youtube thumbnail style, 8k",
        emoji: "😠",
        isPaid: false
    },
    "Shocked": {
        prompt: "TOK person, extremely shocked expression, jaw dropped wide open, eyes huge and bulging out, eyebrows raised high, hands on both cheeks, gasping in disbelief, full head visible, head and shoulders portrait, soft studio lighting, neutral background, even illumination, high quality, youtube thumbnail style, 8k",
        emoji: "😱",
        isPaid: true
    },
    "Excited": {
        prompt: "TOK person, extremely excited expression, huge bright smile showing teeth, eyes wide and sparkling with joy, eyebrows raised, hands raised up in celebration, energetic and enthusiastic, full head visible, head and shoulders portrait, soft studio lighting, neutral background, even illumination, high quality, youtube thumbnail style, 8k",
        emoji: "🤩",
        isPaid: true
    },
    "Thinking": {
        prompt: "TOK person, deep thinking expression, hand touching chin or stroking beard, eyes looking up and to the side, eyebrows slightly furrowed, mouth closed in contemplation, pensive and thoughtful, full head visible, head and shoulders portrait, soft studio lighting, neutral background, even illumination, high quality, youtube thumbnail style, 8k",
        emoji: "🤔",
        isPaid: true
    },
    "Laughing": {
        prompt: "TOK person, laughing hysterically, eyes squeezed shut with laugh lines, mouth wide open showing teeth, head tilted back slightly, tears of joy, pure amusement and happiness, full head visible, head and shoulders portrait, soft studio lighting, neutral background, even illumination, high quality, youtube thumbnail style, 8k",
        emoji: "😂",
        isPaid: true
    },
    "Surprised": {
        prompt: "TOK person, surprised expression, eyebrows raised high, eyes wide open, mouth forming an O shape, slight gasp, caught off guard but not shocked, full head visible, head and shoulders portrait, soft studio lighting, neutral background, even illumination, high quality, youtube thumbnail style, 8k",
        emoji: "😲",
        isPaid: true
    },
    "Confused": {
        prompt: "TOK person, confused expression, one eyebrow raised higher than the other, eyes squinted slightly, mouth twisted to one side, head tilted, hand scratching head or temple, puzzled and questioning, full head visible, head and shoulders portrait, soft studio lighting, neutral background, even illumination, high quality, youtube thumbnail style, 8k",
        emoji: "🤨",
        isPaid: true
    },
    "Serious": {
        prompt: "TOK person, serious professional expression, straight face with no smile, eyes looking directly at camera with intensity, eyebrows neutral, mouth closed in firm line, confident and authoritative, full head visible, head and shoulders portrait, soft studio lighting, neutral background, even illumination, high quality, youtube thumbnail style, 8k",
        emoji: "😐",
        isPaid: true
    },
    "Smirking": {
        prompt: "TOK person, smirking expression, one corner of mouth raised in half smile, eyes looking sideways with confidence, eyebrows slightly raised, knowing and mischievous look, cool and self-assured, full head visible, head and shoulders portrait, soft studio lighting, neutral background, even illumination, high quality, youtube thumbnail style, 8k",
        emoji: "😏",
        isPaid: true
    },
    "Disgusted": {
        prompt: "TOK person, disgusted expression, nose wrinkled and scrunched up, upper lip curled, eyes squinted, mouth open showing tongue slightly, repulsed and grossed out, full head visible, head and shoulders portrait, soft studio lighting, neutral background, even illumination, high quality, youtube thumbnail style, 8k",
        emoji: "🤢",
        isPaid: true
    },
}

const MAX_REGENERATIONS = 3

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { jobId, expressionName } = regenerateSchema.parse(body)

        const supabase = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // 1. Get job and verify ownership
        const { data: job, error: jobError } = await supabase
            .from("jobs")
            .select("*")
            .eq("id", jobId)
            .single()

        if (jobError || !job) {
            return NextResponse.json({ error: "Job not found" }, { status: 404 })
        }

        // 2. Check if expression exists in prompts
        const expressionConfig = EXPRESSION_PROMPTS[expressionName]
        if (!expressionConfig) {
            return NextResponse.json({ error: "Invalid expression name" }, { status: 400 })
        }

        // 3. Check if user has access to this expression (free vs paid)
        if (expressionConfig.isPaid && !job.is_paid) {
            return NextResponse.json({ error: "This expression requires payment" }, { status: 402 })
        }

        // 4. Find existing expression in job
        const expressions = Array.isArray(job.expressions_urls) ? job.expressions_urls : []
        const existingExpressionIndex = expressions.findIndex(
            (expr: any) => expr.name === expressionName || expr.expression === expressionName
        )

        if (existingExpressionIndex === -1) {
            return NextResponse.json({ error: "Expression not found in job" }, { status: 404 })
        }

        const existingExpression = expressions[existingExpressionIndex]
        const currentCount = existingExpression.regenerationCount || 0

        // 5. Check regeneration limit
        if (currentCount >= MAX_REGENERATIONS) {
            return NextResponse.json({
                error: "Maximum regeneration limit reached",
                regenerationCount: currentCount,
                remainingAttempts: 0
            }, { status: 429 })
        }

        // 6. Generate new image
        console.log(`Regenerating ${expressionName} for job ${jobId} (attempt ${currentCount + 1}/${MAX_REGENERATIONS})`)

        const output = await replicate.run(job.model_version, {
            input: {
                prompt: expressionConfig.prompt,
                num_outputs: 1,
                aspect_ratio: "1:1",
                output_format: "jpg",
                output_quality: 100,
            }
        })

        // 7. Handle output (same logic as generate-free/full)
        let imageUrl: string | null = null
        if (Array.isArray(output) && output.length > 0) {
            imageUrl = output[0]
        } else if (typeof output === 'string') {
            imageUrl = output
        }

        if (!imageUrl) {
            throw new Error("No image URL returned from Replicate")
        }

        // 8. Download and upload to Supabase
        const imageResponse = await fetch(imageUrl)
        const imageBuffer = await imageResponse.arrayBuffer()
        const fileName = `${expressionName}-${Date.now()}.jpg`

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from("generated-images")
            .upload(`${jobId}/${fileName}`, imageBuffer, {
                contentType: "image/jpeg",
                upsert: false
            })

        if (uploadError) {
            console.error("Upload error:", uploadError)
            throw new Error("Failed to upload image")
        }

        const { data: publicUrlData } = supabase.storage
            .from("generated-images")
            .getPublicUrl(`${jobId}/${fileName}`)

        const newImageUrl = publicUrlData.publicUrl

        // 9. Update expression in database
        const updatedExpression = {
            ...existingExpression,
            url: newImageUrl,
            regenerationCount: currentCount + 1
        }

        expressions[existingExpressionIndex] = updatedExpression

        const { error: updateError } = await supabase
            .from("jobs")
            .update({
                expressions_urls: expressions
            })
            .eq("id", jobId)

        if (updateError) {
            console.error("Failed to update job:", JSON.stringify(updateError, null, 2))
            throw new Error(`Failed to update database: ${updateError.message || updateError.code}`)
        }

        console.log(`✅ Regenerated ${expressionName} successfully`)

        return NextResponse.json({
            success: true,
            newUrl: newImageUrl,
            regenerationCount: currentCount + 1,
            remainingAttempts: MAX_REGENERATIONS - (currentCount + 1)
        })

    } catch (error) {
        console.error("Regeneration failed:", error)
        return NextResponse.json({
            error: error instanceof Error ? error.message : "Regeneration failed"
        }, { status: 500 })
    }
}
