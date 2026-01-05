-- Add closure and follow notification types to notifications table ENUM
ALTER TABLE notifications 
MODIFY COLUMN type ENUM(
  'answer', 
  'question_upvote', 
  'question_downvote', 
  'answer_upvote', 
  'answer_downvote', 
  'comment', 
  'accepted_answer',
  'badge',
  'question_closed',
  'followed_question_answer',
  'followed_tag_question'
) NOT NULL;
