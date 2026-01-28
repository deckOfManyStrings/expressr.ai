
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
    try {
        const { jobId } = await request.json();

        if (!jobId) {
            return NextResponse.json({ error: "Job ID is required" }, { status: 400 });
        }

        // Verify job exists
        const { data: job } = await supabase
            .from("jobs")
            .select("*")
            .eq("id", jobId)
            .single();

        if (!job) {
            return NextResponse.json({ error: "Job not found" }, { status: 404 });
        }

        // Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: "AI Expression Pack (12 Photos)",
                            description: "Unlock all 12 generated professional headshots.",
                            images: job.images && job.images.length > 0 ? [job.images[0].url] : [],
                        },
                        unit_amount: 999, // $9.99
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?job_id=${jobId}`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/view/${jobId}`,
            client_reference_id: jobId,
            metadata: {
                jobId: jobId,
            },
        });

        return NextResponse.json({ url: session.url });

    } catch (error: any) {
        console.error("Stripe checkout error:", error);
        return NextResponse.json(
            { error: `Checkout failed: ${error.message}` },
            { status: 500 }
        );
    }
}
