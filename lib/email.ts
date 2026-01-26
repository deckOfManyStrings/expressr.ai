import { Resend } from 'resend';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function sendFreePackReadyEmail(email: string, jobId: string, expressions: any[]) {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
        console.log("Resend API Key missing, skipping email");
        return;
    }

    const resend = new Resend(apiKey);
    const viewUrl = `${APP_URL}/view/${jobId}`;

    try {
        await resend.emails.send({
            from: 'Expressr <onboarding@resend.dev>', // Use verified domain in prod
            to: email,
            subject: 'Your 3 Free Expressions Are Ready! 🎉',
            html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>Your expressions are ready!</h1>
          <p>We trained AI on your face and generated 3 professional expressions:</p>
          <ul>
            <li>😊 Happy</li>
            <li>😢 Sad</li>
            <li>😠 Angry</li>
          </ul>
          <p>
            <a href="${viewUrl}" style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Your Expressions →
            </a>
          </p>
          <p style="color: #666; font-size: 14px; margin-top: 40px;">
            Want all 12 expressions including Shocked 😱 and Excited 🤩?
            <br/>
            Unlock the full pack for just $9.99 on the view page.
          </p>
        </div>
      `
        });
    } catch (error) {
        console.error("Failed to send email:", error);
    }
}
