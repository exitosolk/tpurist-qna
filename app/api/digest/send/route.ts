import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import nodemailer from 'nodemailer';
import { generateDigestEmail, generatePlainTextDigest } from '@/lib/email-digest';
import { DigestData } from '@/lib/email-digest';

// SMTP transporter configuration
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

// Send digest email to a single user
async function sendDigestToUser(userId: number, frequency: 'daily' | 'weekly'): Promise<boolean> {
  try {
    // Get user info
    const userResult = await query(
      'SELECT id, username, email, last_digest_sent_at FROM users WHERE id = ? AND email IS NOT NULL',
      [userId]
    );

    if (!Array.isArray(userResult) || userResult.length === 0) {
      console.log(`User ${userId} not found or has no email`);
      return false;
    }

    const user = userResult[0] as { 
      id: number; 
      username: string; 
      email: string; 
      last_digest_sent_at: Date | null;
    };

    // Calculate period
    const now = new Date();
    const periodStart = new Date(now);
    if (frequency === 'daily') {
      periodStart.setDate(periodStart.getDate() - 1);
    } else {
      periodStart.setDate(periodStart.getDate() - 7);
    }

    const sinceDate = user.last_digest_sent_at || periodStart;

    // Fetch digest data (similar to generate endpoint)
    const followedQuestionsResult = await query(
      `SELECT 
        q.id,
        q.slug,
        q.title,
        q.score,
        q.answer_count,
        qf.created_at as followed_at,
        COUNT(DISTINCT a.id) as new_answers
      FROM question_follows qf
      INNER JOIN questions q ON qf.question_id = q.id
      LEFT JOIN answers a ON a.question_id = q.id 
        AND a.created_at > ?
        AND a.user_id != qf.user_id
      WHERE qf.user_id = ?
      GROUP BY q.id, q.slug, q.title, q.score, q.answer_count, qf.created_at
      HAVING new_answers > 0
      ORDER BY new_answers DESC, q.score DESC
      LIMIT 20`,
      [sinceDate, userId]
    );

    const followedQuestions = Array.isArray(followedQuestionsResult)
      ? followedQuestionsResult.map((row: any) => ({
          id: row.id,
          slug: row.slug,
          title: row.title,
          answer_count: row.answer_count,
          new_answers: row.new_answers,
          score: row.score,
          followed_at: row.followed_at,
        }))
      : [];

    const followedTagsResult = await query(
      `SELECT 
        tf.tag_name,
        q.id,
        q.slug,
        q.title,
        q.score,
        q.answer_count,
        q.created_at
      FROM tag_follows tf
      INNER JOIN question_tags qt ON qt.tag_name = tf.tag_name
      INNER JOIN questions q ON q.id = qt.question_id
      WHERE tf.user_id = ?
        AND q.created_at > ?
        AND q.user_id != tf.user_id
      ORDER BY tf.tag_name, q.created_at DESC`,
      [userId, sinceDate]
    );

    const tagMap = new Map();
    if (Array.isArray(followedTagsResult)) {
      followedTagsResult.forEach((row: any) => {
        const tagName = row.tag_name;
        if (!tagMap.has(tagName)) {
          tagMap.set(tagName, []);
        }
        tagMap.get(tagName).push({
          id: row.id,
          slug: row.slug,
          title: row.title,
          answer_count: row.answer_count,
          new_answers: 0,
          score: row.score,
          followed_at: row.created_at,
        });
      });
    }

    const followedTags = Array.from(tagMap.entries()).map(([tag_name, new_questions]) => ({
      tag_name,
      new_questions: new_questions.slice(0, 10),
    }));

    const digestData: DigestData = {
      userName: user.username,
      followedQuestions,
      followedTags,
      periodStart: sinceDate,
      periodEnd: now,
      frequency,
    };

    // Generate email content
    const htmlContent = generateDigestEmail(digestData);
    const textContent = generatePlainTextDigest(digestData);

    // Don't send if no content
    if (!htmlContent || !textContent) {
      console.log(`No digest content for user ${userId}`);
      // Still update last_digest_sent_at to avoid checking again soon
      await query(
        'UPDATE users SET last_digest_sent_at = NOW() WHERE id = ?',
        [userId]
      );
      return false;
    }

    // Send email
    const transporter = createTransporter();
    const frequencyText = frequency === 'daily' ? 'Daily' : 'Weekly';
    
    await transporter.sendMail({
      from: `"OneCeylon" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: user.email,
      subject: `Your ${frequencyText} OneCeylon Digest 🏝️`,
      text: textContent,
      html: htmlContent,
    });

    // Update last_digest_sent_at
    await query(
      'UPDATE users SET last_digest_sent_at = NOW() WHERE id = ?',
      [userId]
    );

    console.log(`Digest sent successfully to user ${userId} (${user.email})`);
    return true;
  } catch (error) {
    console.error(`Error sending digest to user ${userId}:`, error);
    return false;
  }
}

// POST endpoint to send digest to current user (for testing)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const { frequency } = await request.json();

    if (!frequency || !['daily', 'weekly'].includes(frequency)) {
      return NextResponse.json(
        { error: 'Invalid frequency. Must be "daily" or "weekly"' },
        { status: 400 }
      );
    }

    const sent = await sendDigestToUser(userId, frequency);

    return NextResponse.json({
      success: sent,
      message: sent 
        ? 'Digest email sent successfully' 
        : 'No content to send or email failed',
    });
  } catch (error) {
    console.error('Error in digest send endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to send digest' },
      { status: 500 }
    );
  }
}

// GET endpoint to send digests to all eligible users (for cron job)
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const frequency = searchParams.get('frequency') as 'daily' | 'weekly' || 'daily';

    if (!['daily', 'weekly'].includes(frequency)) {
      return NextResponse.json(
        { error: 'Invalid frequency. Must be "daily" or "weekly"' },
        { status: 400 }
      );
    }

    // Get users who want this frequency digest
    const usersResult = await query(
      `SELECT id FROM users 
       WHERE digest_frequency = ? 
       AND email IS NOT NULL
       AND (
         last_digest_sent_at IS NULL 
         OR last_digest_sent_at < DATE_SUB(NOW(), INTERVAL ? HOUR)
       )
       LIMIT 100`, // Process in batches
      [frequency, frequency === 'daily' ? 20 : 144] // 20 hours for daily, 144 hours (6 days) for weekly
    );

    if (!Array.isArray(usersResult) || usersResult.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No users to send digests to',
        sent: 0,
        failed: 0,
      });
    }

    const users = usersResult as { id: number }[];
    let sent = 0;
    let failed = 0;

    // Send digests
    for (const user of users) {
      const success = await sendDigestToUser(user.id, frequency);
      if (success) {
        sent++;
      } else {
        failed++;
      }
      
      // Small delay between emails to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${sent} digests, ${failed} failed`,
      sent,
      failed,
      total: users.length,
    });
  } catch (error) {
    console.error('Error in batch digest send:', error);
    return NextResponse.json(
      { error: 'Failed to send batch digests' },
      { status: 500 }
    );
  }
}
