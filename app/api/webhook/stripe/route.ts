export const dynamic = 'force-dynamic';

import { createClient } from "@/lib/supabase/server"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import Stripe from "stripe"

export async function POST(request: Request) {
    try {
        const body = await request.text()
        const signature = (await headers()).get("Stripe-Signature") as string

        if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
            console.error("Missing Stripe secrets")
            return NextResponse.json({ error: "Missing config" }, { status: 500 })
        }

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
            typescript: true,
        })

        let event: Stripe.Event

        try {
            event = stripe.webhooks.constructEvent(
                body,
                signature,
                process.env.STRIPE_WEBHOOK_SECRET
            )
        } catch (err: any) {
            console.error(`Webhook signature verification failed.`, err.message)
            return NextResponse.json({ error: err.message }, { status: 400 })
        }

        if (event.type === "checkout.session.completed") {
            const session = event.data.object as Stripe.Checkout.Session
            const jobId = session.metadata?.jobId

            if (!jobId) {
                console.error("Job ID missing in webhook metadata")
                return NextResponse.json({ received: true })
            }

            const supabase = await createClient()

            // 1. Mark Job as Paid
            await supabase
                .from("jobs")
                .update({
                    paid: true,
                    status: "generating_full",
                    stripe_session_id: session.id
                })
                .eq("id", jobId)

            console.log(`Job ${jobId} marked as paid. Triggering full generation...`)

            // 2. Trigger Full Generation (Internal API)
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
            fetch(`${appUrl}/api/jobs/generate-full`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ jobId })
            }).catch(err => console.error("Failed to trigger full generation:", err))

        }

        return NextResponse.json({ received: true })

    } catch (error) {
        console.error("Stripe webhook failed:", error)
        return NextResponse.json({ error: "Webhook failed" }, { status: 500 })
    }
}
