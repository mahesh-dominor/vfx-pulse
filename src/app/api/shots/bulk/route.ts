import { auth } from "@/auth";
import { shotSchema } from "@/features/shots/schemas/shot.schema";
import { shotService } from "@/services/shot.service";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as { shots?: unknown[] };

    if (!Array.isArray(body.shots) || body.shots.length === 0) {
      return NextResponse.json({ error: "No shots provided" }, { status: 400 });
    }

    const validated = body.shots.map((item, index) => {
      const parsed = shotSchema.safeParse(item);
      if (!parsed.success) {
        throw new Error(`Row ${index + 1}: ${parsed.error.issues[0]?.message ?? "Invalid input"}`);
      }
      return parsed.data;
    });

    const created = await Promise.all(validated.map((input) => shotService.createShot(input)));

    return NextResponse.json({ success: true, createdCount: created.length }, { status: 201 });
  } catch (error) {
    console.error("POST /api/shots/bulk error:", error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed bulk import" },
      { status: 400 }
    );
  }
}
