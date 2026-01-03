import { query } from "./db";
import pool from "./db";
import { RowDataPacket } from "mysql2";
import nodemailer from "nodemailer";

interface NotificationParams {
  userId: number;
  type: 'answer' | 'question_upvote' | 'question_downvote' | 'answer_upvote' | 'answer_downvote' | 'comment' | 'accepted_answer' | 'badge' | 'followed_question_answer' | 'followed_tag_question' | 'question_closed';
  actorId: number;
  message: string;
  questionId?: number;
  answerId?: number;
  commentId?: number;
}

// Email preference mapping
const emailPreferenceMap: Record<string, string> = {
  'answer': 'email_new_answer',
  'comment': 'email_new_comment',
  'question_upvote': 'email_question_upvote',
  'question_downvote': 'email_question_downvote',
  'answer_upvote': 'email_answer_upvote',
  'answer_downvote': 'email_answer_downvote',
  'accepted_answer': 'email_accepted_answer',
  'badge': 'email_badge_earned',
  'followed_question_answer': 'email_followed_question',
  'followed_tag_question': 'email_followed_question',
  'question_closed': 'email_moderation',
};

// In-app preference mapping
const appPreferenceMap: Record<string, string> = {
  'answer': 'app_new_answer',
  'comment': 'app_new_comment',
  'question_upvote': 'app_question_upvote',
  'question_downvote': 'app_question_downvote',
  'answer_upvote': 'app_answer_upvote',
  'answer_downvote': 'app_answer_downvote',
  'accepted_answer': 'app_accepted_answer',
  'badge': 'app_badge_earned',
  'followed_question_answer': 'app_followed_question',
  'followed_tag_question': 'app_followed_question',
  'question_closed': 'app_moderation',
};

async function sendEmailNotification(
  userEmail: string, 
  subject: string, 
  message: string,
  type: string,
  questionId?: number,
  answerId?: number
) {
  // Check if SMTP is configured
  if (!process.env.SMTP_HOST || !process.env.SMTP_FROM) {
    console.log('SMTP not configured, skipping email notification');
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD, // Support both variable names
      } : undefined,
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || 'https://oneceylon.space';
    
    // Build the action URL based on notification type
    let actionUrl = baseUrl;
    let actionText = 'View Notification';
    
    if (questionId) {
      actionUrl = `${baseUrl}/questions/${questionId}`;
      actionText = type === 'answer' ? 'View Answer' : 'View Question';
    }
    
    // Get icon based on notification type
    const iconEmoji = getNotificationIcon(type);

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: userEmail,
      subject: `OneCeylon: ${subject}`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
          <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9fafb;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); overflow: hidden;">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 32px 40px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                        OneCeylon
                      </h1>
                      <p style="margin: 8px 0 0 0; color: #bfdbfe; font-size: 14px; font-weight: 500;">
                        Ask the island
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Icon Banner -->
                  <tr>
                    <td style="background-color: #eff6ff; padding: 24px; text-align: center;">
                      <div style="font-size: 48px; line-height: 1;">
                        ${iconEmoji}
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="margin: 0 0 8px 0; color: #111827; font-size: 22px; font-weight: 600; line-height: 1.3;">
                        ${subject}
                      </h2>
                      <p style="margin: 16px 0 32px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                        ${message}
                      </p>
                      
                      <!-- CTA Button -->
                      <table role="presentation" style="margin: 0 auto;">
                        <tr>
                          <td style="border-radius: 8px; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);">
                            <a href="${actionUrl}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px;">
                              ${actionText} →
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Divider -->
                  <tr>
                    <td style="padding: 0 40px;">
                      <div style="border-top: 1px solid #e5e7eb;"></div>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 32px 40px; background-color: #f9fafb;">
                      <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px; line-height: 1.5; text-align: center;">
                        You received this email because you have notifications enabled for this activity.
                      </p>
                      <p style="margin: 0; text-align: center;">
                        <a href="${baseUrl}/settings" style="color: #2563eb; text-decoration: none; font-size: 14px; font-weight: 500;">
                          Manage notification preferences
                        </a>
                        <span style="color: #d1d5db; margin: 0 8px;">•</span>
                        <a href="${baseUrl}" style="color: #2563eb; text-decoration: none; font-size: 14px; font-weight: 500;">
                          Visit OneCeylon
                        </a>
                      </p>
                      <p style="margin: 20px 0 0 0; color: #9ca3af; font-size: 12px; text-align: center; line-height: 1.5;">
                        OneCeylon - Connecting Sri Lankans Worldwide<br>
                        © ${new Date().getFullYear()} OneCeylon. All rights reserved.
                      </p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    console.log(`Email notification sent to ${userEmail}: ${subject}`);
  } catch (error) {
    console.error("Error sending email notification:", error);
  }
}

function getNotificationIcon(type: string): string {
  const icons: Record<string, string> = {
    'answer': '💬',
    'comment': '💭',
    'question_upvote': '👍',
    'question_downvote': '👎',
    'answer_upvote': '⭐',
    'answer_downvote': '📉',
    'accepted_answer': '✅',
    'badge': '🏆',
    'followed_question_answer': '🔔',
    'followed_tag_question': '🏷️',
  };
  return icons[type] || '📢';
}

export async function createNotification({
  userId,
  type,
  actorId,
  message,
  questionId,
  answerId,
  commentId,
}: NotificationParams) {
  try {
    // Don't notify users about their own actions
    if (userId === actorId) {
      return;
    }

    // Get user preferences and email
    const [preferences] = await pool.execute<RowDataPacket[]>(
      `SELECT np.*, u.email, u.email_verified 
       FROM users u
       LEFT JOIN notification_preferences np ON np.user_id = u.id
       WHERE u.id = ?`,
      [userId]
    );

    if (preferences.length === 0) {
      console.log('User not found:', userId);
      return;
    }

    const userPrefs = preferences[0];
    const appPrefField = appPreferenceMap[type];
    const emailPrefField = emailPreferenceMap[type];

    // Create in-app notification if user wants it
    const shouldCreateAppNotification = !appPrefField || userPrefs[appPrefField] !== false;
    
    if (shouldCreateAppNotification) {
      await query(
        `INSERT INTO notifications (user_id, type, actor_id, question_id, answer_id, comment_id, message) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, type, actorId, questionId || null, answerId || null, commentId || null, message]
      );
    }

    // Send email notification if user wants it and email is verified
    const shouldSendEmail = userPrefs.email_verified && 
                           emailPrefField && 
                           userPrefs[emailPrefField] !== false;

    if (shouldSendEmail && userPrefs.email) {
      const subject = getEmailSubject(type);
      console.log(`Attempting to send email to ${userPrefs.email} for notification type: ${type}`);
      await sendEmailNotification(userPrefs.email, subject, message, type, questionId, answerId);
    } else {
      console.log(`Email not sent - verified: ${userPrefs.email_verified}, has email: ${!!userPrefs.email}, pref enabled: ${userPrefs[emailPrefField]}`);
    }
  } catch (error) {
    console.error("Error creating notification:", error);
    // Don't throw - notifications shouldn't break the main flow
  }
}

function getEmailSubject(type: string): string {
  const subjects: Record<string, string> = {
    'answer': 'New answer to your question',
    'comment': 'New comment on your post',
    'question_upvote': 'Your question was upvoted',
    'question_downvote': 'Your question was downvoted',
    'answer_upvote': 'Your answer was upvoted',
    'answer_downvote': 'Your answer was downvoted',
    'accepted_answer': 'Your answer was accepted',
    'badge': 'You earned a new badge',
    'followed_question_answer': 'New answer to a question you follow',
    'followed_tag_question': 'New question in a tag you follow',
  };
  return subjects[type] || 'New notification';
}
