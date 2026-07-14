import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  try {
    // Only allow admin users to trigger migrations
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if Episode table exists by attempting a simple query
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();

    try {
      const count = await prisma.episode.count();
      return NextResponse.json({
        status: "ok",
        message: "Episode table already exists",
        episodeCount: count,
      });
    } catch (tableError) {
      const errorMsg = String(tableError);
      
      if (errorMsg.includes("does not exist") || errorMsg.includes("unknown table")) {
        return NextResponse.json({
          status: "pending",
          message: "Episode table does not exist - migration needs to be applied",
          action: "Run 'prisma migrate deploy' on the Vercel environment",
          command: "npx prisma migrate deploy",
        }, { status: 503 });
      }
      
      throw tableError;
    } finally {
      await prisma.$disconnect();
    }
  } catch (error) {
    console.error("Migration check error:", error);
    return NextResponse.json({
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}
