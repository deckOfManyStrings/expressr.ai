
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import { resend } from "@/lib/resend";
import Stripe from "stripe";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
        return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Handle the event
    if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const jobId = session.client_reference_id;

        if (jobId) {
            console.log(`Payment successful for job ${jobId}. Unlocking content...`);

            const { error } = await supabase
                .from("jobs")
                .update({
                    is_paid: true,
                    stripe_session_id: session.id,
                    status: "generating_premium" // Trigger premium generation
                })
                .eq("id", jobId);

            if (error) {
                console.error("Failed to update job status:", error);
                return NextResponse.json({ error: "Database update failed" }, { status: 500 });
            }

            // Fetch job to get email
            const { data: job } = await supabase
                .from("jobs")
                .select("user_email")
                .eq("id", jobId)
                .single();

            // Send Payment Receipt Email
            if (job?.user_email) {
                try {
                    await resend.emails.send({
                        from: 'Expressr AI <onboarding@resend.dev>',
                        to: job.user_email,
                        subject: 'Payment Successful! Your Full Pack is Unlocked 🔓',
                        html: `
                            <div style="font-family: sans-serif; max-w-600px; margin: 0 auto;">
                                <h1>Thank you for your purchase!</h1>
                                <p>We received your payment of $9.99.</p>
                                <p>Your full expression pack (12 photos) is now unlocked and ready for download.</p>
                                <p>Access them here: <a href="${process.env.NEXT_PUBLIC_APP_URL}/view/${jobId}" style="display:inline-block;background:#000;color:#fff;padding:12px 24px;text-decoration:none;border-radius:4px;">View Full Pack</a></p>
                            </div>
                        `,
                    });
                } catch (e) {
                    console.error("Failed to send payment email:", e);
                }
            }
        }
    }

    return NextResponse.json({ received: true });
}
