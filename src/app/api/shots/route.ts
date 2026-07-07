import { auth } from "@/auth";
import { shotSchema } from "@/features/shots/schemas/shot.schema";
import { shotService } from "@/services/shot.service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    const shots = await shotService.listShots(projectId ?? undefined);

    return NextResponse.json(shots);
  } catch (error) {
    console.error("GET /api/shots error:", error);
    return NextResponse.json(
      { error: "Failed to fetch shots" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = shotSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const shot = await shotService.createShot(parsed.data);
    return NextResponse.json(shot, { status: 201 });
  } catch (error) {
    console.error("POST /api/shots error:", error);

    return NextResponse.json(
      { error: "Failed to create shot" },
      { status: 500 }
    );
  }
}
