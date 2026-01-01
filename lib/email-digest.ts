// Email digest template generator for followed content
// Generates HTML emails for daily/weekly digests

export interface DigestQuestion {
  id: number;
  slug?: string;
  title: string;
  answer_count: number;
  new_answers: number;
  score: number;
  followed_at: string;
}

export interface DigestTag {
  tag_name: string;
  new_questions: DigestQuestion[];
}

export interface DigestData {
  userName: string;
  followedQuestions: DigestQuestion[];
  followedTags: DigestTag[];
  periodStart: Date;
  periodEnd: Date;
  frequency: 'daily' | 'weekly';
}

export function generateDigestEmail(data: DigestData): string {
  const { userName, followedQuestions, followedTags, frequency } = data;
  
  const totalNewAnswers = followedQuestions.reduce((sum, q) => sum + q.new_answers, 0);
  const totalNewQuestions = followedTags.reduce((sum, tag) => sum + tag.new_questions.length, 0);
  const hasContent = totalNewAnswers > 0 || totalNewQuestions > 0;

  if (!hasContent) {
    return ''; // Don't send empty digests
  }

  const periodText = frequency === 'daily' ? 'today' : 'this week';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://oneceylon.space';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your OneCeylon Digest</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f3f4f6;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .header p {
      margin: 10px 0 0 0;
      opacity: 0.9;
      font-size: 14px;
    }
    .content {
      padding: 30px 20px;
    }
    .greeting {
      font-size: 16px;
      color: #374151;
      margin-bottom: 20px;
    }
    .summary {
      background-color: #eff6ff;
      border-left: 4px solid #2563eb;
      padding: 15px;
      margin-bottom: 30px;
      border-radius: 4px;
    }
    .summary-stats {
      display: flex;
      gap: 20px;
      margin-top: 10px;
    }
    .stat {
      font-size: 24px;
      font-weight: bold;
      color: #2563eb;
    }
    .stat-label {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
    }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e5e7eb;
    }
    .question-card, .tag-card {
      background-color: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 12px;
      transition: box-shadow 0.2s;
    }
    .question-card:hover, .tag-card:hover {
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }
    .question-title {
      font-size: 16px;
      font-weight: 600;
      color: #2563eb;
      text-decoration: none;
      display: block;
      margin-bottom: 8px;
    }
    .question-title:hover {
      color: #1d4ed8;
    }
    .question-meta {
      font-size: 13px;
      color: #6b7280;
      display: flex;
      gap: 15px;
      flex-wrap: wrap;
    }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }
    .badge-new {
      background-color: #dcfce7;
      color: #166534;
    }
    .badge-tag {
      background-color: #dbeafe;
      color: #1e40af;
    }
    .tag-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;
    }
    .tag-name {
      font-size: 15px;
      font-weight: 600;
      color: #1f2937;
    }
    .cta-button {
      display: inline-block;
      background-color: #2563eb;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
      text-align: center;
    }
    .cta-button:hover {
      background-color: #1d4ed8;
    }
    .footer {
      background-color: #f9fafb;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
    }
    .footer a {
      color: #2563eb;
      text-decoration: none;
    }
    .divider {
      height: 1px;
      background-color: #e5e7eb;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>🏝️ OneCeylon</h1>
      <p>Your ${frequency === 'daily' ? 'Daily' : 'Weekly'} Digest</p>
    </div>

    <!-- Content -->
    <div class="content">
      <div class="greeting">
        Hi ${userName},
      </div>

      <div class="summary">
        <div>Here's what happened with your followed content ${periodText}:</div>
        <div class="summary-stats">
          ${totalNewAnswers > 0 ? `
          <div>
            <div class="stat">${totalNewAnswers}</div>
            <div class="stat-label">New Answer${totalNewAnswers !== 1 ? 's' : ''}</div>
          </div>
          ` : ''}
          ${totalNewQuestions > 0 ? `
          <div>
            <div class="stat">${totalNewQuestions}</div>
            <div class="stat-label">New Question${totalNewQuestions !== 1 ? 's' : ''}</div>
          </div>
          ` : ''}
        </div>
      </div>

      <!-- Followed Questions with New Answers -->
      ${followedQuestions.length > 0 ? `
      <div class="section">
        <div class="section-title">📝 Followed Questions - New Answers</div>
        ${followedQuestions.map(q => `
          <div class="question-card">
            <a href="${baseUrl}/questions/${q.slug || q.id}" class="question-title">
              ${q.title}
            </a>
            <div class="question-meta">
              <span class="badge badge-new">+${q.new_answers} new answer${q.new_answers !== 1 ? 's' : ''}</span>
              <span>${q.score} votes</span>
              <span>${q.answer_count} total answers</span>
            </div>
          </div>
        `).join('')}
      </div>
      ` : ''}

      <!-- Followed Tags with New Questions -->
      ${followedTags.filter(tag => tag.new_questions.length > 0).length > 0 ? `
      <div class="section">
        <div class="section-title">🏷️ Followed Tags - New Questions</div>
        ${followedTags.filter(tag => tag.new_questions.length > 0).map(tag => `
          <div class="tag-card">
            <div class="tag-header">
              <span class="badge badge-tag">#${tag.tag_name}</span>
              <span style="font-size: 13px; color: #6b7280;">
                ${tag.new_questions.length} new question${tag.new_questions.length !== 1 ? 's' : ''}
              </span>
            </div>
            ${tag.new_questions.slice(0, 3).map(q => `
              <div style="margin: 8px 0;">
                <a href="${baseUrl}/questions/${q.slug || q.id}" class="question-title" style="font-size: 14px;">
                  ${q.title}
                </a>
                <div style="font-size: 12px; color: #9ca3af;">
                  ${q.score} votes • ${q.answer_count} answers
                </div>
              </div>
            `).join('')}
            ${tag.new_questions.length > 3 ? `
              <div style="margin-top: 10px;">
                <a href="${baseUrl}/questions/tagged/${encodeURIComponent(tag.tag_name)}" 
                   style="font-size: 13px; color: #2563eb; text-decoration: none;">
                  View ${tag.new_questions.length - 3} more →
                </a>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
      ` : ''}

      <!-- Call to Action -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${baseUrl}/profile?tab=following" class="cta-button">
          Manage Your Follows
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>
        You're receiving this because you're following questions or tags on OneCeylon.
      </p>
      <p>
        <a href="${baseUrl}/settings">Update your email preferences</a> • 
        <a href="${baseUrl}">Visit OneCeylon</a>
      </p>
      <p style="margin-top: 15px; color: #9ca3af;">
        © ${new Date().getFullYear()} OneCeylon - Your Sri Lanka Travel Community
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// Plain text version for email clients that don't support HTML
export function generatePlainTextDigest(data: DigestData): string {
  const { userName, followedQuestions, followedTags, frequency } = data;
  
  const totalNewAnswers = followedQuestions.reduce((sum, q) => sum + q.new_answers, 0);
  const totalNewQuestions = followedTags.reduce((sum, tag) => sum + tag.new_questions.length, 0);
  
  if (totalNewAnswers === 0 && totalNewQuestions === 0) {
    return '';
  }

  const periodText = frequency === 'daily' ? 'today' : 'this week';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://oneceylon.space';

  let text = `Hi ${userName},\n\n`;
  text += `Here's what happened with your followed content ${periodText}:\n\n`;
  text += `📊 Summary:\n`;
  if (totalNewAnswers > 0) text += `- ${totalNewAnswers} new answer${totalNewAnswers !== 1 ? 's' : ''}\n`;
  if (totalNewQuestions > 0) text += `- ${totalNewQuestions} new question${totalNewQuestions !== 1 ? 's' : ''}\n`;
  text += `\n`;

  if (followedQuestions.length > 0) {
    text += `📝 FOLLOWED QUESTIONS - NEW ANSWERS\n`;
    text += `${'='.repeat(50)}\n\n`;
    followedQuestions.forEach(q => {
      text += `${q.title}\n`;
      text += `+${q.new_answers} new answer${q.new_answers !== 1 ? 's' : ''} | ${q.score} votes | ${q.answer_count} total answers\n`;
      text += `${baseUrl}/questions/${q.slug || q.id}\n\n`;
    });
  }

  if (followedTags.filter(tag => tag.new_questions.length > 0).length > 0) {
    text += `🏷️  FOLLOWED TAGS - NEW QUESTIONS\n`;
    text += `${'='.repeat(50)}\n\n`;
    followedTags.filter(tag => tag.new_questions.length > 0).forEach(tag => {
      text += `#${tag.tag_name} (${tag.new_questions.length} new)\n`;
      tag.new_questions.slice(0, 3).forEach(q => {
        text += `  • ${q.title}\n`;
        text += `    ${q.score} votes | ${q.answer_count} answers\n`;
        text += `    ${baseUrl}/questions/${q.slug || q.id}\n`;
      });
      if (tag.new_questions.length > 3) {
        text += `  ...and ${tag.new_questions.length - 3} more\n`;
      }
      text += `\n`;
    });
  }

  text += `\nManage your follows: ${baseUrl}/profile?tab=following\n`;
  text += `Update preferences: ${baseUrl}/settings\n\n`;
  text += `© ${new Date().getFullYear()} OneCeylon - Your Sri Lanka Travel Community\n`;

  return text;
}
