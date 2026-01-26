import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import Stripe from "stripe"
import { z } from "zod"

const checkoutSchema = z.object({
    jobId: z.string().uuid(),
})

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

export async function POST(request: Request) {
    try {
        if (!process.env.STRIPE_SECRET_KEY) {
            throw new Error("Missing STRIPE_SECRET_KEY")
        }

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
            typescript: true,
        })

        const body = await request.json()
        const { jobId } = checkoutSchema.parse(body)
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

        // 2. Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: "Expressr.ai Full Pack (12 Expressions)",
                            description: "Unlock 9 additional professional AI expressions + PDF download.",
                            images: ["https://placehold.co/400x400?text=Full+Pack"], // Replace with real asset
                        },
                        unit_amount: 999, // $9.99
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `${APP_URL}/success?job_id=${jobId}`,
            cancel_url: `${APP_URL}/view/${jobId}`,
            metadata: {
                jobId: job.id,
            },
            customer_email: job.email,
        })

        return NextResponse.json({ url: session.url })

    } catch (error) {
        console.error("Stripe checkout failed:", error)
        return NextResponse.json({ error: "Checkout failed" }, { status: 500 })
    }
}
