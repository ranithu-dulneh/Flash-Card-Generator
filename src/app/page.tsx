import Link from "next/link";
import { BookOpen, Sparkles, ArrowRight, ShieldCheck, Zap } from "lucide-react";

export default function Home() {
  return (
    <main className="flex-1 bg-radial from-slate-50 to-indigo-50/50 dark:from-slate-950 dark:to-indigo-950/20 flex flex-col justify-center items-center px-6 py-20 text-center">
      <div className="max-w-3xl space-y-8">
        {/* Brand Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 rounded-full border border-indigo-100 dark:border-indigo-900/50 text-xs font-bold text-indigo-600 dark:text-indigo-400 shadow-xs animate-fade-in">
          <Sparkles className="w-4.5 h-4.5" />
          Classroom Flashcard Studio
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-800 dark:text-slate-100 leading-none">
          Learn Smarter with <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
            Interactive Flashcards
          </span>
        </h1>

        {/* Hero Description */}
        <p className="text-base md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Create, customize, and share interactive flashcard sessions with your students. Simply upload a standard two-column CSV with your questions and answers, and get a dedicated, beautiful shareable link.
        </p>

        {/* Hero Buttons */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
          <Link
            href="/admin/dashboard"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-150 dark:shadow-none transition cursor-pointer text-sm"
          >
            Go to Admin Dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/admin/login"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 active:bg-slate-100 dark:active:bg-slate-850 rounded-2xl font-bold shadow-xs border border-slate-200 dark:border-slate-800 transition cursor-pointer text-sm"
          >
            Admin Log In
          </Link>
        </div>

        {/* Features List */}
        <div className="grid gap-6 sm:grid-cols-3 pt-16 max-w-4xl mx-auto">
          <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-md p-6 rounded-2xl border border-slate-100 dark:border-slate-850 text-left space-y-2">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl w-fit">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Two-Column CSVs</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Drop any spreadsheet or raw text CSV. Column A represents the card question, and Column B is the card answer.
            </p>
          </div>

          <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-md p-6 rounded-2xl border border-slate-100 dark:border-slate-850 text-left space-y-2">
            <div className="p-2.5 bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 rounded-xl w-fit">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Rich Student Experience</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Students swipe, tap to flip, use physical keyboard shortcuts, track their mastering progress, and shuffle questions.
            </p>
          </div>

          <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-md p-6 rounded-2xl border border-slate-100 dark:border-slate-850 text-left space-y-2">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl w-fit">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Secured Workspace</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Admin sessions are cookie-protected. Manage URL slugs, review contents before generating, and delete active sessions.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
