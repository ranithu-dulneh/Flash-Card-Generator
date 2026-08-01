import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/auth";
import { getAllSessions, deleteSession } from "@/lib/firebase";

// Helper function to check authorization
async function isAuthorized(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("admin_session");
    return !!session && verifySessionToken(session.value);
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

    // Find the session with the matching id
    const sessions = await getAllSessions();
    const sessionToDelete = sessions.find((s) => s.id === id);

    if (!sessionToDelete) {
      return NextResponse.json(
        { success: false, message: "Session not found" },
        { status: 404 }
      );
    }

    // Delete session from Firebase Realtime Database using its slug
    await deleteSession(sessionToDelete.slug);

    return NextResponse.json({
      success: true,
      message: `Session "${sessionToDelete.name}" deleted successfully`,
    });
  } catch (error) {
    console.error("Delete session error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete session" },
      { status: 500 }
    );
  }
}
