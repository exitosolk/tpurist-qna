import { query } from "./db";
import pool from "./db";
import { RowDataPacket } from "mysql2";
import nodemailer from "nodemailer";

interface NotificationParams {
  userId: number;
  type: 'answer' | 'question_upvote' | 'question_downvote' | 'answer_upvote' | 'answer_downvote' | 'comment' | 'accepted_answer' | 'badge' | 'followed_question_answer' | 'followed_tag_question';
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
};

async function sendEmailNotification(userEmail: string, subject: string, message: string) {
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

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: userEmail,
      subject: `OneCeylon: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">OneCeylon</h2>
          <p>${message}</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 12px;">
            You received this email because you have notifications enabled. 
            <a href="${baseUrl}/settings" style="color: #2563eb;">
              Manage your notification preferences
            </a>
          </p>
        </div>
      `,
    });

    console.log(`Email notification sent to ${userEmail}: ${subject}`);
  } catch (error) {
    console.error("Error sending email notification:", error);
  }
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
      await sendEmailNotification(userPrefs.email, subject, message);
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
