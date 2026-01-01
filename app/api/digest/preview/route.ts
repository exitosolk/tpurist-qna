import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateDigestEmail, DigestData } from '@/lib/email-digest';

// Preview endpoint - shows HTML email in browser for testing
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const frequency = searchParams.get('frequency') as 'daily' | 'weekly' || 'weekly';

    // Sample digest data for preview
    const sampleDigestData: DigestData = {
      userName: session.user.name || 'Traveler',
      followedQuestions: [
        {
          id: 1,
          slug: 'best-time-to-visit-sigiriya',
          title: 'What is the best time to visit Sigiriya Rock Fortress?',
          answer_count: 5,
          new_answers: 2,
          score: 12,
          followed_at: new Date().toISOString(),
        },
        {
          id: 2,
          slug: 'how-to-get-from-colombo-to-ella',
          title: 'How to get from Colombo to Ella by train?',
          answer_count: 8,
          new_answers: 1,
          score: 25,
          followed_at: new Date().toISOString(),
        },
        {
          id: 3,
          slug: 'vegetarian-food-in-galle',
          title: 'Where can I find good vegetarian food in Galle Fort?',
          answer_count: 3,
          new_answers: 3,
          score: 8,
          followed_at: new Date().toISOString(),
        },
      ],
      followedTags: [
        {
          tag_name: 'beaches',
          new_questions: [
            {
              id: 10,
              slug: 'best-beaches-for-snorkeling',
              title: 'Which beaches in Sri Lanka are best for snorkeling?',
              answer_count: 0,
              new_answers: 0,
              score: 5,
              followed_at: new Date().toISOString(),
            },
            {
              id: 11,
              slug: 'mirissa-vs-unawatuna',
              title: 'Mirissa vs Unawatuna - which beach is better for families?',
              answer_count: 2,
              new_answers: 0,
              score: 3,
              followed_at: new Date().toISOString(),
            },
          ],
        },
        {
          tag_name: 'transportation',
          new_questions: [
            {
              id: 12,
              slug: 'renting-car-sri-lanka',
              title: 'Is it safe to rent a car and drive in Sri Lanka as a tourist?',
              answer_count: 1,
              new_answers: 0,
              score: 7,
              followed_at: new Date().toISOString(),
            },
            {
              id: 13,
              slug: 'airport-transfer-negombo',
              title: 'Best way to get from airport to Negombo at midnight?',
              answer_count: 0,
              new_answers: 0,
              score: 2,
              followed_at: new Date().toISOString(),
            },
            {
              id: 14,
              slug: 'train-booking-advance',
              title: 'How far in advance should I book train tickets?',
              answer_count: 4,
              new_answers: 0,
              score: 15,
              followed_at: new Date().toISOString(),
            },
          ],
        },
        {
          tag_name: 'budget',
          new_questions: [
            {
              id: 15,
              slug: 'daily-budget-backpacker',
              title: 'What is a realistic daily budget for backpackers in Sri Lanka?',
              answer_count: 6,
              new_answers: 0,
              score: 20,
              followed_at: new Date().toISOString(),
            },
          ],
        },
      ],
      periodStart: new Date(Date.now() - (frequency === 'daily' ? 86400000 : 604800000)),
      periodEnd: new Date(),
      frequency,
    };

    const htmlContent = generateDigestEmail(sampleDigestData);

    // Return HTML for browser preview
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error generating preview:', error);
    return NextResponse.json(
      { error: 'Failed to generate preview' },
      { status: 500 }
    );
  }
}
