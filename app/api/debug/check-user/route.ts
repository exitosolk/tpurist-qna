import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// TEMPORARY DEBUG ENDPOINT - DELETE AFTER DEBUGGING
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    // Check if user exists
    const result = await query(
      'SELECT id, email, username, display_name, email_verified, created_at FROM users WHERE email = ?',
      [email]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ 
        exists: false,
        message: 'No user found with this email'
      });
    }

    const user = result.rows[0];

    // Check if password_hash exists
    const passwordCheck = await query(
      'SELECT LENGTH(password_hash) as hash_length, LEFT(password_hash, 7) as hash_prefix FROM users WHERE email = ?',
      [email]
    );

    return NextResponse.json({
      exists: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.display_name,
        emailVerified: user.email_verified,
        createdAt: user.created_at,
      },
      passwordHashLength: passwordCheck.rows[0]?.hash_length,
      passwordHashPrefix: passwordCheck.rows[0]?.hash_prefix,
    });
  } catch (error: any) {
    console.error('Debug check-user error:', error);
    return NextResponse.json({ 
      error: 'Server error',
      details: error.message 
    }, { status: 500 });
  }
}
