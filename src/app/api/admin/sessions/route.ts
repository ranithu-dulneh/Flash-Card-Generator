import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/auth";
import { getAllSessions, createSession, getSession } from "@/lib/firebase";

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

// GET: List all sessions (for admin dashboard)
export async function GET() {
  if (!(await isAuthorized())) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const firebaseSessions = await getAllSessions();

    // Format to match UI expectations (with flashcards count)
    const sessions = firebaseSessions.map((session) => ({
      id: session.id,
      slug: session.slug,
      name: session.name,
      type: session.type || "flashcards",
      createdAt: new Date(session.createdAt).toISOString(),
      _count: {
        flashcards: session.flashcards ? session.flashcards.length : 0,
      },
    }));

    return NextResponse.json({ success: true, sessions });
  } catch (error) {
    console.error("Fetch sessions error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}

// POST: Create a new session with flashcards
export async function POST(request: Request) {
  if (!(await isAuthorized())) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { slug, name, type, flashcards } = await request.json();

    if (!slug || !name || !Array.isArray(flashcards) || flashcards.length === 0) {
      return NextResponse.json(
        { success: false, message: "Missing required fields or flashcards are empty" },
        { status: 400 }
      );
    }

    const sessionType = type === "quiz" ? "quiz" : "flashcards";

    // Sanitize slug: lowercase, replace non-alphanumeric with hyphen
    const sanitizedSlug = slug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    if (!sanitizedSlug) {
      return NextResponse.json(
        { success: false, message: "Invalid slug format" },
        { status: 400 }
      );
    }

    // Check if slug is already taken
    const existingSession = await getSession(sanitizedSlug);

    if (existingSession) {
      return NextResponse.json(
        { success: false, message: `The URL slug "${sanitizedSlug}" is already in use.` },
        { status: 409 }
      );
    }

    // Create session and associated flashcards via Firebase RTDB
    const newSession = await createSession(sanitizedSlug, name, sessionType, flashcards);

    return NextResponse.json({
      success: true,
      message: "Session created successfully!",
      session: {
        id: newSession.id,
        slug: newSession.slug,
        name: newSession.name,
        type: newSession.type,
        createdAt: new Date(newSession.createdAt).toISOString(),
      },
    });
  } catch (error) {
    console.error("Create session error:", error);
    return NextResponse.json(
      { success: false, message: "An error occurred while creating the session" },
      { status: 500 }
    );
  }
}
