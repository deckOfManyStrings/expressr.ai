import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
    request: Request,
    { params }: { params: Promise<{ jobId: string }> }
) {
    try {
        const { jobId } = await params;

        const { data: job, error } = await supabase
            .from("jobs")
            .select("*")
            .eq("id", jobId)
            .single();

        if (error || !job) {
            return NextResponse.json(
                { error: "Job not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            id: job.id,
            status: job.status,
            error: job.error,
            training_id: job.training_id,
            model_version: job.model_version,
            images: job.expressions_urls || job.images || [],
            is_paid: job.is_paid || false,
        });
    } catch (error) {
        console.error("Status check error:", error);
        return NextResponse.json(
            { error: "Failed to check status" },
            { status: 500 }
        );
    }
}
