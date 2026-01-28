import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hvfwncwcwnjdqydvqond.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2ZnduY3djd25qZHF5ZHZxb25kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NjE5NTEsImV4cCI6MjA4NTAzNzk1MX0.6QuMbEBN6y2ukH-gD2IySPpZjB6m0aPBb2lTS2kqMko";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpdate() {
    const jobId = "fe263e23-783e-47c1-b26f-c7f2d1ef3ada";

    console.log("Fetching job...");
    const { data: job, error: fetchError } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", jobId)
        .single();

    if (fetchError) {
        console.error("Fetch error:", fetchError);
        return;
    }

    console.log("Job fetched successfully. Trying update without updated_at...");

    const { error: updateError } = await supabase
        .from("jobs")
        .update({
            // Just updating status to itself to test permissions
            status: job.status
        })
        .eq("id", jobId);

    if (updateError) {
        console.error("❌ Update failed:", JSON.stringify(updateError, null, 2));
    } else {
        console.log("✅ Update succeeded!");
    }
}

testUpdate();
