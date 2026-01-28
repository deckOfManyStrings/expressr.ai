
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { resend } from "@/lib/resend";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: "Email required" }, { status: 400 });
        }

        const { data: jobs } = await supabase
            .from("jobs")
            .select("*")
            .eq("user_email", email)
            .order("created_at", { ascending: false });

        if (!jobs || jobs.length === 0) {
            // Return success even if no email found to prevent enumeration, or simple error for UX.
            // For this simple app, finding no orders is a valid UX message.
            return NextResponse.json({ message: "No orders found for this email." });
        }

        // Build email content
        const links = jobs.map(job => {
            const date = new Date(job.created_at).toLocaleDateString();
            const status = job.status === 'complete' ? '✅ Ready' : '⏳ Processing';
            return `<li><a href="${process.env.NEXT_PUBLIC_APP_URL}/view/${job.id}">Order from ${date} (${status})</a></li>`;
        }).join('');

        await resend.emails.send({
            from: 'Expressr AI <onboarding@resend.dev>',
            to: email,
            subject: 'Wait, I found your photos! 📸',
            html: `
                <h1>Your Order History</h1>
                <p>Here are the links to your expression packs:</p>
                <ul>
                    ${links}
                </ul>
                <p>Click any link above to view and download your photos.</p>
            `,
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Recovery failed:", error);
        return NextResponse.json({ error: "Recovery failed" }, { status: 500 });
    }
}
