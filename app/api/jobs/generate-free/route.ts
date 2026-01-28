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

// Updated prompts for YouTube Thumbnail style: Neutral lighting, high quality, clean background
const EXPRESSIONS = [
    { name: "Happy", emoji: "😊", isPaid: false, prompt: "TOK person, extremely happy, wide open smile showing teeth, laughing eyes, pure joy, full head visible, head and shoulders portrait, soft studio lighting, neutral background, even illumination, high quality, youtube thumbnail style, 8k" },
    { name: "Sad", emoji: "😢", isPaid: false, prompt: "TOK person, very sad expression, closed mouth, frowning downturned mouth, pouting lips, big teary eyes, upset, full head visible, head and shoulders portrait, soft studio lighting, neutral background, even illumination, high quality, youtube thumbnail style, 8k" },
    { name: "Angry", emoji: "😠", isPaid: false, prompt: "angry photo of TOK, extremely angry facial expression, eyebrows down and together, mouth open yelling, veins visible, fierce intense rage, confrontational, aggressive look, full head visible, head and shoulders portrait, professional lighting" },
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

        // 2. Generate Images using Replicate (SEQUENTIALLY to avoid rate limits)
        const results = [];

        for (const expr of EXPRESSIONS) {
            try {
                console.log(`Generating ${expr.name}...`);

                // Call Replicate with the trained model
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
                )

                console.log(`Replicate output for ${expr.name}:`, JSON.stringify(output).substring(0, 300));

                // Helper to upload file buffer to Supabase
                const uploadToSupabase = async (blob: any, filename: string) => {
                    console.log(`Uploading ${filename} to Supabase...`);
                    // Use Response to handle various stream/blob types robustly
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

                let imageUrl: string;

                // Handle Replicate Output formats (Corrected Order)
                if (Array.isArray(output)) {
                    console.log(`Detected Array output. Length: ${(output as any).length || 0}`);
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
                        // Assume it's a stream/blob if it's an object in the array
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
                        console.error("Unknown array item type:", firstItem);
                        imageUrl = `https://placehold.co/800x800?text=${expr.name}+FormatError`;
                    }
                } else if (output instanceof ReadableStream || (output && typeof output === 'object' && 'toString' in output)) {
                    // Single file output (Stream)
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
                    console.log("Output is Object with URL");
                    imageUrl = (output as any).url;
                } else {
                    // Final attempt - try to treat unknown object as stream
                    console.log("Unknown format, attempting upload as stream...");
                    const filename = `${jobId}/${expr.name}-${Date.now()}.jpg`;
                    try {
                        imageUrl = await uploadToSupabase(output, filename);
                    } catch (uploadError) {
                        console.error("Unknown output format type:", typeof output);
                        imageUrl = `https://placehold.co/800x800?text=${expr.name}+FormatError`;
                    }
                }

                results.push({
                    expression: expr.name,
                    name: expr.name,
                    emoji: expr.emoji,
                    url: imageUrl!,
                    isPaid: expr.isPaid
                });

                console.log(`✅ Generated ${expr.name}`);

                // Small delay between requests to avoid rate limits
                await new Promise(r => setTimeout(r, 12000));

            } catch (error) {
                console.error(`Failed to generate ${expr.name}:`, error)
                // Return placeholder on error
                results.push({
                    expression: expr.name,
                    name: expr.name,
                    emoji: expr.emoji,
                    url: `https://placehold.co/800x800?text=${expr.name}+Error`,
                    isPaid: expr.isPaid
                });
            }
        }

        // 3. Update Job
        const { error: updateError } = await supabase
            .from("jobs")
            .update({
                status: "complete_free",
                expressions_urls: results,
                completed_at: new Date().toISOString()
            })
            .eq("id", jobId);

        if (updateError) {
            console.error("Failed to update job status:", updateError);
        }

        // 4. Send Email
        try {
            await sendFreePackReadyEmail(job.user_email, jobId, results);
        } catch (emailError) {
            console.error("Failed to send email:", emailError);
        }

        return NextResponse.json({ success: true, count: results.length })

    } catch (error) {
        console.error("Generation failed:", error)
        return NextResponse.json({ error: "Generation failed" }, { status: 500 })
    }
}
