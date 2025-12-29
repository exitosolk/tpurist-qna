import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 20;
    const offset = (page - 1) * limit;
    const search = searchParams.get("search") || "";
    
    let sql = `
      SELECT 
        u.id,
        u.username,
        u.display_name,
        u.reputation,
        u.created_at,
        u.bio,
        u.location,
        u.website,
        u.email_verified,
        COUNT(DISTINCT q.id) as question_count,
        COUNT(DISTINCT a.id) as answer_count
      FROM users u
      LEFT JOIN questions q ON u.id = q.user_id
      LEFT JOIN answers a ON u.id = a.user_id
    `;
    
    const params: any[] = [];
    
    if (search) {
      sql += ` WHERE u.username LIKE ? OR u.display_name LIKE ?`;
      params.push(`%${search}%`, `%${search}%`);
    }
    
    sql += `
      GROUP BY u.id
      ORDER BY u.reputation DESC, u.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    params.push(limit, offset);
    
    const users = await query(sql, params);
    
    // Get total count for pagination
    let countSql = `SELECT COUNT(*) as total FROM users`;
    const countParams: any[] = [];
    
    if (search) {
      countSql += ` WHERE username LIKE ? OR display_name LIKE ?`;
      countParams.push(`%${search}%`, `%${search}%`);
    }
    
    const [{ total }] = await query(countSql, countParams);
    
    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
