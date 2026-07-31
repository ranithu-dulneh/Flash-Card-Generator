"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  LogOut,
  Plus,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  FileText,
  Upload,
  AlertCircle,
  Loader2,
  X,
  BookOpen,
} from "lucide-react";
import Papa from "papaparse";

interface FlashcardPreview {
  question: string;
  answer: string;
}

interface SessionWithCount {
  id: string;
  slug: string;
  name: string;
  createdAt: string;
  _count: {
    flashcards: number;
  };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [sessions, setSessions] = useState<SessionWithCount[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Modal / Creation States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sessionName, setSessionName] = useState("");
  const [slug, setSlug] = useState("");
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedCards, setParsedCards] = useState<FlashcardPreview[]>([]);
  const [hasHeaders, setHasHeaders] = useState(false);
  const [firstRowAsHeaders, setFirstRowAsHeaders] = useState<[string, string] | null>(null);
  const [allRawRows, setAllRawRows] = useState<string[][]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Toast / Copy feedback state
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Check Authentication on Load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/admin/check");
        if (!res.ok) {
          router.push("/admin/login");
        } else {
          setCheckingAuth(false);
          fetchSessions();
        }
      } catch {
        router.push("/admin/login");
      }
    };
    checkAuth();
  }, [router]);

  // Auto-slugify when Session Name changes (if not manually edited)
  useEffect(() => {
    if (!isSlugManuallyEdited && !isCreating) {
      const suggested = sessionName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setSlug(suggested);
    }
  }, [sessionName, isSlugManuallyEdited, isCreating]);

  // 2. Fetch Active Sessions
  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await fetch("/api/admin/sessions");
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (err) {
      console.error("Error fetching sessions:", err);
    } finally {
      setLoadingSessions(false);
    }
  };

  // 3. Logout handler
  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/admin/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // 4. Delete session handler
  const handleDeleteSession = async (id: string) => {
    if (!confirm("Are you sure you want to delete this session? All associated flashcards will be permanently removed.")) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/sessions/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== id));
      } else {
        const data = await res.json();
        alert(data.message || "Failed to delete session");
      }
    } catch (err) {
      console.error("Delete session error:", err);
      alert("An error occurred while deleting the session.");
    } finally {
      setDeletingId(null);
    }
  };

  // 5. CSV Parsing via Papaparse
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    setCsvFile(file);
    setCreateError(null);

    Papa.parse<string[]>(file, {
      skipEmptyLines: "greedy",
      complete: (results) => {
        const rows = results.data;
        if (rows.length === 0) {
          setCreateError("The uploaded CSV file is empty.");
          return;
        }

        setAllRawRows(rows);

        // Analyze first row for headers
        const firstRow = rows[0];
        if (firstRow && firstRow.length >= 2) {
          const valA = firstRow[0].toLowerCase();
          const valB = firstRow[1].toLowerCase();

          // Standard header keywords
          const isHeader =
            valA.includes("question") ||
            valA.includes("term") ||
            valA.includes("card") ||
            valA.includes("prompt") ||
            valB.includes("answer") ||
            valB.includes("definition") ||
            valB.includes("meaning") ||
            valB.includes("result");

          if (isHeader) {
            setHasHeaders(true);
            setFirstRowAsHeaders([firstRow[0], firstRow[1]]);
          } else {
            setHasHeaders(false);
            setFirstRowAsHeaders(null);
          }
        }

        parseCardsFromRows(rows, hasHeaders);
      },
      error: (err) => {
        console.error("CSV parse error:", err);
        setCreateError(`Failed to parse CSV file: ${err.message}`);
      },
    });
  };

  // Re-parse when headers toggle changes
  const parseCardsFromRows = (rows: string[][], skipFirst: boolean) => {
    const startIndex = skipFirst ? 1 : 0;
    const cards: FlashcardPreview[] = [];

    for (let i = startIndex; i < rows.length; i++) {
      const row = rows[i];
      if (row && row.length >= 2) {
        cards.push({
          question: row[0],
          answer: row[1],
        });
      }
    }

    setParsedCards(cards);
  };

  const handleHeaderToggle = (checked: boolean) => {
    setHasHeaders(checked);
    parseCardsFromRows(allRawRows, checked);
  };

  // 6. Submit New Session Creator
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!sessionName.trim()) {
      setCreateError("Please enter a session name.");
      return;
    }
    if (!slug.trim()) {
      setCreateError("Please enter a URL slug.");
      return;
    }
    if (parsedCards.length === 0) {
      setCreateError("Please upload a valid CSV file with at least one question and answer.");
      return;
    }

    setIsCreating(true);

    try {
      const res = await fetch("/api/admin/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: sessionName,
          slug,
          flashcards: parsedCards,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Reset states
        setIsModalOpen(false);
        setSessionName("");
        setSlug("");
        setIsSlugManuallyEdited(false);
        setCsvFile(null);
        setParsedCards([]);
        setAllRawRows([]);
        setHasHeaders(false);
        setFirstRowAsHeaders(null);

        // Refresh sessions list
        fetchSessions();
      } else {
        setCreateError(data.message || "Failed to create session.");
      }
    } catch (err) {
      console.error("Create error:", err);
      setCreateError("An unexpected error occurred while saving the session.");
    } finally {
      setIsCreating(false);
    }
  };

  // 7. Copy link helper
  const handleCopyLink = (sessionSlug: string) => {
    const fullUrl = `${window.location.origin}/session/${sessionSlug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedSlug(sessionSlug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  if (checkingAuth) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-2" />
        <p className="text-slate-500 dark:text-slate-400 font-medium">Verifying admin credentials...</p>
      </div>
    );
  }

  return (
    <main className="flex-1 bg-slate-50 dark:bg-slate-950 min-h-screen">
      {/* Navbar */}
      <header className="sticky top-0 z-10 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 py-4 px-6 md:px-12 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 text-white rounded-xl">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
              Flashy Admin
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Classroom Flashcard Studio</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700/50 rounded-xl transition font-medium text-sm cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </header>

      {/* Main Dashboard Area */}
      <div className="max-w-6xl mx-auto px-6 py-10 md:px-12">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 mb-10">
          <div>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              Manage Your Sessions
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Create educational flashcard sets and share the clean links directly with your students.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex justify-center items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-150 dark:shadow-none transition cursor-pointer self-start md:self-auto"
          >
            <Plus className="w-5 h-5" />
            Create Flashcard Session
          </button>
        </div>

        {/* Sessions List / Table */}
        {loadingSessions ? (
          <div className="flex flex-col justify-center items-center py-24 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Loading active sessions...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center text-center py-20 px-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm max-w-2xl mx-auto">
            <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl mb-5">
              <FileText className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">No active sessions yet</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md">
              Create your very first session by uploading a CSV. Once created, you will get a magic link that your students can use to review vocabulary, formulas, historical dates, and more!
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-6 flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl font-semibold transition cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              Upload CSV Now
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition duration-200 group"
              >
                <div>
                  <div className="flex justify-between items-start gap-3 mb-3">
                    <span className="px-2.5 py-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 rounded-full">
                      {session._count.flashcards} {session._count.flashcards === 1 ? "card" : "cards"}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {new Date(session.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition mb-1">
                    {session.name}
                  </h3>
                  <p className="text-xs font-mono text-slate-400 dark:text-slate-500 truncate mb-4">
                    /session/{session.slug}
                  </p>
                </div>

                <div className="space-y-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                  {/* Shareable Link display and copy */}
                  <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate pl-1">
                      {typeof window !== "undefined"
                        ? `${window.location.origin}/session/${session.slug}`
                        : `.../session/${session.slug}`}
                    </span>
                    <button
                      onClick={() => handleCopyLink(session.slug)}
                      className="p-1.5 bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg shadow-sm border border-slate-100 dark:border-slate-600 transition cursor-pointer"
                      title="Copy student link"
                    >
                      {copiedSlug === session.slug ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Quick actions */}
                  <div className="flex justify-between items-center gap-3">
                    <a
                      href={`/session/${session.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex justify-center items-center gap-1.5 py-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl border border-transparent hover:border-slate-100 dark:hover:border-slate-700/85 transition text-sm font-semibold"
                    >
                      View Cards
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    <button
                      disabled={deletingId === session.id}
                      onClick={() => handleDeleteSession(session.id)}
                      className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 active:bg-rose-100 rounded-xl transition cursor-pointer disabled:opacity-50"
                      title="Delete Session"
                    >
                      {deletingId === session.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Trash2 className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload & Create Session Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            onClick={() => {
              if (!isCreating) setIsModalOpen(false);
            }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
          />

          {/* Modal Card */}
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  New Flashcard Session
                </h3>
              </div>
              <button
                disabled={isCreating}
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <form onSubmit={handleCreateSession} className="flex-1 overflow-y-auto p-6 space-y-6">
              {createError && (
                <div className="flex items-start gap-3 p-4 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-100 dark:border-rose-900 text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="font-medium">{createError}</p>
                </div>
              )}

              {/* Step 1: Info */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Session Name
                  </label>
                  <input
                    type="text"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    required
                    placeholder="e.g. English Literature Class"
                    disabled={isCreating}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:text-slate-100 transition text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex justify-between">
                    URL Slug
                    <span className="text-[10px] font-normal lowercase text-slate-400">
                      customizable
                    </span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs select-none">
                      /session/
                    </span>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => {
                        setIsSlugManuallyEdited(true);
                        setSlug(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9\-]+/g, "") // restrict format in real-time
                        );
                      }}
                      required
                      placeholder="english-lit"
                      disabled={isCreating}
                      className="w-full pl-[4.5rem] pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:text-slate-100 font-mono text-sm transition"
                    />
                  </div>
                </div>
              </div>

              {/* Step 2: Drag and Drop CSV Upload */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Upload CSV File
                </label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file && file.name.endsWith(".csv")) {
                      processFile(file);
                    } else {
                      setCreateError("Please drop a valid .csv file.");
                    }
                  }}
                  className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-2xl p-8 text-center bg-slate-50/50 dark:bg-slate-800/10 cursor-pointer transition flex flex-col items-center justify-center relative"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".csv"
                    className="hidden"
                  />
                  <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-xl shadow-xs border border-slate-100 dark:border-slate-700 mb-3">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    {csvFile ? csvFile.name : "Select or drag your CSV file"}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">
                    Two columns exactly: Column A is the Question and Column B is the Answer.
                  </p>

                  {csvFile && (
                    <span className="mt-3 text-xs font-semibold px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-100 dark:border-emerald-900/30">
                      Successfully Loaded File
                    </span>
                  )}
                </div>
              </div>

              {/* Step 3: Column Header mapping & Preview */}
              {parsedCards.length > 0 && (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        CSV Data Preview
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Found {parsedCards.length} flashcard{parsedCards.length === 1 ? "" : "s"}
                      </p>
                    </div>

                    {firstRowAsHeaders && (
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hasHeaders}
                          onChange={(e) => handleHeaderToggle(e.target.checked)}
                          disabled={isCreating}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-4 h-4"
                        />
                        Skip first row (Headers: {firstRowAsHeaders[0]}, {firstRowAsHeaders[1]})
                      </label>
                    )}
                  </div>

                  {/* Tiny Table Preview */}
                  <div className="border border-slate-150 dark:border-slate-850 rounded-xl overflow-hidden text-sm">
                    <div className="grid grid-cols-2 bg-slate-50 dark:bg-slate-800/80 px-4 py-2 font-bold text-slate-600 dark:text-slate-300 border-b border-slate-150 dark:border-slate-850 text-xs">
                      <div>Column A (Question)</div>
                      <div>Column B (Answer)</div>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-[180px] overflow-y-auto">
                      {parsedCards.slice(0, 4).map((card, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-2 px-4 py-2.5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs"
                        >
                          <div className="truncate pr-4 border-r border-slate-100 dark:border-slate-800/40">
                            {card.question}
                          </div>
                          <div className="truncate pl-4">{card.answer}</div>
                        </div>
                      ))}
                      {parsedCards.length > 4 && (
                        <div className="px-4 py-2 bg-slate-50/50 dark:bg-slate-800/10 text-center text-[10px] text-slate-400 italic">
                          Showing first 4 rows out of {parsedCards.length} total.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-white dark:bg-slate-900 sticky bottom-0">
                <button
                  type="button"
                  disabled={isCreating}
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition text-sm font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || parsedCards.length === 0}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl font-semibold transition cursor-pointer disabled:opacity-50"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating Session...
                    </>
                  ) : (
                    "Save & Generate Session"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
