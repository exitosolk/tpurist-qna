import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { DigestData, DigestQuestion, DigestTag } from '@/lib/email-digest';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const searchParams = request.nextUrl.searchParams;
    const frequency = searchParams.get('frequency') as 'daily' | 'weekly' || 'daily';
    
    // Calculate the time period for the digest
    const now = new Date();
    const periodStart = new Date(now);
    if (frequency === 'daily') {
      periodStart.setDate(periodStart.getDate() - 1); // Last 24 hours
    } else {
      periodStart.setDate(periodStart.getDate() - 7); // Last 7 days
    }

    // Get user info
    const userResult = await query(
      'SELECT username, last_digest_sent_at FROM users WHERE id = ?',
      [userId]
    );

    if (!Array.isArray(userResult) || userResult.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userResult[0] as { username: string; last_digest_sent_at: Date | null };
    
    // Use last_digest_sent_at if available, otherwise use periodStart
    const sinceDate = user.last_digest_sent_at || periodStart;

    // 1. Get followed questions with new answers
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

    const followedQuestions: DigestQuestion[] = Array.isArray(followedQuestionsResult)
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

    // 2. Get followed tags with new questions
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

    // Group questions by tag
    const tagMap = new Map<string, DigestQuestion[]>();
    if (Array.isArray(followedTagsResult)) {
      followedTagsResult.forEach((row: any) => {
        const tagName = row.tag_name;
        if (!tagMap.has(tagName)) {
          tagMap.set(tagName, []);
        }
        tagMap.get(tagName)!.push({
          id: row.id,
          slug: row.slug,
          title: row.title,
          answer_count: row.answer_count,
          new_answers: 0, // Not applicable for new questions
          score: row.score,
          followed_at: row.created_at,
        });
      });
    }

    const followedTags: DigestTag[] = Array.from(tagMap.entries()).map(([tag_name, new_questions]) => ({
      tag_name,
      new_questions: new_questions.slice(0, 10), // Limit to 10 questions per tag
    }));

    // Build digest data
    const digestData: DigestData = {
      userName: user.username,
      followedQuestions,
      followedTags,
      periodStart: sinceDate,
      periodEnd: now,
      frequency,
    };

    // Calculate totals
    const totalNewAnswers = followedQuestions.reduce((sum, q) => sum + q.new_answers, 0);
    const totalNewQuestions = followedTags.reduce((sum, tag) => sum + tag.new_questions.length, 0);

    return NextResponse.json({
      success: true,
      digestData,
      stats: {
        totalNewAnswers,
        totalNewQuestions,
        hasContent: totalNewAnswers > 0 || totalNewQuestions > 0,
      },
    });
  } catch (error) {
    console.error('Error generating digest:', error);
    return NextResponse.json(
      { error: 'Failed to generate digest' },
      { status: 500 }
    );
  }
}
