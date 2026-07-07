import { auth } from "@/auth";
import { shotSchema } from "@/features/shots/schemas/shot.schema";
import { shotService } from "@/services/shot.service";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = shotSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const shot = await shotService.updateShot(id, parsed.data);
    return NextResponse.json(shot);
  } catch (error) {
    console.error("PATCH /api/shots/[id] error:", error);
    return NextResponse.json({ error: "Failed to update shot" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await shotService.softDeleteShot(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/shots/[id] error:", error);
    return NextResponse.json({ error: "Failed to remove shot" }, { status: 500 });
  }
}
