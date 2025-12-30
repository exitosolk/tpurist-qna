-- Add 'badge' type to notifications table ENUM
ALTER TABLE notifications 
MODIFY COLUMN type ENUM(
  'answer', 
  'question_upvote', 
  'question_downvote', 
  'answer_upvote', 
  'answer_downvote', 
  'comment', 
  'accepted_answer',
  'badge'
) NOT NULL;
