import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { query } from "@/lib/db";
import crypto from "crypto";
import nodemailer from "nodemailer";

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get user
    const users = await query(
      "SELECT id, email, email_verified, display_name, username FROM users WHERE email = ?",
      [session.user.email]
    );

    if (!users || users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = users[0];

    // Check if already verified
    if (user.email_verified) {
      return NextResponse.json(
        { message: "Email is already verified" },
        { status: 200 }
      );
    }

    // Generate verification token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    // Save token to database
    await query(
      "UPDATE users SET verification_token = ?, verification_token_expires = ? WHERE id = ?",
      [token, expiresAt, user.id]
    );

    // Create verification URL
    const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`;

    // Send verification email
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || '"OneCeylon" <noreply@oneceylon.space>',
        to: user.email,
        subject: "Verify your email address - OneCeylon",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
                .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Welcome to OneCeylon!</h1>
                </div>
                <div class="content">
                  <h2>Hi ${user.display_name || user.username}!</h2>
                  <p>Thanks for joining OneCeylon, the travel Q&A community for Sri Lanka.</p>
                  <p>Please verify your email address to unlock all features and earn <strong>10 reputation points</strong>!</p>
                  <div style="text-align: center;">
                    <a href="${verificationUrl}" class="button">Verify Email Address</a>
                  </div>
                  <p style="color: #6b7280; font-size: 14px;">
                    Or copy and paste this link into your browser:<br>
                    <a href="${verificationUrl}">${verificationUrl}</a>
                  </p>
                  <p style="color: #6b7280; font-size: 14px;">
                    This link will expire in 24 hours.
                  </p>
                </div>
                <div class="footer">
                  <p>If you didn't create an account on OneCeylon, you can safely ignore this email.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      });

      return NextResponse.json({
        message: "Verification email sent successfully",
      });
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      return NextResponse.json(
        { error: "Failed to send verification email. Please try again later." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in send verification email:", error);
    return NextResponse.json(
      { error: "Failed to send verification email" },
      { status: 500 }
    );
  }
}
