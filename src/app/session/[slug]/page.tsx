import { getSession } from "@/lib/firebase";
import { notFound } from "next/navigation";
import StudentFlashcardClient from "./StudentFlashcardClient";
import StudentQuizClient from "./StudentQuizClient";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const session = await getSession(slug);

  if (!session) {
    return {
      title: "Session Not Found",
    };
  }

  return {
    title: `${session.name} - ${session.type === "quiz" ? "Quiz" : "Flashcards"}`,
    description: `Review ${session.type === "quiz" ? "quiz questions" : "flashcards"} for ${session.name} online.`,
  };
}

export default async function StudentSessionPage({ params }: PageProps) {
  const { slug } = await params;

  // Fetch session with ordered flashcards
  const session = await getSession(slug);

  if (!session) {
    notFound();
  }

  if (session.type === "quiz") {
    return (
      <StudentQuizClient
        session={{
          id: session.id,
          name: session.name,
          slug: session.slug,
          flashcards: session.flashcards ? session.flashcards.map((fc: any) => ({
            id: fc.id,
            question: fc.question,
            options: fc.options || [],
            correctAnswer: fc.correctAnswer || 1,
            explanation: fc.explanation || "",
            order: fc.order,
          })) : [],
        }}
      />
    );
  }

  return (
    <StudentFlashcardClient
      session={{
        id: session.id,
        name: session.name,
        slug: session.slug,
        flashcards: session.flashcards ? session.flashcards.map((fc: any) => ({
          id: fc.id,
          question: fc.question,
          answer: fc.answer,
        })) : [],
      }}
    />
  );
}
