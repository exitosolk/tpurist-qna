import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { votableType, votableId, voteType } = body;

    if (!["question", "answer"].includes(votableType)) {
      return NextResponse.json(
        { error: "Invalid votable type" },
        { status: 400 }
      );
    }

    if (![1, -1].includes(voteType)) {
      return NextResponse.json(
        { error: "Invalid vote type" },
        { status: 400 }
      );
    }

    // Get user ID and reputation
    const userResult = await query(
      "SELECT id, reputation FROM users WHERE email = $1",
      [session.user.email]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userId = userResult.rows[0].id;
    const voterReputation = userResult.rows[0].reputation || 0;

    // Check if user is trying to vote on their own content
    const ownerCheckQuery = votableType === "question" 
      ? "SELECT user_id FROM questions WHERE id = ?"
      : "SELECT user_id FROM answers WHERE id = ?";
    
    const ownerResult = await query(ownerCheckQuery, [votableId]);
    
    if (ownerResult.rows.length > 0 && ownerResult.rows[0].user_id === userId) {
      return NextResponse.json(
        { error: "You cannot vote on your own content" },
        { status: 403 }
      );
    }

    const contentOwnerId = ownerResult.rows.length > 0 ? ownerResult.rows[0].user_id : null;

    // Check if user has enough reputation to downvote
    if (voteType === -1 && voterReputation < 10) {
      return NextResponse.json(
        { error: "You need at least 10 reputation points to downvote" },
        { status: 403 }
      );
    }

    // Check if user already voted
    const existingVote = await query(
      `SELECT * FROM votes 
       WHERE user_id = $1 AND votable_type = $2 AND votable_id = $3`,
      [userId, votableType, votableId]
    );

    if (existingVote.rows.length > 0) {
      const currentVote = existingVote.rows[0];
      
      if (currentVote.vote_type === voteType) {
        // Remove vote if clicking same button
        await query(
          `DELETE FROM votes 
           WHERE user_id = $1 AND votable_type = $2 AND votable_id = $3`,
          [userId, votableType, votableId]
        );

        // Update score
        await query(
          `UPDATE ${votableType}s SET score = score - $1 WHERE id = $2`,
          [voteType, votableId]
        );

        // Reverse reputation change for content owner
        if (contentOwnerId) {
          const repChange = votableType === "question" 
            ? (voteType === 1 ? -5 : 2)  // Question: +5 for upvote, -2 for downvote
            : (voteType === 1 ? -10 : 2); // Answer: +10 for upvote, -2 for downvote
          
          await query(
            "UPDATE users SET reputation = GREATEST(0, reputation + ?) WHERE id = ?",
            [repChange, contentOwnerId]
          );
        }

        return NextResponse.json({ message: "Vote removed" });
      } else {
        // Update vote
        await query(
          `UPDATE votes SET vote_type = $1 
           WHERE user_id = $2 AND votable_type = $3 AND votable_id = $4`,
          [voteType, userId, votableType, votableId]
        );

        // Update score (difference is 2 because we're reversing)
        await query(
          `UPDATE ${votableType}s SET score = score + $1 WHERE id = $2`,
          [voteType * 2, votableId]
        );

        // Update reputation for content owner (reversing old vote and applying new vote)
        if (contentOwnerId) {
          const oldRepChange = votableType === "question" 
            ? (currentVote.vote_type === 1 ? -5 : 2)  // Reverse old vote
            : (currentVote.vote_type === 1 ? -10 : 2);
          
          const newRepChange = votableType === "question" 
            ? (voteType === 1 ? 5 : -2)  // Apply new vote
            : (voteType === 1 ? 10 : -2);
          
          await query(
            "UPDATE users SET reputation = GREATEST(0, reputation + ?) WHERE id = ?",
            [oldRepChange + newRepChange, contentOwnerId]
          );
        }

        return NextResponse.json({ message: "Vote updated" });
      }
    } else {
      // Create new vote
      await query(
        `INSERT INTO votes (user_id, votable_type, votable_id, vote_type) 
         VALUES ($1, $2, $3, $4)`,
        [userId, votableType, votableId, voteType]
      );

      // Update score
      await query(
        `UPDATE ${votableType}s SET score = score + $1 WHERE id = $2`,
        [voteType, votableId]
      );

      // Update reputation for content owner
      if (contentOwnerId) {
        const repChange = votableType === "question" 
          ? (voteType === 1 ? 5 : -2)  // Question: +5 for upvote, -2 for downvote
          : (voteType === 1 ? 10 : -2); // Answer: +10 for upvote, -2 for downvote
        
        await query(
          "UPDATE users SET reputation = GREATEST(0, reputation + ?) WHERE id = ?",
          [repChange, contentOwnerId]
        );
      }

      return NextResponse.json({ message: "Vote recorded" }, { status: 201 });
    }
  } catch (error) {
    console.error("Error processing vote:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
