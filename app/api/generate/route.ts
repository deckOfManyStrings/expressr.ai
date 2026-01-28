import { NextResponse } from "next/server";
import Replicate from "replicate";
import { createClient } from "@supabase/supabase-js";

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 12 expression prompts
const EXPRESSIONS = [
    { name: "happy", prompt: "smiling warmly, genuine happiness, bright eyes" },
    { name: "sad", prompt: "looking sad, downcast eyes, melancholic expression" },
    { name: "angry", prompt: "angry expression, furrowed brows, intense gaze" },
    { name: "surprised", prompt: "surprised, wide eyes, mouth slightly open" },
    { name: "confused", prompt: "confused, puzzled expression, raised eyebrow" },
    { name: "excited", prompt: "excited, energetic, enthusiastic expression" },
    { name: "thinking", prompt: "thoughtful, contemplative, hand on chin" },
    { name: "laughing", prompt: "laughing heartily, joyful, eyes closed" },
    { name: "crying", prompt: "crying, tears, emotional, sad" },
    { name: "shocked", prompt: "shocked, jaw dropped, eyes wide open" },
    { name: "smirking", prompt: "smirking, sly smile, confident" },
    { name: "neutral", prompt: "neutral expression, calm, professional headshot" },
];

export async function POST(request: Request) {
    try {
        const { job_id, model_version } = await request.json();

        if (!job_id || !model_version) {
            return NextResponse.json(
                { error: "job_id and model_version are required" },
                { status: 400 }
            );
        }

        console.log(`Generating expressions for job ${job_id} with model ${model_version}`);

        // Generate all 12 expressions in parallel
        const generationPromises = EXPRESSIONS.map(async (expression) => {
            try {
                const output = await replicate.run(
                    model_version as `${string}/${string}:${string}`,
                    {
                        input: {
                            prompt: `A professional headshot photo of TOK ${expression.prompt}, studio lighting, high quality, 4k`,
                            num_outputs: 1,
                            aspect_ratio: "1:1",
                            output_format: "webp",
                            output_quality: 90,
                        },
                    }
                );

                // Extract URL from output (format varies by model)
                const imageUrl = Array.isArray(output) ? output[0] : output;

                return {
                    expression: expression.name,
                    url: imageUrl,
                };
            } catch (error) {
                console.error(`Failed to generate ${expression.name}:`, error);
                return {
                    expression: expression.name,
                    url: null,
                    error: error instanceof Error ? error.message : "Generation failed",
                };
            }
        });

        const results = await Promise.all(generationPromises);

        // Filter out failed generations
        const successfulImages = results.filter((r) => r.url !== null);

        // Update job with generated images
        const { error: updateError } = await supabase
            .from("jobs")
            .update({
                images: successfulImages,
                status: successfulImages.length === 12 ? "complete" : "failed",
                error_message:
                    successfulImages.length < 12
                        ? `Only ${successfulImages.length}/12 expressions generated`
                        : null,
                completed_at: new Date().toISOString(),
            })
            .eq("id", job_id);

        if (updateError) {
            console.error("Failed to update job with images:", updateError);
            return NextResponse.json(
                { error: "Failed to save generated images" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            images: successfulImages,
            total: successfulImages.length,
        });

    } catch (error: any) {
        console.error("Generation failed:", error);
        return NextResponse.json(
            { error: `Generation failed: ${error.message}` },
            { status: 500 }
        );
    }
}
