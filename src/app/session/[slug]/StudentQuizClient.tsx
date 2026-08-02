"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  RotateCcw,
  CheckCircle,
  XCircle,
  Lightbulb,
  ChevronRight,
  Sparkles,
  Trophy,
  Award,
  BookOpen,
  HelpCircle,
} from "lucide-react";

interface FirebaseFlashcard {
  id: string;
  question: string;
  options?: string[];
  correctAnswer?: number;
  explanation?: string;
  order: number;
}

interface StudentQuizClientProps {
  session: {
    id: string;
    name: string;
    slug: string;
    flashcards: FirebaseFlashcard[];
  };
}

export default function StudentQuizClient({ session }: StudentQuizClientProps) {
  const { name, slug, flashcards } = session;
  const questions = flashcards || [];

  // Quiz State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  // Local Storage High Scores
  const [highScore, setHighScore] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedScore = localStorage.getItem(`quiz_highscore_${slug}`);
      if (savedScore !== null) {
        setHighScore(parseInt(savedScore));
      }
    }
  }, [slug]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (quizFinished) {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          handleRestart();
        }
        return;
      }

      if (!isAnswered) {
        // Option selection via 1, 2, 3, 4
        if (["1", "2", "3", "4"].includes(e.key)) {
          e.preventDefault();
          const optIdx = parseInt(e.key);
          handleSelectOption(optIdx);
        }
      } else {
        // Next question via Space or Enter
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          handleNextQuestion();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, isAnswered, quizFinished, questions.length]);

  const handleSelectOption = (optionNumber: number) => {
    if (isAnswered) return;

    setSelectedOption(optionNumber);
    setIsAnswered(true);

    const currentQuestion = questions[currentIndex];
    const isCorrect = optionNumber === (currentQuestion.correctAnswer || 1);

    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (!isAnswered) return;

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      // Quiz completed!
      setQuizFinished(true);

      // Update High Score
      if (typeof window !== "undefined") {
        const currentHighScore = localStorage.getItem(`quiz_highscore_${slug}`);
        const currentScoreNum = correctCount + (selectedOption === (questions[currentIndex].correctAnswer || 1) ? 1 : 0);

        if (currentHighScore === null || currentScoreNum > parseInt(currentHighScore)) {
          localStorage.setItem(`quiz_highscore_${slug}`, String(currentScoreNum));
          setHighScore(currentScoreNum);
        }
      }
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setCorrectCount(0);
    setQuizFinished(false);
  };

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6">
        <div className="text-center p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-sm max-w-md border border-slate-100 dark:border-slate-800">
          <HelpCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">No Questions Available</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">This quiz doesn&apos;t contain any valid questions yet.</p>
          <a
            href="/"
            className="mt-6 inline-flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition text-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </a>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const options = currentQuestion.options || [];
  const correctAnswerNumber = currentQuestion.correctAnswer || 1;
  const isSelectedCorrect = selectedOption === correctAnswerNumber;

  // Percentage complete
  const progressPercent = Math.round(((currentIndex) / questions.length) * 100);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col text-slate-800 dark:text-slate-100">

      {/* Quiz Top Header */}
      <header className="sticky top-0 z-20 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-6 py-4 flex justify-between items-center select-none">
        <div className="flex items-center gap-4">
          <a
            href="/"
            className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700/50 text-slate-500 dark:text-slate-400 rounded-xl transition cursor-pointer"
            title="Back to sessions"
          >
            <ArrowLeft className="w-5 h-5" />
          </a>
          <div>
            <h1 className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight truncate max-w-[200px] md:max-w-md">
              {name}
            </h1>
            <p className="text-[10px] text-purple-600 dark:text-purple-400 font-extrabold uppercase tracking-widest mt-0.5">
              Interactive Classroom Quiz
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {highScore !== null && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-full text-xs font-bold border border-amber-100 dark:border-amber-900/30">
              <Trophy className="w-3.5 h-3.5" />
              <span>Best: {highScore}/{questions.length}</span>
            </div>
          )}
          <button
            onClick={handleRestart}
            className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition text-xs font-bold border border-slate-200 dark:border-slate-800 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restart
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-3xl w-full mx-auto px-6 py-8 flex flex-col justify-center">

        <AnimatePresence mode="wait">
          {!quizFinished ? (
            <motion.div
              key={`question-${currentIndex}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-6 flex flex-col"
            >

              {/* Question Progress Tracker */}
              <div className="space-y-2 select-none">
                <div className="flex justify-between text-xs font-extrabold text-slate-400 uppercase tracking-widest">
                  <span>Question {currentIndex + 1} of {questions.length}</span>
                  <span>Score: {correctCount} / {currentIndex}</span>
                </div>
                {/* Custom Progress Bar */}
                <div className="h-2 w-full bg-slate-250 dark:bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-purple-600 rounded-full"
                    initial={{ width: `${progressPercent}%` }}
                    animate={{ width: `${((currentIndex) / questions.length) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              {/* Question Card Display */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-8 shadow-sm flex flex-col justify-center items-center text-center">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 px-3 py-1 rounded-full mb-4 select-none">
                  Multiple Choice
                </span>
                <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100 leading-relaxed px-4 break-words">
                  {currentQuestion.question}
                </h2>
              </div>

              {/* Multiple Choice Options List */}
              <div className="grid gap-3 select-none">
                {options.map((optionText, index) => {
                  const optionNumber = index + 1;
                  const isThisSelected = selectedOption === optionNumber;
                  const isThisCorrect = optionNumber === correctAnswerNumber;

                  // Styling states
                  let optionStyles = "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-200";

                  if (isAnswered) {
                    if (isThisCorrect) {
                      // Correct option turns green
                      optionStyles = "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/30";
                    } else if (isThisSelected && !isThisCorrect) {
                      // Selected incorrect option turns red
                      optionStyles = "border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/30";
                    } else {
                      // Non-selected wrong options are dimmed
                      optionStyles = "border-slate-150 dark:border-slate-850 bg-slate-50/30 dark:bg-slate-900/30 text-slate-400 cursor-not-allowed";
                    }
                  }

                  return (
                    <motion.button
                      key={index}
                      onClick={() => handleSelectOption(optionNumber)}
                      disabled={isAnswered}
                      whileTap={{ scale: isAnswered ? 1 : 0.99 }}
                      className={`w-full flex items-center justify-between p-4.5 rounded-2xl border transition duration-200 text-left font-semibold text-sm cursor-pointer ${optionStyles}`}
                    >
                      <div className="flex items-center gap-3.5 pr-4">
                        {/* Option number circle */}
                        <div className={`w-6.5 h-6.5 shrink-0 flex items-center justify-center rounded-lg text-xs font-bold transition ${
                          isAnswered && isThisCorrect
                            ? "bg-emerald-500 text-white"
                            : isAnswered && isThisSelected && !isThisCorrect
                            ? "bg-rose-500 text-white"
                            : isThisSelected
                            ? "bg-purple-600 text-white"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                        }`}>
                          {optionNumber}
                        </div>
                        <span className="break-words leading-relaxed">{optionText}</span>
                      </div>

                      {/* Right indicator icons */}
                      <div className="shrink-0 pl-2">
                        {isAnswered && isThisCorrect && (
                          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                        )}
                        {isAnswered && isThisSelected && !isThisCorrect && (
                          <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Interactive Slide-down Explanation Box */}
              <AnimatePresence>
                {isAnswered && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className={`rounded-2xl p-6 border flex flex-col gap-3.5 mt-2 ${
                      isSelectedCorrect
                        ? "bg-emerald-50/35 dark:bg-emerald-950/10 border-emerald-100/70 dark:border-emerald-900/20"
                        : "bg-rose-50/35 dark:bg-rose-950/10 border-rose-100/70 dark:border-rose-900/20"
                    }`}>
                      <div className="flex items-center gap-2">
                        {isSelectedCorrect ? (
                          <span className="text-emerald-700 dark:text-emerald-400 text-sm font-extrabold flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-lg uppercase tracking-wide">
                            <Sparkles className="w-4 h-4 text-emerald-500" /> Correct! 🎉
                          </span>
                        ) : (
                          <span className="text-rose-700 dark:text-rose-400 text-sm font-extrabold flex items-center gap-1.5 bg-rose-500/10 px-2.5 py-1 rounded-lg uppercase tracking-wide">
                            <Lightbulb className="w-4 h-4 text-rose-400" /> Incorrect 💡
                          </span>
                        )}
                      </div>

                      {currentQuestion.explanation && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                            Explanation
                          </span>
                          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                            {currentQuestion.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Next Question Navigation bar */}
              {isAnswered && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={handleNextQuestion}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-bold transition text-sm shadow-lg shadow-purple-100 dark:shadow-none cursor-pointer mt-4"
                >
                  <span>
                    {currentIndex + 1 < questions.length ? "Next Question" : "Finish Quiz & View Results"}
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              )}

              {/* Keyboard helper tooltip */}
              <div className="text-center text-[10px] text-slate-400 dark:text-slate-500 font-semibold select-none flex items-center justify-center gap-1 mt-6">
                <span>Press numbers 1-4 to select answer • Press Spacebar / Enter for next question</span>
              </div>

            </motion.div>
          ) : (

            /* QUIZ SUMMARY / FINISH SCREEN */
            <motion.div
              key="finished-summary"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-8 shadow-md text-center space-y-8 max-w-lg mx-auto"
            >

              {/* Trophy/Award Animation Header */}
              <div className="relative inline-block select-none">
                <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-xl scale-125 animate-pulse" />
                <div className="relative p-5 bg-gradient-to-tr from-yellow-500 to-amber-400 text-white rounded-2xl shadow-lg shadow-amber-200 dark:shadow-none">
                  <Award className="w-12 h-12" />
                </div>
              </div>

              {/* Results & Motivation */}
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Quiz Completed!</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto">
                  Fantastic job finishing the session! Here is a summary of your results:
                </p>
              </div>

              {/* Final Score Gauge */}
              <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto select-none">
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                    Your Score
                  </span>
                  <span className="text-3xl font-extrabold text-purple-600 dark:text-purple-400">
                    {correctCount} / {questions.length}
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                    Accuracy
                  </span>
                  <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                    {Math.round((correctCount / questions.length) * 100)}%
                  </span>
                </div>
              </div>

              {/* Performance Summary Text */}
              <div className="text-sm font-semibold select-none">
                {correctCount === questions.length ? (
                  <span className="text-emerald-600 dark:text-emerald-400 flex justify-center items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/20 px-4 py-2 rounded-full w-fit mx-auto">
                    <Sparkles className="w-4 h-4" /> Perfect Score! You have mastered this session!
                  </span>
                ) : correctCount / questions.length >= 0.75 ? (
                  <span className="text-indigo-600 dark:text-indigo-400 flex justify-center items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/20 px-4 py-2 rounded-full w-fit mx-auto">
                    <Award className="w-4 h-4" /> Excellent! You have a great grasp of this topic!
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 flex justify-center items-center gap-1.5 bg-amber-50 dark:bg-amber-950/20 px-4 py-2 rounded-full w-fit mx-auto">
                    <BookOpen className="w-4 h-4" /> Keep practicing! Repeat the quiz to score 100%!
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-center gap-3 select-none">
                <button
                  onClick={handleRestart}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white font-bold rounded-xl transition cursor-pointer text-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                  Try Again
                </button>
                <a
                  href="/"
                  className="flex items-center justify-center gap-2 px-6 py-3 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl transition cursor-pointer text-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to All Sessions
                </a>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
