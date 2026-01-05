// Integration code snippet for automatic question closure
// Add this to your voting endpoint: app/api/votes/route.ts

import { checkAutoClose } from '@/lib/closure';

// After a downvote is applied to a question:
if (votableType === 'question' && voteType === -1) {
  // Existing code to record vote and update score...
  
  // Check if question should be auto-closed
  const wasClosed = await checkAutoClose(votableId);
  
  if (wasClosed) {
    // Question was automatically closed due to low score
    console.log(`Question ${votableId} was automatically closed`);
  }
}

// You can also manually trigger auto-close check after score updates:
// const wasClosed = await checkAutoClose(questionId);
