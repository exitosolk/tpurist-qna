import { query } from "./db";

interface LogReputationChangeParams {
  userId: number;
  changeAmount: number;
  reason: string;
  referenceType: 'question' | 'answer' | 'accepted_answer' | 'email_verification' | 'vote' | 'downvote';
  referenceId?: number | null;
}

export async function logReputationChange({
  userId,
  changeAmount,
  reason,
  referenceType,
  referenceId = null,
}: LogReputationChangeParams): Promise<void> {
  try {
    await query(
      `INSERT INTO reputation_history (user_id, change_amount, reason, reference_type, reference_id)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, changeAmount, reason, referenceType, referenceId]
    );
  } catch (error) {
    console.error("Error logging reputation change:", error);
    // Don't throw - reputation history is supplementary
  }
}

export async function getReputationHistory(userId: number, limit: number = 50) {
  try {
    const result = await query(
      `SELECT * FROM reputation_history 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ?`,
      [userId, limit]
    );
    return result.rows || [];
  } catch (error) {
    console.error("Error fetching reputation history:", error);
    return [];
  }
}
