import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  const { email } = await req.json() as { email: string };
  if (!email?.trim()) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  // Generate and store the code in Convex
  const { code } = await convex.mutation(api.verificationCodes.generateCode, {
    email: email.trim().toLowerCase(),
  });

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    // Dev fallback: return code in response (remove before production)
    return NextResponse.json({ success: true, devCode: code });
  }

  const resend = new Resend(resendKey);

  const { error } = await resend.emails.send({
    from: 'Project Centinela <onboarding@resend.dev>',
    to: email.trim(),
    subject: 'Your Project Centinela verification code',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <h2 style="color: #111; margin-bottom: 8px;">Verify your email</h2>
        <p style="color: #555; margin-bottom: 24px;">
          Enter the code below to complete your Project Centinela account setup.
          This code expires in 15 minutes.
        </p>
        <div style="background: #f3f4f6; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #009DA5; font-family: monospace;">
            ${code}
          </span>
        </div>
        <p style="color: #999; font-size: 12px;">
          If you didn&apos;t request this, you can safely ignore this email.
        </p>
      </div>
    `,
  });

  if (error) {
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
