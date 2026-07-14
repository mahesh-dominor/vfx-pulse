import { auth } from "@/auth";
import { artistSchema } from "@/features/artists/schemas/artist.schema";
import { artistService } from "@/services/artist.service";
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
    const parsed = artistSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }

    const artist = await artistService.updateArtist(id, parsed.data);
    return NextResponse.json(artist);
  } catch (error) {
    console.error("PATCH /api/artists/[id] error:", error);
    return NextResponse.json({ error: "Failed to update artist" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await artistService.softDeleteArtist(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/artists/[id] error:", error);
    return NextResponse.json({ error: "Failed to remove artist" }, { status: 500 });
  }
}
