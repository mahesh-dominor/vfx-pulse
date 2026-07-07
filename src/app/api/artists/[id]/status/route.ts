import { auth } from "@/auth";
import { artistService } from "@/services/artist.service";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const statusSchema = z.object({
  isActive: z.boolean(),
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

    const artist = await artistService.updateArtistActiveStatus(id, parsed.data.isActive);
    return NextResponse.json(artist);
  } catch (error) {
    console.error("PATCH /api/artists/[id]/status error:", error);
    return NextResponse.json({ error: "Failed to update artist status" }, { status: 500 });
  }
}
