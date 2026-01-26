import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const createJobSchema = z.object({
    email: z.string().email(),
    fileCount: z.number().min(1).max(15),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, fileCount } = createJobSchema.parse(body);

        const supabase = await createClient();

        // Create job record
        const { data: job, error } = await supabase
            .from("jobs")
            .insert({
                email,
                status: "uploading",
            })
            .select()
            .single();

        if (error) throw error;

        // Generate upload URLs (mocked for now, real implementation would use Supabase Storage API)
        // We will assume client uploads directly using standard Supabase client for simplicity in MVP
        // unless we need signed URLs for security.
        // For MVP Day 2: We return the job ID, and client uploads to storage/{job_id}/{index}

        return NextResponse.json({ jobId: job.id });
    } catch (error) {
        console.error("Job creation failed:", error);
        return NextResponse.json(
            { error: "Failed to create job" },
            { status: 500 }
        );
    }
}
