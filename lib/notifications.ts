import { query } from "./db";

interface NotificationParams {
  userId: number;
  type: 'answer' | 'question_upvote' | 'question_downvote' | 'answer_upvote' | 'answer_downvote' | 'comment' | 'accepted_answer' | 'badge' | 'followed_question_answer' | 'followed_tag_question';
  actorId: number;
  message: string;
  questionId?: number;
  answerId?: number;
  commentId?: number;
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

    await query(
      `INSERT INTO notifications (user_id, type, actor_id, question_id, answer_id, comment_id, message) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, type, actorId, questionId || null, answerId || null, commentId || null, message]
    );
  } catch (error) {
    console.error("Error creating notification:", error);
    // Don't throw - notifications shouldn't break the main flow
  }
}
