import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all projects with their sequences
    const projects = await prisma.project.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        episodes: {
          select: {
            id: true,
            code: true,
            sequences: {
              select: {
                id: true,
                code: true,
                name: true,
                episodeId: true,
              },
            },
          },
        },
        sequences: {
          where: {
            episodeId: null,
          },
          select: {
            id: true,
            code: true,
            name: true,
            episodeId: true,
          },
        },
      },
      take: 5,
    });

    return NextResponse.json({
      totalProjectsChecked: projects.length,
      projects: projects.map((p) => ({
        code: p.code,
        name: p.name,
        episodeCount: p.episodes.length,
        sequenceCount: p.sequences.length + p.episodes.reduce((sum, ep) => sum + ep.sequences.length, 0),
        details: {
          episodes: p.episodes.map((ep) => ({
            code: ep.code,
            sequenceCount: ep.sequences.length,
          })),
          rootSequences: p.sequences.length,
        },
      })),
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
