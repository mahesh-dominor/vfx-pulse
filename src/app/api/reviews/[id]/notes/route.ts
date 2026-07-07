import { auth } from "@/auth";
import { reviewService } from "@/services/review.service";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const noteSchema = z.object({
  content: z.string().trim().min(1, "Comment is required").max(2000),
});

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = noteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const note = await reviewService.addNote(id, session.user.id, parsed.data.content);
    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error("POST /api/reviews/[id]/notes error:", error);
    return NextResponse.json({ error: "Failed to add note" }, { status: 500 });
  }
}
