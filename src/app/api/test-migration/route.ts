import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // Try to query the Episode table to verify migration was applied
    const episodeCount = await prisma.episode.count();
    
    return NextResponse.json({
      status: "ok",
      message: "Episode table exists",
      episodeCount: episodeCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // If the error mentions "does not exist" or "unknown", the table doesn't exist
    const migrationPending = errorMessage.includes("does not exist") || 
                            errorMessage.includes("unknown");
    
    return NextResponse.json({
      status: "error",
      message: errorMessage,
      migrationApplied: !migrationPending,
      migrationPending: migrationPending,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
