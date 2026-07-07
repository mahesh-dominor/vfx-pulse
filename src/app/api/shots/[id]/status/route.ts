import { auth } from "@/auth";
import { shotService } from "@/services/shot.service";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const statusSchema = z.object({
  status: z.enum([
    "NOT_STARTED",
    "WIP",
    "INTERNAL_REVIEW",
    "CLIENT_REVIEW",
    "APPROVED",
    "DELIVERED",
    "HOLD",
  ]),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = statusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const shot = await shotService.updateShotStatus(id, parsed.data.status);
    return NextResponse.json(shot);
  } catch (error) {
    console.error("PATCH /api/shots/[id]/status error:", error);
    return NextResponse.json({ error: "Failed to update shot status" }, { status: 500 });
  }
}
