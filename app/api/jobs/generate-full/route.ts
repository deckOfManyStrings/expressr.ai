import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import Replicate from "replicate"
import { z } from "zod"

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
})

const generateSchema = z.object({
    jobId: z.string().uuid(),
})

// Updated prompts for YouTube Thumbnail style: Neutral lighting, high quality, clean background
const FULL_EXPRESSIONS = [
    { name: "Shocked", emoji: "😱", isPaid: true, prompt: "TOK person, extremely shocked expression, jaw dropped wide open, eyes huge and bulging out, eyebrows raised high, hands on both cheeks, gasping in disbelief, full head visible, head and shoulders portrait, soft studio lighting, neutral background, even illumination, high quality, youtube thumbnail style, 8k" },
    { name: "Excited", emoji: "🤩", isPaid: true, prompt: "TOK person, extremely excited expression, huge bright smile showing teeth, eyes wide and sparkling with joy, eyebrows raised, hands raised up in celebration, energetic and enthusiastic, full head visible, head and shoulders portrait, soft studio lighting, neutral background, even illumination, high quality, youtube thumbnail style, 8k" },
    { name: "Thinking", emoji: "🤔", isPaid: true, prompt: "TOK person, deep thinking expression, hand touching chin or stroking beard, eyes looking up and to the side, eyebrows slightly furrowed, mouth closed in contemplation, pensive and thoughtful, full head visible, head and shoulders portrait, soft studio lighting, neutral background, even illumination, high quality, youtube thumbnail style, 8k" },
    { name: "Laughing", emoji: "😂", isPaid: true, prompt: "TOK person, laughing hysterically, eyes squeezed shut with laugh lines, mouth wide open showing teeth, head tilted back slightly, tears of joy, pure amusement and happiness, full head visible, head and shoulders portrait, soft studio lighting, neutral background, even illumination, high quality, youtube thumbnail style, 8k" },
    { name: "Surprised", emoji: "😲", isPaid: true, prompt: "TOK person, surprised expression, eyebrows raised high, eyes wide open, mouth forming an O shape, slight gasp, caught off guard but not shocked, full head visible, head and shoulders portrait, soft studio lighting, neutral background, even illumination, high quality, youtube thumbnail style, 8k" },
    { name: "Confused", emoji: "🤨", isPaid: true, prompt: "TOK person, confused expression, one eyebrow raised higher than the other, eyes squinted slightly, mouth twisted to one side, head tilted, hand scratching head or temple, puzzled and questioning, full head visible, head and shoulders portrait, soft studio lighting, neutral background, even illumination, high quality, youtube thumbnail style, 8k" },
    { name: "Serious", emoji: "😐", isPaid: true, prompt: "TOK person, serious professional expression, straight face with no smile, eyes looking directly at camera with intensity, eyebrows neutral, mouth closed in firm line, confident and authoritative, full head visible, head and shoulders portrait, soft studio lighting, neutral background, even illumination, high quality, youtube thumbnail style, 8k" },
    { name: "Smirking", emoji: "😏", isPaid: true, prompt: "TOK person, smirking expression, one corner of mouth raised in half smile, eyes looking sideways with confidence, eyebrows slightly raised, knowing and mischievous look, cool and self-assured, full head visible, head and shoulders portrait, soft studio lighting, neutral background, even illumination, high quality, youtube thumbnail style, 8k" },
    { name: "Disgusted", emoji: "🤢", isPaid: true, prompt: "TOK person, disgusted expression, nose wrinkled and scrunched up, upper lip curled, eyes squinted, mouth open showing tongue slightly, repulsed and grossed out, full head visible, head and shoulders portrait, soft studio lighting, neutral background, even illumination, high quality, youtube thumbnail style, 8k" },
]

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { jobId } = generateSchema.parse(body)

        // Use direct Supabase client with anon key
        const supabase = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // 1. Verify Job and Payment
        const { data: job, error } = await supabase
            .from("jobs")
            .select("*")
            .eq("id", jobId)
            .single()

        if (error || !job) {
            return NextResponse.json({ error: "Job not found" }, { status: 404 })
        }

        if (!job.is_paid) {
            return NextResponse.json({ error: "Job not paid" }, { status: 402 })
        }

        const modelUrl = job.model_version;
        if (!modelUrl) {
            return NextResponse.json({ error: "Model version missing" }, { status: 500 })
        }

        // 2. Generate Images (Sequentially)
        const newResults: any[] = [];

        for (const expr of FULL_EXPRESSIONS) {
            try {
                console.log(`Generating ${expr.name}...`);

                // Call Replicate
                const output = await replicate.run(
                    modelUrl as `${string}/${string}:${string}`,
                    {
                        input: {
                            prompt: expr.prompt,
                            num_inference_steps: 28,
                            guidance_scale: 3.5,
                            num_outputs: 1,
                            aspect_ratio: "1:1",
                            output_format: "jpg",
                            output_quality: 90,
                        }
                    }
                );

                console.log(`Replicate output for ${expr.name}:`, JSON.stringify(output).substring(0, 300));

                let imageUrl: string;

                // Helper to upload file buffer to Supabase
                const uploadToSupabase = async (blob: any, filename: string) => {
                    console.log(`Uploading ${filename} to Supabase...`);
                    const arrayBuffer = await new Response(blob as any).arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);
                    const { error } = await supabase.storage
                        .from('generated-images')
                        .upload(filename, buffer, {
                            contentType: 'image/jpeg',
                            upsert: true
                        });

                    if (error) {
                        console.error("Supabase upload error:", error);
                        throw error;
                    }

                    const { data } = supabase.storage
                        .from('generated-images')
                        .getPublicUrl(filename);

                    console.log(`Upload successful: ${data.publicUrl}`);
                    return data.publicUrl;
                };

                // Helper to fetch URL and upload
                const fetchAndUpload = async (url: string, filename: string) => {
                    console.log(`Fetching URL ${url} for upload...`);
                    const res = await fetch(url);
                    if (!res.ok) throw new Error(`Failed to fetch image from URL: ${res.statusText}`);
                    const blob = await res.blob();
                    return uploadToSupabase(blob, filename);
                }

                // Handle Replicate Output formats (Corrected Order)
                if (Array.isArray(output)) {
                    const firstItem = output[0];
                    if (typeof firstItem === 'string') {
                        console.log("Item is String URL");
                        const filename = `${jobId}/${expr.name}-${Date.now()}.jpg`;
                        try {
                            imageUrl = await fetchAndUpload(firstItem, filename);
                        } catch (uploadError) {
                            console.error("Fetch/Upload failed:", uploadError);
                            imageUrl = `https://placehold.co/800x800?text=${expr.name}+UploadError`;
                        }
                    } else if (firstItem && typeof firstItem === 'object') {
                        console.log("Item is Object (Likely Stream/File)");
                        const filename = `${jobId}/${expr.name}-${Date.now()}.jpg`;
                        try {
                            imageUrl = await uploadToSupabase(firstItem, filename);
                        } catch (uploadError) {
                            console.error("Upload failed:", uploadError);
                            if ('url' in firstItem) {
                                imageUrl = (firstItem as any).url;
                            } else {
                                imageUrl = `https://placehold.co/800x800?text=${expr.name}+UploadError`;
                            }
                        }
                    } else {
                        imageUrl = `https://placehold.co/800x800?text=${expr.name}+FormatError`;
                    }
                } else if (output instanceof ReadableStream || (output && typeof output === 'object' && 'toString' in output)) {
                    // Single file output
                    console.log("Detected Single FileOutput/Stream");
                    const filename = `${jobId}/${expr.name}-${Date.now()}.jpg`;
                    try {
                        imageUrl = await uploadToSupabase(output, filename);
                    } catch (uploadError) {
                        console.error("Upload failed:", uploadError);
                        imageUrl = `https://placehold.co/800x800?text=${expr.name}+UploadError`;
                    }
                } else if (typeof output === 'string') {
                    // Check if it's a URL
                    console.log("Output is String URL");
                    const filename = `${jobId}/${expr.name}-${Date.now()}.jpg`;
                    try {
                        imageUrl = await fetchAndUpload(output, filename);
                    } catch (uploadError) {
                        console.error("Upload failed:", uploadError);
                        imageUrl = output; // Fallback to raw URL if upload fails
                    }
                } else if (output && typeof output === 'object' && 'url' in output) {
                    imageUrl = (output as any).url;
                } else {
                    // Fallback 
                    console.log("Unknown format, attempting upload as stream...");
                    const filename = `${jobId}/${expr.name}-${Date.now()}.jpg`;
                    try {
                        imageUrl = await uploadToSupabase(output, filename);
                    } catch (uploadError) {
                        console.error("Unknown output format type:", typeof output);
                        imageUrl = `https://placehold.co/800x800?text=${expr.name}+FormatError`;
                    }
                }

                newResults.push({
                    expression: expr.name,
                    name: expr.name,
                    emoji: expr.emoji,
                    url: imageUrl!,
                    isPaid: expr.isPaid
                });

                console.log(`✅ Generated ${expr.name}`);

                // Small delay
                await new Promise(r => setTimeout(r, 12000));

            } catch (error) {
                console.error(`Failed to generate ${expr.name}:`, error)
                newResults.push({
                    expression: expr.name,
                    name: expr.name,
                    emoji: expr.emoji,
                    url: `https://placehold.co/800x800?text=${expr.name}+Error`,
                    isPaid: expr.isPaid
                });
            }
        }

        // Combine with existing expressions
        const existing = Array.isArray(job.expressions_urls) ? job.expressions_urls : []
        const allExpressions = [...existing, ...newResults]

        // 3. Update Job
        const { error: updateError } = await supabase
            .from("jobs")
            .update({
                status: "complete",
                expressions_urls: allExpressions,
                updated_at: new Date().toISOString()
            })
            .eq("id", jobId)

        if (updateError) {
            console.error("Failed to update job:", updateError);
        } else {
            console.log(`✅ Job updated with ${allExpressions.length} expressions`);
        }

        // 4. Trigger PDF Generation
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        fetch(`${appUrl}/api/jobs/generate-pdf`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jobId })
        }).catch(err => console.error("Failed to trigger PDF generation:", err))

        return NextResponse.json({ success: true, count: allExpressions.length })

    } catch (error) {
        console.error("Full generation failed:", error)
        return NextResponse.json({ error: "Generation failed" }, { status: 500 })
    }
}
