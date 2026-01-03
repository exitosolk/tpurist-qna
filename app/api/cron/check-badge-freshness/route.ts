import { NextResponse } from "next/server";
import { checkBadgeFreshness } from "@/lib/tag-badges";

/**
 * Cron job endpoint to check and update freshness of Gold badges
 * Should be called daily via a cron service (e.g., Vercel Cron, GitHub Actions, or external service)
 * 
 * To secure this endpoint, add a CRON_SECRET environment variable and check it:
 * if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
 *   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 * }
 */
export async function GET(req: Request) {
  try {
    // Optional: Check authorization header for cron secret
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log('[CRON] Starting badge freshness check...');
    await checkBadgeFreshness();
    console.log('[CRON] Badge freshness check completed');

    return NextResponse.json({
      success: true,
      message: "Badge freshness check completed",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error in badge freshness cron:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Also support POST for flexibility with cron services
export async function POST(req: Request) {
  return GET(req);
}
