import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { checkRateLimit, recordRateLimitAction } from "@/lib/rate-limit";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const params = await context.params;
    const body = await req.json();
    const { 
      body: answerBody, 
      experience_date,
      location 
    } = body;

    if (!answerBody) {
      return NextResponse.json(
        { error: "Answer body is required" },
        { status: 400 }
      );
    }

    // Get user ID
    const userResult = await query(
      "SELECT id, email_verified FROM users WHERE email = ?",
      [session.user.email]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check email verification
    if (!userResult.rows[0].email_verified) {
      return NextResponse.json(
        { 
          error: "Please verify your email address before posting answers",
          verification_required: true 
        },
        { status: 403 }
      );
    }

    const userId = userResult.rows[0].id;
    const questionId = params.id;

    // Check rate limit
    const rateLimitCheck = await checkRateLimit(userId, 'answer');
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { 
          error: rateLimitCheck.message,
          rate_limit_exceeded: true,
          limit: rateLimitCheck.limit,
          resetAt: rateLimitCheck.resetAt
        },
        { status: 429 }
      );
    }

    // Create answer
    const hasLocation = location?.placeId && location?.latitude && location?.longitude;
    
    let insertQuery: string;
    let insertParams: any[];
    
    if (hasLocation && experience_date) {
      insertQuery = `INSERT INTO answers 
        (question_id, user_id, body, experience_date, place_id, place_name, formatted_address, latitude, longitude) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      insertParams = [
        questionId, userId, answerBody, experience_date,
        location.placeId, location.placeName, location.formattedAddress, 
        location.latitude, location.longitude
      ];
    } else if (hasLocation) {
      insertQuery = `INSERT INTO answers 
        (question_id, user_id, body, place_id, place_name, formatted_address, latitude, longitude) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      insertParams = [
        questionId, userId, answerBody,
        location.placeId, location.placeName, location.formattedAddress, 
        location.latitude, location.longitude
      ];
    } else if (experience_date) {
      insertQuery = `INSERT INTO answers (question_id, user_id, body, experience_date) VALUES (?, ?, ?, ?)`;
      insertParams = [questionId, userId, answerBody, experience_date];
    } else {
      insertQuery = `INSERT INTO answers (question_id, user_id, body) VALUES (?, ?, ?)`;
      insertParams = [questionId, userId, answerBody];
    }
    
    const answerResult = await query(insertQuery, insertParams);
    const answerId = answerResult.insertId;

    // Update question answer count and last activity
    await query(
      `UPDATE questions 
       SET answer_count = answer_count + 1, 
           last_activity_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [questionId]
    );

    // Get question owner to send notification
    const questionResult = await query(
      "SELECT user_id, title FROM questions WHERE id = ?",
      [questionId]
    );

    if (questionResult.rows && questionResult.rows.length > 0) {
      const questionOwnerId = questionResult.rows[0].user_id;
      const questionTitle = questionResult.rows[0].title;

      // Create notification for question owner (if not the answerer)
      if (questionOwnerId !== userId) {
        await createNotification({
          userId: questionOwnerId,
          type: 'answer',
          actorId: userId,
          message: `answered your question "${questionTitle}"`,
          questionId: parseInt(questionId),
          answerId: answerId,
        });
      }

      // Notify all users following this question
      const followersResult = await query(
        `SELECT DISTINCT user_id FROM question_follows 
         WHERE question_id = ? AND user_id != ?`,
        [questionId, userId]
      );

      if (followersResult.rows && followersResult.rows.length > 0) {
        // Create notifications for all followers
        for (const follower of followersResult.rows) {
          // Don't duplicate notification if follower is also the question owner
          if (follower.user_id !== questionOwnerId) {
            await createNotification({
              userId: follower.user_id,
              type: 'followed_question_answer',
              actorId: userId,
              message: `answered a question you're following: "${questionTitle}"`,
              questionId: parseInt(questionId),
              answerId: answerId,
            });
          }
        }
      }
    }

    // Record rate limit action
    await recordRateLimitAction(userId, 'answer');

    return NextResponse.json(
      { answerId, message: "Answer posted successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating answer:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
