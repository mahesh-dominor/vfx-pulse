import { auth } from "@/auth";
import { episodeService } from "@/services/episode.service";
import { episodeSchema } from "@/features/episodes/schemas/episode.schema";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }

    const episodes = await episodeService.listEpisodes(projectId);
    return NextResponse.json(episodes);
  } catch (error) {
    console.error("GET /api/episodes error:", error);
    return NextResponse.json({ error: "Failed to fetch episodes" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = episodeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }

    const episode = await episodeService.createEpisode(parsed.data);
    return NextResponse.json(episode, { status: 201 });
  } catch (error) {
    console.error("POST /api/episodes error:", error);
    if (error instanceof Error && error.message.includes("already exists")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create episode" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, code, sortOrder } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing episode id" }, { status: 400 });
    }

    const episode = await episodeService.updateEpisode(id, {
      ...(code && { code }),
      ...(sortOrder !== undefined && { sortOrder }),
    });

    return NextResponse.json(episode);
  } catch (error) {
    console.error("PUT /api/episodes error:", error);
    return NextResponse.json({ error: "Failed to update episode" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing episode id" }, { status: 400 });
    }

    await episodeService.softDeleteEpisode(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/episodes error:", error);
    return NextResponse.json({ error: "Failed to delete episode" }, { status: 500 });
  }
}
