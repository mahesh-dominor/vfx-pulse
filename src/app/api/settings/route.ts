import { auth } from "@/auth";
import { settingsService } from "@/services/settings.service";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await settingsService.listAll();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json({
      studio: [],
      departments: [],
      statuses: [],
      priorities: [],
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const type = body.type as "studio" | "department" | "status" | "priority";

    if (type === "studio") {
      const item = await settingsService.upsertStudioSetting(body.payload);
      return NextResponse.json(item, { status: 201 });
    }

    if (type === "department") {
      const item = await settingsService.createDepartment(body.payload);
      return NextResponse.json(item, { status: 201 });
    }

    if (type === "status") {
      const item = await settingsService.createStatus(body.payload);
      return NextResponse.json(item, { status: 201 });
    }

    if (type === "priority") {
      const item = await settingsService.createPriority(body.payload);
      return NextResponse.json(item, { status: 201 });
    }

    return NextResponse.json({ error: "Invalid settings type" }, { status: 400 });
  } catch (error) {
    console.error("POST /api/settings error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const type = body.type as "department" | "status" | "priority";
    const id = body.id as string | undefined;

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    if (type === "department") {
      const item = await settingsService.updateDepartment(id, body.payload);
      return NextResponse.json(item);
    }

    if (type === "status") {
      const item = await settingsService.updateStatus(id, body.payload);
      return NextResponse.json(item);
    }

    if (type === "priority") {
      const item = await settingsService.updatePriority(id, body.payload);
      return NextResponse.json(item);
    }

    return NextResponse.json({ error: "Invalid settings type" }, { status: 400 });
  } catch (error) {
    console.error("PATCH /api/settings error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") as "department" | "status" | "priority" | null;
    const id = searchParams.get("id");

    if (!type || !id) {
      return NextResponse.json({ error: "Missing type or id" }, { status: 400 });
    }

    if (type === "department") {
      await settingsService.softDeleteDepartment(id);
      return NextResponse.json({ success: true });
    }

    if (type === "status") {
      await settingsService.softDeleteStatus(id);
      return NextResponse.json({ success: true });
    }

    if (type === "priority") {
      await settingsService.softDeletePriority(id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid settings type" }, { status: 400 });
  } catch (error) {
    console.error("DELETE /api/settings error:", error);
    return NextResponse.json({ error: "Failed to delete settings item" }, { status: 500 });
  }
}
