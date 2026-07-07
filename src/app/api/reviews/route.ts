import { auth } from "@/auth";
import { reviewSchema } from "@/features/reviews/schemas/review.schema";
import { reviewService } from "@/services/review.service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const shotId = searchParams.get("shotId") ?? undefined;

    const reviews = await reviewService.listReviews(shotId);
    return NextResponse.json(reviews);
  } catch (error) {
    console.error("GET /api/reviews error:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = reviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }

    const review = await reviewService.createReview(session.user.id, parsed.data);
    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("POST /api/reviews error:", error);
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
  }
}
