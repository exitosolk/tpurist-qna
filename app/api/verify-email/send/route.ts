import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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
    const userResult = await query(
      "SELECT id, email, email_verified, display_name, username FROM users WHERE email = ?",
      [session.user.email]
    );

    if (!userResult.rows || userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = userResult.rows[0];

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
          <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                  line-height: 1.6; 
                  color: #1f2937;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  padding: 40px 20px;
                }
                .email-wrapper { max-width: 600px; margin: 0 auto; }
                .email-container { 
                  background: white; 
                  border-radius: 16px; 
                  overflow: hidden;
                  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                }
                .header { 
                  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
                  color: white; 
                  padding: 50px 40px;
                  text-align: center;
                  position: relative;
                }
                .header::before {
                  content: '🇱🇰';
                  font-size: 48px;
                  display: block;
                  margin-bottom: 16px;
                  animation: wave 2s ease-in-out infinite;
                }
                @keyframes wave {
                  0%, 100% { transform: rotate(0deg); }
                  25% { transform: rotate(-10deg); }
                  75% { transform: rotate(10deg); }
                }
                .header h1 { 
                  font-size: 32px; 
                  font-weight: 700;
                  margin: 0;
                  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .header p {
                  margin-top: 8px;
                  font-size: 16px;
                  opacity: 0.95;
                }
                .content { 
                  padding: 50px 40px;
                  background: white;
                }
                .greeting {
                  font-size: 24px;
                  font-weight: 600;
                  color: #1f2937;
                  margin-bottom: 24px;
                }
                .message {
                  font-size: 16px;
                  color: #4b5563;
                  margin-bottom: 16px;
                }
                .highlight-box {
                  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
                  border-left: 4px solid #f59e0b;
                  padding: 20px;
                  border-radius: 8px;
                  margin: 24px 0;
                }
                .highlight-box strong {
                  color: #b45309;
                  font-size: 18px;
                }
                .button-container { 
                  text-align: center; 
                  margin: 40px 0;
                }
                .button { 
                  display: inline-block; 
                  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
                  color: #ffffff !important; 
                  padding: 16px 48px; 
                  text-decoration: none !important; 
                  border-radius: 50px;
                  font-weight: 700;
                  font-size: 18px;
                  box-shadow: 0 4px 15px rgba(37, 99, 235, 0.4);
                  transition: all 0.3s ease;
                  mso-padding-alt: 16px 48px;
                }
                .button:hover {
                  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.6);
                  transform: translateY(-2px);
                }
                .button span {
                  color: #ffffff !important;
                  text-decoration: none !important;
                }
                .divider {
                  height: 1px;
                  background: linear-gradient(90deg, transparent, #e5e7eb, transparent);
                  margin: 32px 0;
                }
                .link-section {
                  background: #f9fafb;
                  padding: 20px;
                  border-radius: 8px;
                  border: 1px solid #e5e7eb;
                }
                .link-section p {
                  color: #6b7280;
                  font-size: 13px;
                  margin-bottom: 8px;
                }
                .link-section a {
                  color: #2563eb;
                  word-break: break-all;
                  font-size: 13px;
                }
                .expiry-notice {
                  color: #ef4444;
                  font-size: 14px;
                  font-weight: 500;
                  text-align: center;
                  margin-top: 16px;
                }
                .footer { 
                  background: #f9fafb;
                  padding: 30px 40px;
                  text-align: center;
                  border-top: 1px solid #e5e7eb;
                }
                .footer p {
                  color: #6b7280;
                  font-size: 14px;
                  margin: 8px 0;
                }
                .social-links {
                  margin-top: 20px;
                }
                .social-links a {
                  display: inline-block;
                  margin: 0 8px;
                  color: #6b7280;
                  text-decoration: none;
                  font-size: 12px;
                }
                .badge {
                  display: inline-block;
                  background: #dbeafe;
                  color: #1e40af;
                  padding: 4px 12px;
                  border-radius: 12px;
                  font-size: 13px;
                  font-weight: 600;
                  margin: 4px;
                }
              </style>
            </head>
            <body>
              <div class="email-wrapper">
                <div class="email-container">
                  <div class="header">
                    <h1>Welcome to OneCeylon!</h1>
                    <p>Your gateway to Sri Lanka's travel community</p>
                  </div>
                  
                  <div class="content">
                    <div class="greeting">Ayubowan, ${user.display_name || user.username}! 🙏</div>
                    
                    <p class="message">
                      Welcome to <strong>OneCeylon</strong> – the premier Q&A community for travelers exploring the pearl of the Indian Ocean, Sri Lanka!
                    </p>
                    
                    <p class="message">
                      We're thrilled to have you join thousands of travelers, locals, and Sri Lanka enthusiasts sharing authentic insights, hidden gems, and travel wisdom.
                    </p>
                    
                    <div class="highlight-box">
                      <strong>🎁 Complete your verification to unlock:</strong><br>
                      <span class="badge">+10 Reputation Points</span>
                      <span class="badge">🙏 Ayubowan Badge</span>
                      <span class="badge">Full Community Access</span>
                    </div>
                    
                    <div class="button-container">
                      <a href="${verificationUrl}" class="button" style="color: #ffffff !important; text-decoration: none !important;">
                        <span style="color: #ffffff !important;">✓ Verify My Email</span>
                      </a>
                    </div>
                    
                    <div class="divider"></div>
                    
                    <div class="link-section">
                      <p><strong>Button not working?</strong> Copy and paste this link into your browser:</p>
                      <a href="${verificationUrl}">${verificationUrl}</a>
                    </div>
                    
                    <p class="expiry-notice">⏰ This verification link expires in 24 hours</p>
                  </div>
                  
                  <div class="footer">
                    <p><strong>OneCeylon</strong> – Travel Sri Lanka with Confidence</p>
                    <p>Ask questions • Share experiences • Discover hidden gems</p>
                    <div class="divider" style="margin: 20px auto; max-width: 200px;"></div>
                    <p style="font-size: 13px; color: #9ca3af;">
                      Didn't create an account? You can safely ignore this email.
                    </p>
                    <div class="social-links">
                      <a href="https://oneceylon.space">Visit Website</a> • 
                      <a href="https://oneceylon.space/questions">Browse Questions</a> • 
                      <a href="https://oneceylon.space/privacy">Privacy Policy</a>
                    </div>
                  </div>
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
