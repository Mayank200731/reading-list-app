import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  BookOpen,
  Bookmark,
  CheckCircle2,
  CheckCheck,
  Library,
  Plus,
  Trash2,
  X,
} from "lucide-react";

type Status = "Want to Read" | "Reading" | "Finished";

interface Book {
  id: string;
  title: string;
  status: Status;
}

const STATUS_ORDER: Status[] = ["Want to Read", "Reading", "Finished"];

const STATUS_STYLES: Record<Status, string> = {
  "Want to Read": "bg-amber-50 text-amber-700 ring-amber-200",
  Reading: "bg-sky-50 text-sky-700 ring-sky-200",
  Finished: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

const STATUS_DOTS: Record<Status, string> = {
  "Want to Read": "bg-amber-500",
  Reading: "bg-sky-500",
  Finished: "bg-emerald-500",
};

const STORAGE_KEY = "reading-list-books";

function loadBooks(): Book[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Book[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (b) => b && typeof b.title === "string" && STATUS_ORDER.includes(b.status)
    );
  } catch {
    return [];
  }
}

export default function App() {
  const [books, setBooks] = useState<Book[]>(() => loadBooks());
  const [filter, setFilter] = useState<Status | "All">("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<Status>("Want to Read");
  const [error, setError] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
  }, [books]);

  const counts = useMemo(() => {
    const c: Record<Status, number> = {
      "Want to Read": 0,
      Reading: 0,
      Finished: 0,
    };
    books.forEach((b) => (c[b.status] += 1));
    return c;
  }, [books]);

  const visibleBooks = useMemo(() => {
    if (filter === "All") return books;
    return books.filter((b) => b.status === filter);
  }, [books, filter]);

  const openModal = () => {
    setTitle("");
    setStatus("Want to Read");
    setError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setError("");
  };

  const addBook = () => {
    const trimmed = title.trim();
    if (!trimmed) {
      setError("Please enter a book title.");
      return;
    }
    if (trimmed.length > 60) {
      setError("Book title must be 60 characters or fewer.");
      return;
    }
    const normalized = trimmed.replace(/\s+/g, " ").toLowerCase();
    const duplicate = books.some(
      (b) => b.title.trim().replace(/\s+/g, " ").toLowerCase() === normalized
    );
    if (duplicate) {
      setError("This book is already in your reading list.");
      return;
    }
    setBooks((prev) => [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: trimmed,
        status,
      },
      ...prev,
    ]);
    closeModal();
  };

  const cycleStatus = (id: string) => {
    setBooks((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        const idx = STATUS_ORDER.indexOf(b.status);
        const next = STATUS_ORDER[(idx + 1) % STATUS_ORDER.length];
        return { ...b, status: next };
      })
    );
  };

  const setStatusFor = (id: string, next: Status) => {
    setBooks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: next } : b))
    );
  };

  const removeBook = (id: string) => {
    setBooks((prev) => prev.filter((b) => b.id !== id));
  };

  const filters: (Status | "All")[] = ["All", ...STATUS_ORDER];

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-stone-900 text-white">
              <Library size={22} />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                Reading List
              </h1>
              <p className="text-sm text-stone-500">
                Track books you want to read, are reading, and have finished.
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* Summary */}
        <section className="mb-8 grid grid-cols-3 gap-3 sm:gap-4">
          <SummaryCard
            label="Total Books"
            value={books.length}
            icon={<Library size={18} />}
            tone="stone"
          />
          <SummaryCard
            label="Currently Reading"
            value={counts["Reading"]}
            icon={<BookOpen size={18} />}
            tone="sky"
          />
          <SummaryCard
            label="Finished"
            value={counts["Finished"]}
            icon={<CheckCircle2 size={18} />}
            tone="emerald"
          />
        </section>

        {/* Controls */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => {
              const active = filter === f;
              const count =
                f === "All" ? books.length : counts[f as Status];
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-stone-900 text-white"
                      : "bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-100"
                  }`}
                >
                  {f}
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-xs ${
                      active
                        ? "bg-white/20 text-white"
                        : "bg-stone-100 text-stone-500"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={openModal}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-800 active:bg-stone-950"
          >
            <Plus size={18} />
            Add Book
          </button>
        </div>

        {/* Content */}
        {books.length === 0 ? (
          <EmptyState />
        ) : visibleBooks.length === 0 ? (
          <NoMatches filter={filter} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onCycle={cycleStatus}
                onSetStatus={setStatusFor}
                onRemove={removeBook}
              />
            ))}
          </div>
        )}
      </main>

      {/* Add Book Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900/40 p-0 sm:items-center sm:p-4"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Add a book</h2>
              <button
                onClick={closeModal}
                className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                addBook();
              }}
              className="space-y-4"
            >
              <div>
                <label className="mb-1.5 block text-sm font-medium text-stone-700">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  maxLength={60}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="e.g. The Great Gatsby"
                  autoFocus
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10 ${
                    error ? "border-red-400" : "border-stone-300"
                  }`}
                />
                {error && (
                  <p className="mt-1.5 text-xs text-red-600">{error}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-stone-700">
                  Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {STATUS_ORDER.map((s) => {
                    const active = status === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStatus(s)}
                        className={`flex flex-col items-center gap-1 rounded-lg px-2 py-3 text-xs font-medium transition-colors ${
                          active
                            ? "bg-stone-900 text-white"
                            : "bg-stone-50 text-stone-600 ring-1 ring-stone-200 hover:bg-stone-100"
                        }`}
                      >
                        <StatusIcon status={s} />
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg px-4 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-800"
                >
                  Add book
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusIcon({ status }: { status: Status }) {
  if (status === "Want to Read") return <Bookmark size={16} />;
  if (status === "Reading") return <BookOpen size={16} />;
  return <CheckCircle2 size={16} />;
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-200 bg-white px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 text-stone-400">
        <Library size={26} />
      </div>
      <p className="text-base font-medium text-stone-700">
        Your reading list is empty. Add your first book.
      </p>
    </div>
  );
}

function NoMatches({ filter }: { filter: Status | "All" }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white px-6 py-12 text-center">
      <p className="text-sm text-stone-500">
        No books in <span className="font-medium text-stone-700">{filter}</span>.
      </p>
    </div>
  );
}

interface BookCardProps {
  book: Book;
  onCycle: (id: string) => void;
  onSetStatus: (id: string, status: Status) => void;
  onRemove: (id: string) => void;
}

function BookCard({ book, onCycle, onSetStatus, onRemove }: BookCardProps) {
  return (
    <div className="group flex flex-col rounded-xl border border-stone-200 bg-white p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <button
          onClick={() => onCycle(book.id)}
          title="Click to advance status"
          className="flex-1 text-left"
        >
          <h3 className="font-medium leading-snug text-stone-900 group-hover:text-stone-700">
            {book.title}
          </h3>
        </button>
        <button
          onClick={() => onRemove(book.id)}
          className="rounded-md p-1 text-stone-300 transition-colors hover:bg-red-50 hover:text-red-500"
          aria-label="Remove book"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${STATUS_STYLES[book.status]}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOTS[book.status]}`} />
          {book.status}
        </span>

        <CheckCheck
          size={14}
          className="text-stone-300"
          aria-hidden
        />
      </div>

      <div className="mt-3 border-t border-stone-100 pt-3">
        <div className="flex gap-1">
          {STATUS_ORDER.map((s) => {
            const active = book.status === s;
            return (
              <button
                key={s}
                onClick={() => onSetStatus(book.id, s)}
                className={`flex-1 rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors ${
                  active
                    ? "bg-stone-100 text-stone-900"
                    : "text-stone-400 hover:bg-stone-50 hover:text-stone-600"
                }`}
              >
                {s === "Want to Read"
                  ? "Want"
                  : s === "Reading"
                    ? "Reading"
                    : "Done"}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onRemove(book.id)}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-medium text-stone-400 transition-colors hover:bg-red-50 hover:text-red-500"
        >
          <Trash2 size={13} />
          Delete
        </button>
      </div>
    </div>
  );
}

interface SummaryCardProps {
  label: string;
  value: number;
  icon: ReactNode;
  tone: "stone" | "sky" | "emerald";
}

function SummaryCard({ label, value, icon, tone }: SummaryCardProps) {
  const toneClasses: Record<SummaryCardProps["tone"], string> = {
    stone: "bg-stone-100 text-stone-600",
    sky: "bg-sky-100 text-sky-600",
    emerald: "bg-emerald-100 text-emerald-600",
  };
  return (
    <div className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-4">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${toneClasses[tone]}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xl font-semibold leading-none text-stone-900">
          {value}
        </p>
        <p className="mt-1 truncate text-xs text-stone-500">{label}</p>
      </div>
    </div>
  );
}
