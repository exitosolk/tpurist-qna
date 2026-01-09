import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

// GET - Retrieve user's drafts
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userResult = await query(
      "SELECT id FROM users WHERE email = ?",
      [session.user.email]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userId = userResult.rows[0].id;
    const { searchParams } = new URL(req.url);
    const draftType = searchParams.get("type");
    const questionId = searchParams.get("questionId");

    let draftsQuery = "SELECT * FROM drafts WHERE user_id = ?";
    const params: any[] = [userId];

    if (draftType) {
      draftsQuery += " AND draft_type = ?";
      params.push(draftType);
    }

    if (questionId) {
      draftsQuery += " AND question_id = ?";
      params.push(questionId);
    }

    draftsQuery += " ORDER BY updated_at DESC";

    const draftsResult = await query(draftsQuery, params);

    return NextResponse.json({
      drafts: draftsResult.rows
    });
  } catch (error) {
    console.error("Error fetching drafts:", error);
    return NextResponse.json(
      { error: "Failed to fetch drafts" },
      { status: 500 }
    );
  }
}

// POST - Save/update draft
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userResult = await query(
      "SELECT id FROM users WHERE email = ?",
      [session.user.email]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userId = userResult.rows[0].id;
    const body = await req.json();
    const { draftType, title, bodyText, tags, questionId, draftId, location } = body;

    if (!["question", "answer"].includes(draftType)) {
      return NextResponse.json(
        { error: "Invalid draft type" },
        { status: 400 }
      );
    }

    if (!bodyText || bodyText.trim().length === 0) {
      return NextResponse.json(
        { error: "Draft body cannot be empty" },
        { status: 400 }
      );
    }

    // Check if updating existing draft
    if (draftId) {
      await query(
        `UPDATE drafts 
         SET title = ?, body = ?, tags = ?, 
             place_id = ?, place_name = ?, formatted_address = ?, latitude = ?, longitude = ?,
             updated_at = NOW()
         WHERE id = ? AND user_id = ?`,
        [
          title || null, 
          bodyText, 
          tags || null, 
          location?.placeId || null,
          location?.placeName || null,
          location?.formattedAddress || null,
          location?.latitude || null,
          location?.longitude || null,
          draftId, 
          userId
        ]
      );

      return NextResponse.json({
        message: "Draft updated",
        draftId
      });
    }

    // Check if draft already exists for this context
    let existingDraft;
    if (draftType === "answer" && questionId) {
      existingDraft = await query(
        "SELECT id FROM drafts WHERE user_id = ? AND draft_type = ? AND question_id = ?",
        [userId, draftType, questionId]
      );
    } else if (draftType === "question") {
      // Check for recent question draft (within last hour)
      existingDraft = await query(
        "SELECT id FROM drafts WHERE user_id = ? AND draft_type = ? AND updated_at > DATE_SUB(NOW(), INTERVAL 1 HOUR) ORDER BY updated_at DESC LIMIT 1",
        [userId, draftType]
      );
    }

    if (existingDraft && existingDraft.rows.length > 0) {
      const existingDraftId = existingDraft.rows[0].id;
      await query(
        `UPDATE drafts 
         SET title = ?, body = ?, tags = ?,
             place_id = ?, place_name = ?, formatted_address = ?, latitude = ?, longitude = ?,
             updated_at = NOW()
         WHERE id = ?`,
        [
          title || null, 
          bodyText, 
          tags || null, 
          location?.placeId || null,
          location?.placeName || null,
          location?.formattedAddress || null,
          location?.latitude || null,
          location?.longitude || null,
          existingDraftId
        ]
      );

      return NextResponse.json({
        message: "Draft updated",
        draftId: existingDraftId
      });
    }

    // Create new draft
    const insertResult = await query(
      `INSERT INTO drafts (user_id, draft_type, title, body, tags, question_id, 
                           place_id, place_name, formatted_address, latitude, longitude)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId, 
        draftType, 
        title || null, 
        bodyText, 
        tags || null, 
        questionId || null,
        location?.placeId || null,
        location?.placeName || null,
        location?.formattedAddress || null,
        location?.latitude || null,
        location?.longitude || null
      ]
    );

    return NextResponse.json({
      message: "Draft saved",
      draftId: insertResult.insertId
    });
  } catch (error) {
    console.error("Error saving draft:", error);
    return NextResponse.json(
      { error: "Failed to save draft" },
      { status: 500 }
    );
  }
}

// DELETE - Delete draft
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userResult = await query(
      "SELECT id FROM users WHERE email = ?",
      [session.user.email]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userId = userResult.rows[0].id;
    const { searchParams } = new URL(req.url);
    const draftId = searchParams.get("id");

    if (!draftId) {
      return NextResponse.json(
        { error: "Draft ID required" },
        { status: 400 }
      );
    }

    await query(
      "DELETE FROM drafts WHERE id = ? AND user_id = ?",
      [draftId, userId]
    );

    return NextResponse.json({
      message: "Draft deleted"
    });
  } catch (error) {
    console.error("Error deleting draft:", error);
    return NextResponse.json(
      { error: "Failed to delete draft" },
      { status: 500 }
    );
  }
}
