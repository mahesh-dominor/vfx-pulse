import { auth } from "@/auth";
import { artistSchema } from "@/features/artists/schemas/artist.schema";
import { artistService } from "@/services/artist.service";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const artists = await artistService.listArtists();
    return NextResponse.json(artists);
  } catch (error) {
    console.error("GET /api/artists error:", error);
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = artistSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }

    const artist = await artistService.createArtist(parsed.data);
    return NextResponse.json(artist, { status: 201 });
  } catch (error) {
    console.error("POST /api/artists error:", error);
    return NextResponse.json({ error: "Failed to create artist" }, { status: 500 });
  }
}
