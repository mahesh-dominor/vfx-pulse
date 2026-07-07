import { auth } from "@/auth";
import { assetSchema } from "@/features/assets/schemas/asset.schema";
import { assetService } from "@/services/asset.service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId") ?? undefined;

    const assets = await assetService.listAssets(projectId);
    return NextResponse.json(assets);
  } catch (error) {
    console.error("GET /api/assets error:", error);
    return NextResponse.json({ error: "Failed to fetch assets" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = assetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }

    const asset = await assetService.createAsset(parsed.data);
    return NextResponse.json(asset, { status: 201 });
  } catch (error) {
    console.error("POST /api/assets error:", error);
    return NextResponse.json({ error: "Failed to create asset" }, { status: 500 });
  }
}
