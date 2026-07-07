import { auth } from "@/auth";
import { sequenceSchema } from "@/features/sequences/schemas/sequence.schema";
import { sequenceService } from "@/services/sequence.service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId") ?? undefined;

    const sequences = await sequenceService.listSequences(projectId);
    return NextResponse.json(sequences);
  } catch (error) {
    console.error("GET /api/sequences error:", error);
    return NextResponse.json({ error: "Failed to fetch sequences" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = sequenceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }

    const sequence = await sequenceService.createSequence(parsed.data);
    return NextResponse.json(sequence, { status: 201 });
  } catch (error) {
    console.error("POST /api/sequences error:", error);
    return NextResponse.json({ error: "Failed to create sequence" }, { status: 500 });
  }
}
