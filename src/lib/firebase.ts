import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase, ref, set, get, remove } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAcvwpIWmYzTqYv9feeKboicqP8h32Uk4k",
  authDomain: "exam-prep-flashcards.firebaseapp.com",
  databaseURL: "https://exam-prep-flashcards-default-rtdb.firebaseio.com",
  projectId: "exam-prep-flashcards",
  storageBucket: "exam-prep-flashcards.firebasestorage.app",
  messagingSenderId: "231270392377",
  appId: "1:231270392377:web:8e2a3c358f74c2a04423e8",
  measurementId: "G-H3EL6W6YNC"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const rtdb = getDatabase(app);

export interface FirebaseFlashcard {
  id: string;
  question: string;
  answer: string;
  order: number;
}

export interface FirebaseSession {
  id: string;
  slug: string;
  name: string;
  createdAt: number;
  flashcards: FirebaseFlashcard[];
}

export async function createSession(
  slug: string,
  name: string,
  flashcards: { question: string; answer: string }[]
): Promise<FirebaseSession> {
  const sessionRef = ref(rtdb, `sessions/${slug}`);

  const id = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2);

  const formattedCards: FirebaseFlashcard[] = flashcards.map((card, index) => ({
    id: typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2),
    question: String(card.question || "").trim(),
    answer: String(card.answer || "").trim(),
    order: index,
  }));

  const sessionData: FirebaseSession = {
    id,
    slug,
    name: name.trim(),
    createdAt: Date.now(),
    flashcards: formattedCards,
  };

  await set(sessionRef, sessionData);
  return sessionData;
}

export async function getSession(slug: string): Promise<FirebaseSession | null> {
  const sessionRef = ref(rtdb, `sessions/${slug}`);
  const snapshot = await get(sessionRef);
  if (snapshot.exists()) {
    return snapshot.val() as FirebaseSession;
  }
  return null;
}

export async function deleteSession(slug: string): Promise<void> {
  const sessionRef = ref(rtdb, `sessions/${slug}`);
  await remove(sessionRef);
}

export async function getAllSessions(): Promise<FirebaseSession[]> {
  const sessionsRef = ref(rtdb, "sessions");
  const snapshot = await get(sessionsRef);
  if (snapshot.exists()) {
    const data = snapshot.val();
    const sessionsList = Object.values(data) as FirebaseSession[];
    return sessionsList.sort((a, b) => b.createdAt - a.createdAt);
  }
  return [];
}
