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
    const projectId = searchParams.get("projectId") ?? undefined;
    const artistId = searchParams.get("artistId") ?? undefined;
    const status = (searchParams.get("status") ?? undefined) as
      | "OPEN"
      | "IN_PROGRESS"
      | "RESOLVED"
      | "APPROVED"
      | "REJECTED"
      | undefined;
    const search = searchParams.get("search") ?? undefined;
    const fromDate = searchParams.get("fromDate")
      ? new Date(searchParams.get("fromDate") as string)
      : undefined;
    const toDate = searchParams.get("toDate")
      ? new Date(searchParams.get("toDate") as string)
      : undefined;

    const reviews = await reviewService.listReviews({
      shotId,
      projectId,
      artistId,
      status,
      search,
      fromDate,
      toDate,
    });
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
