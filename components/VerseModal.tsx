"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { BIBLE_BOOKS, getChapterCount, getVerseCountForChapter } from "@/lib/bible-data";
import { bookDisplayName } from "@/lib/book-names-id";
import {
  getAllowedVersesInChapter,
  isSelectionInConstraint,
  listChaptersInRange,
  type ReadingConstraint,
} from "@/lib/bible-schedule";
import { messages } from "@/lib/i18n";

/**
 * When true, book/chapter/verse pickers are non-interactive (values still come from state,
 * effects, and schedule). Set to false to restore dropdowns.
 */
const DROPDOWNS_DISABLED = true;

type Props = {
  open: boolean;
  onClose: () => void;
  readingConstraint: ReadingConstraint | null;
  onSubmit: (data: {
    book: string;
    chapter: number;
    verse: number;
    verse_text: string;
  }) => void;
};

export function VerseModal({
  open,
  onClose,
  readingConstraint,
  onSubmit,
}: Props) {
  const { locale } = useLocale();
  const m = messages[locale];

  const [book, setBook] = useState("");
  const [chapter, setChapter] = useState("");
  const [verse, setVerse] = useState("");
  const [text, setText] = useState("");

  const scheduled = Boolean(readingConstraint);

  const chapterOptions = useMemo(() => {
    if (!book) return [];
    if (readingConstraint && book === readingConstraint.book) {
      return listChaptersInRange(readingConstraint);
    }
    const n = getChapterCount(book);
    return Array.from({ length: n }, (_, i) => i + 1);
  }, [book, readingConstraint]);

  const verseCountList = useMemo(() => {
    if (!book || !chapter) return [];
    const ch = Number(chapter);
    const maxV = getVerseCountForChapter(book, ch);
    if (readingConstraint && book === readingConstraint.book) {
      return getAllowedVersesInChapter(ch, readingConstraint, maxV);
    }
    return Array.from({ length: maxV }, (_, i) => i + 1);
  }, [book, chapter, readingConstraint]);

  const canSubmit = useMemo(() => {
    if (!book || !chapter || !verse || text.trim().length <= 5) return false;
    const ch = Number(chapter);
    const v = Number(verse);
    if (readingConstraint) {
      return isSelectionInConstraint(book, ch, v, readingConstraint);
    }
    return true;
  }, [book, chapter, verse, text, readingConstraint]);

  useEffect(() => {
    if (!open) return;
    if (readingConstraint) {
      const c = readingConstraint;
      setBook(c.book);
      const firstCh = c.startCh;
      setChapter(String(firstCh));
      const maxV = getVerseCountForChapter(c.book, firstCh);
      const allowed = getAllowedVersesInChapter(firstCh, c, maxV);
      setVerse(allowed.length ? String(allowed[0]) : "");
      setText("");
    } else {
      setBook("");
      setChapter("");
      setVerse("");
      setText("");
    }
  }, [open, readingConstraint]);

  /** Keep verse valid when chapter changes */
  useEffect(() => {
    if (!book || !chapter || verseCountList.length === 0) return;
    const v = Number(verse);
    if (!verseCountList.includes(v)) {
      setVerse(String(verseCountList[0]));
    }
  }, [book, chapter, verse, verseCountList]);

  async function pasteVerse() {
    try {
      const t = await navigator.clipboard.readText();
      setText(t);
    } catch {
      /* manual paste */
    }
  }

  function handleSubmit() {
    if (!canSubmit) return;
    onSubmit({
      book,
      chapter: Number(chapter),
      verse: Number(verse),
      verse_text: text.trim(),
    });
  }

  if (!open) return null;

  const modalSub = scheduled ? m.modalVerseSubtitleScheduled : m.modalVerseSubtitle;

  return (
    <div
      className="absolute inset-0 z-[100] flex items-end justify-center rounded-[var(--vq-radius-xl)] bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="verse-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full animate-vq-slide-up rounded-t-[24px] bg-[var(--vq-bg)] pb-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mt-3 h-1 w-9 rounded-full bg-[var(--vq-border-2)]" />
        <div className="flex items-center justify-between border-b border-[var(--vq-border)] px-5 py-4">
          <div>
            <h2 id="verse-modal-title" className="text-lg font-medium text-[var(--vq-text)]">
              {m.modalVerseTitle}
            </h2>
            <p className="mt-0.5 text-[13px] text-[var(--vq-muted)]">{modalSub}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-[var(--vq-bg-2)] text-[var(--vq-muted)]"
            aria-label={m.modalClose}
          >
            ✕
          </button>
        </div>
        <div className="max-h-[min(70vh,520px)] overflow-y-auto px-5 pt-4">
          <label className="mb-3 block">
            <span className="mb-1.5 block text-[13px] font-medium text-[var(--vq-muted)]">
              {m.labelBook}
            </span>
            {scheduled && readingConstraint ? (
              <div
                className={`w-full rounded-[var(--vq-radius-md)] border border-[var(--vq-border-2)] bg-[var(--vq-bg-2)] px-3.5 py-3 text-[15px] font-medium text-[var(--vq-text)] ${
                  DROPDOWNS_DISABLED ? "pointer-events-none opacity-80" : ""
                }`}
              >
                {bookDisplayName(readingConstraint.book, locale)}
              </div>
            ) : (
              <select
                className="vq-select w-full rounded-[var(--vq-radius-md)] border border-[var(--vq-border-2)] bg-[var(--vq-bg-2)] px-3.5 py-3 text-[15px] text-[var(--vq-text)] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={DROPDOWNS_DISABLED}
                value={book}
                onChange={(e) => {
                  setBook(e.target.value);
                  setChapter("");
                  setVerse("");
                }}
              >
                <option value="">{m.bookPlaceholder}</option>
                <optgroup label={m.ot}>
                  {BIBLE_BOOKS.oldTestament.map((b) => (
                    <option key={b.name} value={b.name}>
                      {bookDisplayName(b.name, locale)}
                    </option>
                  ))}
                </optgroup>
                <optgroup label={m.nt}>
                  {BIBLE_BOOKS.newTestament.map((b) => (
                    <option key={b.name} value={b.name}>
                      {bookDisplayName(b.name, locale)}
                    </option>
                  ))}
                </optgroup>
              </select>
            )}
          </label>

          <div className="mb-3.5 flex gap-2.5">
            <label className="flex-1">
              <span className="mb-1.5 block text-[13px] font-medium text-[var(--vq-muted)]">
                {m.labelChapter}
              </span>
              <select
                className="vq-select min-h-[48px] w-full rounded-[var(--vq-radius-md)] border border-[var(--vq-border-2)] bg-[var(--vq-bg-2)] px-3.5 py-3 text-[15px] text-[var(--vq-text)] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={DROPDOWNS_DISABLED || !book}
                value={chapter}
                onChange={(e) => {
                  setChapter(e.target.value);
                  setVerse("");
                }}
              >
                <option value="">{m.dash}</option>
                {book &&
                  chapterOptions.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
              </select>
            </label>
            <label className="flex-1">
              <span className="mb-1.5 block text-[13px] font-medium text-[var(--vq-muted)]">
                {m.labelVerse}
              </span>
              <select
                className="vq-select min-h-[48px] w-full rounded-[var(--vq-radius-md)] border border-[var(--vq-border-2)] bg-[var(--vq-bg-2)] px-3.5 py-3 text-[15px] text-[var(--vq-text)] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={DROPDOWNS_DISABLED || !chapter}
                value={verse}
                onChange={(e) => setVerse(e.target.value)}
              >
                <option value="">{m.dash}</option>
                {chapter &&
                  verseCountList.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
              </select>
            </label>
          </div>

          <span className="mb-1.5 block text-[13px] font-medium text-[var(--vq-muted)]">
            {m.labelVerseText}
          </span>
          <textarea
            className="mb-3 min-h-[120px] w-full resize-none rounded-[var(--vq-radius-md)] border border-[var(--vq-border-2)] bg-[var(--vq-bg-2)] px-3.5 py-3 pb-3 text-[14px] leading-relaxed text-[var(--vq-text)]"
            placeholder={m.versePlaceholder}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button
            type="button"
            onClick={pasteVerse}
            className="touch-manipulation mb-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[var(--vq-radius-md)] border border-[#AFA9EC] bg-[#EEEDFE] px-4 py-3 text-[14px] font-semibold text-[#534AB7] active:bg-[#ddd8fc]"
          >
            {m.paste}
          </button>

          <button
            type="button"
            disabled={!canSubmit}
            onClick={handleSubmit}
            className="flex w-full min-h-[52px] items-center justify-center gap-2 rounded-[14px] bg-[#534AB7] py-[15px] text-base font-medium text-white transition hover:bg-[#3C3489] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[var(--vq-bg-2)] disabled:text-[var(--vq-muted-2)]"
          >
            <span>🔥</span> {m.submitVerse}
          </button>
        </div>
      </div>
    </div>
  );
}
