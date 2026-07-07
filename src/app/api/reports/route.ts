import { auth } from "@/auth";
import { reportQuerySchema } from "@/features/reports/schemas/report-query.schema";
import { reportService } from "@/services/report.service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    const parsed = reportQuerySchema.safeParse({
      type: searchParams.get("type"),
      projectId: searchParams.get("projectId") ?? undefined,
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid query" },
        { status: 400 }
      );
    }

    const result = await reportService.generate(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/reports error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
