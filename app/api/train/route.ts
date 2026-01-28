import { NextResponse } from "next/server";
import Replicate from "replicate";
import { createClient } from "@supabase/supabase-js";
import JSZip from "jszip";

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const email = formData.get("email") as string;

        // Properly filter for File objects only
        const allPhotos = formData.getAll("photos");
        const photoFiles = allPhotos.filter((item): item is File => item instanceof File);

        if (!email || photoFiles.length < 10) {
            return NextResponse.json(
                { error: "Email and at least 10 photos are required" },
                { status: 400 }
            );
        }

        // Check for recent duplicate submissions (within 30 minutes)
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
        const { data: recentJobs, error: jobCheckError } = await supabase
            .from("jobs")
            .select("id, created_at")
            .eq("user_email", email)
            .gte("created_at", thirtyMinutesAgo)
            .order("created_at", { ascending: false })
            .limit(1);

        console.log("Duplicate check:", { email, thirtyMinutesAgo, recentJobs, jobCheckError });

        if (recentJobs && recentJobs.length > 0) {
            return NextResponse.json(
                {
                    error: "You've already started training recently. Please wait for it to complete.",
                    existing_job_id: recentJobs[0].id
                },
                { status: 429 }
            );
        }

        console.log(`Starting training for ${email} with ${photoFiles.length} photos`);

        // Create Zip file from images
        const zip = new JSZip();
        await Promise.all(photoFiles.map(async (file) => {
            const bytes = await file.arrayBuffer();
            // Use original filename or a generated one + extension
            const ext = file.name.split('.').pop() || 'jpg';
            const filename = file.name;
            zip.file(filename, Buffer.from(bytes));
        }));

        const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
        const zipDataUri = `data:application/zip;base64,${zipBuffer.toString('base64')}`;

        // 1. Get user's Replicate username
        // @ts-ignore - Replicate SDK types conflict
        const account = await replicate.accounts.current();
        const username = account.username;

        // 2. Create a URL-friendly model name
        const modelName = `${email.split('@')[0]}-expressr-model`.toLowerCase().replace(/[^a-z0-9-]/g, '-');

        // 3. Ensure model exists (create if not)
        try {
            await replicate.models.get(username, modelName);
        } catch (e) {
            console.log(`Creating model ${username}/${modelName}...`);
            await replicate.models.create(username, modelName, {
                visibility: "private",
                hardware: "gpu-t4",
            });
        }

        const destination = `${username}/${modelName}`;
        console.log(`Training destination: ${destination}`);

        // 4. Start Replicate training
        const training = await replicate.trainings.create(
            "ostris",
            "flux-dev-lora-trainer",
            "e440909d3512c31646ee2e0c7d6f6f4923224863a6a10c494606e79fb5844497",
            {
                destination: destination as any,
                input: {
                    input_images: zipDataUri,
                    trigger_word: "TOK",
                    steps: 1200,
                    lora_rank: 32,
                    optimizer: "adamw8bit",
                    batch_size: 1,
                    resolution: "512,768,1024",
                    autocaption: true,
                    learning_rate: 0.0004,
                },
                ...(process.env.NEXT_PUBLIC_APP_URL?.startsWith("https") ? {
                    webhook: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/replicate`,
                    webhook_events_filter: ["completed"],
                } : {}),
            }
        );

        // Create job record in Supabase
        const { data: job, error: dbError } = await supabase
            .from("jobs")
            .insert({
                user_email: email,
                status: "training",
                training_id: training.id,
                created_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (dbError) {
            console.error("Database error:", dbError);
            return NextResponse.json(
                { error: "Failed to create job record" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            job_id: job.id,
            training_id: training.id,
            status: "training",
            estimated_time: 600, // 10 minutes in seconds
        });

    } catch (error: any) {
        console.error("Training failed:", error);
        return NextResponse.json(
            { error: `Training failed: ${error.message}` },
            { status: 500 }
        );
    }
}
