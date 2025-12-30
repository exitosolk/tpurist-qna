# Integration Example for Review System

This file demonstrates how to integrate the review system components into your existing pages.

## Example: Adding to Question Detail Page

### 1. Import the components

```tsx
import FlagButton from '@/components/FlagButton';
import ContentFlagWarning from '@/components/ContentFlagWarning';
```

### 2. Update your API to fetch content flags

Modify your answer/question fetching query to include flag information:

```tsx
// In fetchQuestion or fetchAnswers function
const [answers] = await connection.query(`
  SELECT 
    a.*,
    u.username,
    u.display_name,
    u.reputation,
    cf.flag_type,
    cf.is_active as is_flagged
  FROM answers a
  JOIN users u ON a.user_id = u.id
  LEFT JOIN content_flags cf ON cf.content_type = 'answer' 
    AND cf.content_id = a.id 
    AND cf.is_active = TRUE
  WHERE a.question_id = ?
  ORDER BY a.is_accepted DESC, a.score DESC
`, [questionId]);
```

### 3. Add TypeScript interfaces

```tsx
interface Answer extends User {
  id: number;
  user_id: number;
  body: string;
  score: number;
  is_accepted: boolean;
  created_at: string;
  edited_at?: string;
  edit_count: number;
  experience_date?: string;
  comments?: Comment[];
  // Add these new fields for review system
  flag_type?: 'hidden_spam' | 'outdated';
  is_flagged?: boolean;
}
```

### 4. Display warnings at the top of answers

```tsx
{/* In the answer rendering section */}
<div key={answer.id} className="bg-white rounded-lg shadow-sm p-6 mb-6">
  {/* Show warning if content is flagged */}
  {answer.is_flagged && answer.flag_type && (
    <ContentFlagWarning flagType={answer.flag_type} />
  )}

  {/* Rest of your answer rendering */}
  <MarkdownRenderer content={answer.body} />
  
  {/* ... other content ... */}
</div>
```

### 5. Add flag button to action bar

```tsx
{/* Action buttons - add after Share, Edit, Bookmark buttons */}
<div className="flex flex-wrap gap-4 my-4 text-sm text-gray-600">
  <Tooltip content="Share a link to this answer">
    <button onClick={() => handleShareAnswer(answer.id)} className="flex items-center gap-1 hover:text-blue-600">
      <Share2 className="w-4 h-4" /> Share
    </button>
  </Tooltip>

  {currentUserId === answer.user_id && (
    <button onClick={() => handleEditAnswer(answer.id)} className="flex items-center gap-1 hover:text-blue-600">
      <Edit className="w-4 h-4" /> Edit
    </button>
  )}

  <button onClick={() => handleFollowAnswer(answer.id)} className="flex items-center gap-1 hover:text-blue-600">
    <Bookmark className="w-4 h-4" /> Follow
  </button>

  {/* Add the flag button here */}
  <FlagButton 
    contentType="answer" 
    contentId={answer.id}
    compact={true}
  />
  
  <span className="text-gray-300">|</span>
  
  <button onClick={() => toggleComments(answer.id)} className="hover:text-blue-600">
    Add a comment
  </button>
</div>
```

## Example: Adding to Comments

```tsx
{/* In comment rendering */}
{answer.comments?.map((comment) => (
  <div key={comment.id} className="text-sm border-l-2 border-gray-200 pl-4 py-2">
    {comment.is_flagged && comment.flag_type && (
      <ContentFlagWarning flagType={comment.flag_type} compact={true} />
    )}
    
    <p className="text-gray-700 mb-1">{comment.text}</p>
    
    <div className="flex items-center gap-2 text-xs text-gray-500">
      <Link href={`/users/${comment.username}`} className="hover:text-blue-600">
        {comment.display_name}
      </Link>
      <span>•</span>
      <span>{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
      <span>•</span>
      <FlagButton 
        contentType="comment" 
        contentId={comment.id}
        compact={true}
      />
    </div>
  </div>
))}
```

## Example: Filtering Hidden Content

To hide spam content from regular users (optional):

```tsx
// In your API route
const isAdmin = session.user.role === 'admin'; // Adjust based on your auth

const [answers] = await connection.query(`
  SELECT 
    a.*,
    u.username,
    u.display_name,
    cf.flag_type,
    cf.is_active as is_flagged
  FROM answers a
  JOIN users u ON a.user_id = u.id
  LEFT JOIN content_flags cf ON cf.content_type = 'answer' 
    AND cf.content_id = a.id 
    AND cf.flag_type = 'hidden_spam'
    AND cf.is_active = TRUE
  WHERE a.question_id = ?
    ${!isAdmin ? 'AND cf.id IS NULL' : ''}  -- Hide spam from regular users
  ORDER BY 
    CASE WHEN cf.flag_type = 'outdated' THEN 1 ELSE 0 END,  -- Outdated answers shown last
    a.is_accepted DESC, 
    a.score DESC
`, [questionId]);
```

## Complete Example for Question Page

```tsx
// app/questions/[id]/page.tsx

import FlagButton from '@/components/FlagButton';
import ContentFlagWarning from '@/components/ContentFlagWarning';

// ... inside your component render

<div className="space-y-6">
  {/* Question */}
  <div className="bg-white rounded-lg shadow-sm p-6">
    {question.is_flagged && question.flag_type && (
      <ContentFlagWarning flagType={question.flag_type} />
    )}
    
    <h1 className="text-2xl font-bold mb-4">{question.title}</h1>
    <MarkdownRenderer content={question.body} />
    
    <div className="flex gap-4 mt-4 text-sm text-gray-600">
      <button onClick={handleShare}>Share</button>
      {currentUserId === question.user_id && <button onClick={handleEdit}>Edit</button>}
      <FlagButton contentType="question" contentId={question.id} compact={true} />
    </div>
  </div>

  {/* Answers */}
  {answers.map(answer => (
    <div key={answer.id} className="bg-white rounded-lg shadow-sm p-6">
      {answer.is_flagged && answer.flag_type && (
        <ContentFlagWarning flagType={answer.flag_type} />
      )}
      
      <MarkdownRenderer content={answer.body} />
      
      <div className="flex gap-4 mt-4 text-sm text-gray-600">
        <button onClick={() => handleShareAnswer(answer.id)}>Share</button>
        {currentUserId === answer.user_id && <button onClick={() => handleEditAnswer(answer.id)}>Edit</button>}
        <FlagButton contentType="answer" contentId={answer.id} compact={true} />
      </div>
      
      {/* Comments */}
      {answer.comments?.map(comment => (
        <div key={comment.id} className="mt-3 pl-4 border-l-2 border-gray-200">
          {comment.is_flagged && comment.flag_type && (
            <ContentFlagWarning flagType={comment.flag_type} compact={true} />
          )}
          <p>{comment.text}</p>
          <div className="flex gap-2 text-xs text-gray-500 mt-1">
            <Link href={`/users/${comment.username}`}>{comment.display_name}</Link>
            <FlagButton contentType="comment" contentId={comment.id} compact={true} />
          </div>
        </div>
      ))}
    </div>
  ))}
</div>
```

## Notes

1. **Compact mode**: Use `compact={true}` for inline flag buttons in smaller spaces (like comment sections)
2. **Callbacks**: Use `onFlagged` prop to refresh content after flagging
3. **Permissions**: The FlagButton component automatically checks user reputation on the backend
4. **Hidden content**: Decide whether to filter out `hidden_spam` content entirely or show it with warnings
5. **Outdated content**: Always show outdated content but with prominent warnings
