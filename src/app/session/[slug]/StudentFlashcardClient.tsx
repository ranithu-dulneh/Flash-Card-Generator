"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Shuffle,
  RotateCcw,
  CheckCircle,
  HelpCircle,
  BookOpen,
  ArrowLeft,
  Maximize2,
  Minimize2,
  ThumbsUp,
  ThumbsDown,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Flashcard {
  id: string;
  question: string;
  answer: string;
}

interface Session {
  id: string;
  name: string;
  slug: string;
  flashcards: Flashcard[];
}

interface StudentFlashcardClientProps {
  session: Session;
}

type CardStatus = "unclassified" | "mastered" | "review";

export default function StudentFlashcardClient({ session }: StudentFlashcardClientProps) {
  // Original list of flashcards
  const originalCards = session.flashcards;

  // Working state list of flashcards (could be shuffled, filtered, etc.)
  const [cards, setCards] = useState<Flashcard[]>(originalCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  // Status mapping: cardId -> "mastered" | "review" | "unclassified"
  const [cardStatuses, setCardStatuses] = useState<Record<string, CardStatus>>({});

  // Filters: "all" | "mastered" | "review"
  const [filter, setFilter] = useState<"all" | "mastered" | "review">("all");

  // Load statuses from local storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`flashy_status_${session.id}`);
      if (stored) {
        setCardStatuses(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load progress:", e);
    }
  }, [session.id]);

  // Save statuses to local storage
  const saveStatus = useCallback((cardId: string, status: CardStatus) => {
    setCardStatuses((prev) => {
      const updated = { ...prev, [cardId]: status };
      try {
        localStorage.setItem(`flashy_status_${session.id}`, JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save progress:", e);
      }
      return updated;
    });
  }, [session.id]);

  // Construct final card list based on shuffle and filter
  const applySettings = useCallback((shuffleActive: boolean, filterActive: "all" | "mastered" | "review") => {
    let list = [...originalCards];

    // 1. Filter first
    if (filterActive === "mastered") {
      list = list.filter((c) => cardStatuses[c.id] === "mastered");
    } else if (filterActive === "review") {
      list = list.filter((c) => cardStatuses[c.id] === "review");
    }

    // 2. Shuffle if active
    if (shuffleActive) {
      // Fisher-Yates shuffle
      for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
      }
    }

    setCards(list);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [originalCards, cardStatuses]);

  // Trigger applySettings when filter or shuffle changes
  useEffect(() => {
    applySettings(isShuffled, filter);
  }, [isShuffled, filter, applySettings]);

  const handleNext = useCallback(() => {
    if (cards.length === 0) return;
    setIsFlipped(false);
    // Add small delay to let flip animation finish if it was flipped
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % cards.length);
    }, isFlipped ? 150 : 0);
  }, [cards.length, isFlipped]);

  const handlePrev = useCallback(() => {
    if (cards.length === 0) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
    }, isFlipped ? 150 : 0);
  }, [cards.length, isFlipped]);

  const handleFlip = useCallback(() => {
    if (cards.length === 0) return;
    setIsFlipped((prev) => !prev);
  }, [cards.length]);

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        handleFlip();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (e.code === "ArrowUp" || e.code === "ArrowDown") {
        e.preventDefault();
        handleFlip();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleFlip, handleNext, handlePrev]);

  // Calculate current card and statistics
  const currentCard = cards[currentIndex];
  const totalMastered = originalCards.filter((c) => cardStatuses[c.id] === "mastered").length;
  const totalReview = originalCards.filter((c) => cardStatuses[c.id] === "review").length;
  const totalUnclassified = originalCards.length - totalMastered - totalReview;

  // Drag swipe handlers (framer-motion)
  const handleDragEnd = (event: any, info: any) => {
    const threshold = 100;
    if (info.offset.x < -threshold) {
      handleNext();
    } else if (info.offset.x > threshold) {
      handlePrev();
    }
  };

  const toggleShuffle = () => {
    setIsShuffled((prev) => !prev);
  };

  const resetAllProgress = () => {
    if (confirm("Are you sure you want to reset all your mastered and review flags for this session?")) {
      setCardStatuses({});
      localStorage.removeItem(`flashy_status_${session.id}`);
      setFilter("all");
    }
  };

  return (
    <div className={`flex-1 flex flex-col bg-radial from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 transition duration-300 ${fullscreen ? "p-0" : "p-4 md:p-6"}`}>

      {/* Header bar (hidden in strict full-screen on mobile, toggleable) */}
      {!fullscreen && (
        <header className="max-w-4xl w-full mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 pt-4 animate-fade-in">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm font-semibold transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Home
          </Link>

          <div className="text-center sm:text-right">
            <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
              {session.name}
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">
              /session/{session.slug}
            </p>
          </div>
        </header>
      )}

      {/* Main learning workspace */}
      <div className="flex-1 max-w-4xl w-full mx-auto flex flex-col justify-center items-center gap-6 py-4">

        {/* Controls row */}
        <div className="w-full flex flex-wrap items-center justify-between gap-4 px-2">
          {/* Progress indicators / filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-xl font-bold border transition cursor-pointer ${
                filter === "all"
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-150 dark:shadow-none"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850"
              }`}
            >
              All ({originalCards.length})
            </button>
            <button
              onClick={() => setFilter("mastered")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold border transition cursor-pointer ${
                filter === "mastered"
                  ? "bg-emerald-600 border-emerald-600 text-white shadow-md"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20"
              }`}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              Mastered ({totalMastered})
            </button>
            <button
              onClick={() => setFilter("review")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold border transition cursor-pointer ${
                filter === "review"
                  ? "bg-amber-600 border-amber-600 text-white shadow-md"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-amber-600 dark:text-amber-400 hover:bg-amber-50/30 dark:hover:bg-amber-950/20"
              }`}
            >
              <ThumbsDown className="w-3.5 h-3.5" />
              Review ({totalReview})
            </button>
          </div>

          {/* Quick utility buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleShuffle}
              className={`p-2.5 rounded-xl border transition cursor-pointer ${
                isShuffled
                  ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 font-bold"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
              title={isShuffled ? "Shuffling Active" : "Shuffle Cards"}
            >
              <Shuffle className="w-4.5 h-4.5" />
            </button>

            <button
              onClick={() => setFullscreen((prev) => !prev)}
              className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl transition cursor-pointer"
              title={fullscreen ? "Exit Fullscreen" : "Fullscreen Focus"}
            >
              {fullscreen ? <Minimize2 className="w-4.5 h-4.5" /> : <Maximize2 className="w-4.5 h-4.5" />}
            </button>

            {(totalMastered > 0 || totalReview > 0) && (
              <button
                onClick={resetAllProgress}
                className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-rose-500 hover:text-rose-600 rounded-xl transition cursor-pointer"
                title="Reset learning stats"
              >
                <RotateCcw className="w-4.5 h-4.5" />
              </button>
            )}
          </div>
        </div>

        {/* Empty list screen */}
        {cards.length === 0 ? (
          <div className="flex-1 flex flex-col justify-center items-center py-24 px-6 text-center max-w-md">
            <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl mb-4">
              <BookOpen className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              No cards match your filter
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              {filter === "mastered"
                ? "You haven't marked any cards as 'Mastered' yet. Study all cards and tap 'Mastered' to fill this list!"
                : "You don't have any cards marked as 'Need to Review' yet! Keep practicing!"}
            </p>
            <button
              onClick={() => setFilter("all")}
              className="mt-6 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md transition cursor-pointer text-sm"
            >
              View All Cards
            </button>
          </div>
        ) : (
          /* Active Flashcard Study Shell */
          <div className="w-full flex-1 flex flex-col items-center justify-center max-w-2xl px-2">

            {/* The 3D Interactive Flip Card Frame with Drag Swiping */}
            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={handleDragEnd}
              className="w-full aspect-[4/3] max-h-[380px] perspective-1000 cursor-pointer relative"
              whileTap={{ scale: 0.98 }}
            >
              <div
                onClick={handleFlip}
                className={`w-full h-full duration-500 preserve-3d transition-transform relative rounded-3xl shadow-xl border border-slate-150/80 dark:border-slate-800/80 ${
                  isFlipped ? "rotate-y-180" : ""
                }`}
              >
                {/* CARD FRONT: QUESTION */}
                <div className="absolute inset-0 backface-hidden bg-white dark:bg-slate-900 rounded-3xl p-8 flex flex-col justify-between overflow-y-auto">
                  {/* Front card tag */}
                  <div className="flex justify-between items-center text-xs text-slate-400 dark:text-slate-500 font-bold select-none uppercase tracking-widest">
                    <span>Question</span>
                    <div className="flex items-center gap-1.5">
                      {cardStatuses[currentCard.id] === "mastered" && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px]">
                          <CheckCircle className="w-3 h-3" /> Mastered
                        </span>
                      )}
                      {cardStatuses[currentCard.id] === "review" && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-full text-[10px]">
                          <HelpCircle className="w-3 h-3" /> Review
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question text */}
                  <div className="flex-1 flex items-center justify-center text-center my-6">
                    <p className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100 leading-relaxed px-4 break-words">
                      {currentCard.question}
                    </p>
                  </div>

                  {/* Prompt hint */}
                  <div className="text-center text-xs text-slate-400 dark:text-slate-500 font-semibold select-none flex items-center justify-center gap-1.5">
                    <RotateCw className="w-3.5 h-3.5" />
                    Tap card to reveal answer
                  </div>
                </div>

                {/* CARD BACK: ANSWER */}
                <div className="absolute inset-0 backface-hidden rotate-y-180 bg-slate-900 dark:bg-slate-950 rounded-3xl p-8 flex flex-col justify-between overflow-y-auto text-white shadow-2xl">
                  {/* Back card tag */}
                  <div className="flex justify-between items-center text-xs text-slate-300 dark:text-slate-400 font-bold select-none uppercase tracking-widest">
                    <span>Answer</span>
                    <div className="flex items-center gap-1.5">
                      {cardStatuses[currentCard.id] === "mastered" && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full text-[10px]">
                          <CheckCircle className="w-3 h-3" /> Mastered
                        </span>
                      )}
                      {cardStatuses[currentCard.id] === "review" && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded-full text-[10px]">
                          <HelpCircle className="w-3 h-3" /> Review
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Answer text */}
                  <div className="flex-1 flex items-center justify-center text-center my-6">
                    <p className="text-xl md:text-2xl font-bold text-slate-50 dark:text-slate-100 leading-relaxed px-4 break-words">
                      {currentCard.answer}
                    </p>
                  </div>

                  {/* Prompt hint */}
                  <div className="text-center text-xs text-slate-300 dark:text-slate-400 font-semibold select-none flex items-center justify-center gap-1.5">
                    <RotateCw className="w-3.5 h-3.5" />
                    Tap card to show question
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Instruction tooltip / indicator for swipes and keys */}
            <div className="flex items-center gap-2 mt-4 text-xs text-slate-400 dark:text-slate-500 font-semibold bg-slate-100/50 dark:bg-slate-800/40 px-3 py-1.5 rounded-full select-none">
              <Info className="w-3.5 h-3.5" />
              <span>Swipe left/right or use arrow keys & spacebar</span>
            </div>

            {/* Learning Status Actions: Mark as Mastered vs Need Review */}
            <div className="w-full grid grid-cols-2 gap-4 mt-6">
              <button
                onClick={() => saveStatus(currentCard.id, "mastered")}
                className={`flex items-center justify-center gap-2 py-3 rounded-2xl border transition cursor-pointer font-bold text-sm shadow-xs ${
                  cardStatuses[currentCard.id] === "mastered"
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50/50 hover:text-emerald-600 dark:hover:bg-emerald-950/20 dark:hover:text-emerald-400"
                }`}
              >
                <ThumbsUp className="w-4 h-4" />
                Mastered
              </button>

              <button
                onClick={() => saveStatus(currentCard.id, "review")}
                className={`flex items-center justify-center gap-2 py-3 rounded-2xl border transition cursor-pointer font-bold text-sm shadow-xs ${
                  cardStatuses[currentCard.id] === "review"
                    ? "bg-amber-500 border-amber-500 text-white"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-50/50 hover:text-amber-600 dark:hover:bg-amber-950/20 dark:hover:text-amber-400"
                }`}
              >
                <ThumbsDown className="w-4 h-4" />
                Need Review
              </button>
            </div>

            {/* Pagination Controls and Progress bar */}
            <div className="w-full mt-8 space-y-4">
              {/* On-screen Navigation row */}
              <div className="flex justify-between items-center">
                <button
                  onClick={handlePrev}
                  className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/85 active:bg-slate-100 rounded-2xl shadow-xs transition cursor-pointer"
                  title="Previous Card"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                {/* Card indicator */}
                <div className="text-center">
                  <span className="text-sm font-extrabold text-slate-700 dark:text-slate-300 select-none">
                    Card {currentIndex + 1} of {cards.length}
                  </span>
                  {isShuffled && (
                    <span className="block text-[10px] font-bold text-indigo-500 select-none uppercase tracking-wide">
                      Shuffled Order
                    </span>
                  )}
                </div>

                <button
                  onClick={handleNext}
                  className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/85 active:bg-slate-100 rounded-2xl shadow-xs transition cursor-pointer"
                  title="Next Card"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>

              {/* Progress bar line */}
              <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden select-none">
                <div
                  className="h-full bg-indigo-600 transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
                />
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
