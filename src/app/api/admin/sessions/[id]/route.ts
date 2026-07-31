import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

// Helper function to check authorization
async function isAuthorized(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("admin_session");
    return !!session && session.value === "session_token_admin_authorized";
  } catch {
    return false;
  }
}

// DELETE: Delete a session
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthorized())) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Missing session ID" },
        { status: 400 }
      );
    }

    const deleted = await db.session.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `Session "${deleted.name}" deleted successfully`,
    });
  } catch (error) {
    console.error("Delete session error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete session" },
      { status: 500 }
    );
  }
}
