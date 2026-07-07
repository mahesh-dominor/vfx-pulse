import { auth } from "@/auth";
import { reviewService } from "@/services/review.service";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const reviewUpdateSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "APPROVED", "REJECTED"]),
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
    const parsed = reviewUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const review = await reviewService.updateReviewStatus(id, parsed.data.status);

    return NextResponse.json(review);
  } catch (error) {
    console.error("PATCH /api/reviews/[id] error:", error);
    return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await reviewService.softDeleteReview(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/reviews/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete review" }, { status: 500 });
  }
}
