import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface Params {
  slug: string;
}

// GET /api/collectives/[slug] - Get collective details
export async function GET(
  req: NextRequest,
  context: { params: Promise<Params> }
) {
  try {
    const { slug } = await context.params;
    const session = await getServerSession(authOptions);

    // Get collective details
    const collectiveResult = await query(
      `SELECT 
        id, 
        name, 
        slug, 
        description, 
        icon_url, 
        cover_image_url,
        member_count, 
        question_count,
        created_at
      FROM collectives 
      WHERE slug = ?`,
      [slug]
    );

    if (!collectiveResult.rows || collectiveResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Collective not found" },
        { status: 404 }
      );
    }

    const collective = collectiveResult.rows[0];

    // Check if current user is a member
    let isMember = false;
    let memberRole = null;
    if (session?.user?.email) {
      const userResult = await query(
        "SELECT id FROM users WHERE email = ?",
        [session.user.email]
      );

      if (userResult.rows && userResult.rows.length > 0) {
        const userId = userResult.rows[0].id;
        
        const membershipResult = await query(
          "SELECT role FROM collective_members WHERE collective_id = ? AND user_id = ?",
          [collective.id, userId]
        );

        if (membershipResult.rows && membershipResult.rows.length > 0) {
          isMember = true;
          memberRole = membershipResult.rows[0].role;
        }
      }
    }

    // Get recent questions in this collective
    const questionsResult = await query(
      `SELECT 
        q.id,
        q.slug,
        q.title,
        q.score,
        q.views,
        q.answer_count,
        q.created_at,
        u.username,
        u.display_name,
        u.reputation
      FROM collective_questions cq
      JOIN questions q ON cq.question_id = q.id
      JOIN users u ON q.user_id = u.id
      WHERE cq.collective_id = ?
      ORDER BY q.created_at DESC
      LIMIT 20`,
      [collective.id]
    );

    return NextResponse.json({
      collective,
      questions: questionsResult.rows || [],
      isMember,
      memberRole,
    });
  } catch (error) {
    console.error("Error fetching collective:", error);
    return NextResponse.json(
      { error: "Failed to fetch collective" },
      { status: 500 }
    );
  }
}
