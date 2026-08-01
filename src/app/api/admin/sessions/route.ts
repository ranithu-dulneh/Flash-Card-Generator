import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";

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
    const sessions = await db.session.findMany({
      include: {
        _count: {
          select: { flashcards: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

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
    const { slug, name, flashcards } = await request.json();

    if (!slug || !name || !Array.isArray(flashcards) || flashcards.length === 0) {
      return NextResponse.json(
        { success: false, message: "Missing required fields or flashcards are empty" },
        { status: 400 }
      );
    }

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
    const existingSession = await db.session.findUnique({
      where: { slug: sanitizedSlug },
    });

    if (existingSession) {
      return NextResponse.json(
        { success: false, message: `The URL slug "${sanitizedSlug}" is already in use.` },
        { status: 409 }
      );
    }

    // Create session and associated flashcards
    // Type inference for transaction client dynamically, completely removing dependency on `Prisma` namespace import
    const newSession = await db.$transaction(async (tx: any) => {
      const session = await tx.session.create({
        data: {
          slug: sanitizedSlug,
          name: name.trim(),
        },
      });

      const cardsData = flashcards.map((card: any, index: number) => ({
        question: String(card.question || "").trim(),
        answer: String(card.answer || "").trim(),
        order: index,
        sessionId: session.id,
      }));

      await tx.flashcard.createMany({
        data: cardsData,
      });

      return session;
    });

    return NextResponse.json({
      success: true,
      message: "Session created successfully!",
      session: newSession,
    });
  } catch (error) {
    console.error("Create session error:", error);
    return NextResponse.json(
      { success: false, message: "An error occurred while creating the session" },
      { status: 500 }
    );
  }
}
