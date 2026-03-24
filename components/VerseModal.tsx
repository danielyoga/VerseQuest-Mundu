"use client";

import { useMemo, useState } from "react";
import { BIBLE_BOOKS, getChapterCount, getVerseCountForChapter } from "@/lib/bible-data";
import { id } from "@/lib/i18n-id";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    book: string;
    chapter: number;
    verse: number;
    verse_text: string;
  }) => void;
};

export function VerseModal({ open, onClose, onSubmit }: Props) {
  const [book, setBook] = useState("");
  const [chapter, setChapter] = useState("");
  const [verse, setVerse] = useState("");
  const [text, setText] = useState("");

  const chapterCount = useMemo(() => (book ? getChapterCount(book) : 0), [book]);
  const verseCount = useMemo(() => {
    if (!book || !chapter) return 0;
    return getVerseCountForChapter(book, Number(chapter));
  }, [book, chapter]);

  const canSubmit =
    Boolean(book && chapter && verse) && text.trim().length > 5;

  async function pasteVerse() {
    try {
      const t = await navigator.clipboard.readText();
      setText(t);
    } catch {
      /* pengguna dapat menempel secara manual */
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
              {id.modalVerseTitle}
            </h2>
            <p className="mt-0.5 text-[13px] text-[var(--vq-muted)]">
              {id.modalVerseSubtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-[var(--vq-bg-2)] text-[var(--vq-muted)]"
            aria-label={id.modalClose}
          >
            ✕
          </button>
        </div>
        <div className="max-h-[min(70vh,520px)] overflow-y-auto px-5 pt-4">
          <label className="mb-3 block">
            <span className="mb-1.5 block text-[13px] font-medium text-[var(--vq-muted)]">
              {id.labelBook}
            </span>
            <select
              className="vq-select w-full rounded-[var(--vq-radius-md)] border border-[var(--vq-border-2)] bg-[var(--vq-bg-2)] px-3.5 py-3 text-[15px] text-[var(--vq-text)]"
              value={book}
              onChange={(e) => {
                setBook(e.target.value);
                setChapter("");
                setVerse("");
              }}
            >
              <option value="">{id.bookPlaceholder}</option>
              <optgroup label={id.ot}>
                {BIBLE_BOOKS.oldTestament.map((b) => (
                  <option key={b.name} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label={id.nt}>
                {BIBLE_BOOKS.newTestament.map((b) => (
                  <option key={b.name} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </label>

          <div className="mb-3.5 flex gap-2.5">
            <label className="flex-1">
              <span className="mb-1.5 block text-[13px] font-medium text-[var(--vq-muted)]">
                {id.labelChapter}
              </span>
              <select
                className="vq-select min-h-[48px] w-full rounded-[var(--vq-radius-md)] border border-[var(--vq-border-2)] bg-[var(--vq-bg-2)] px-3.5 py-3 text-[15px] text-[var(--vq-text)] disabled:opacity-50"
                disabled={!book}
                value={chapter}
                onChange={(e) => {
                  setChapter(e.target.value);
                  setVerse("");
                }}
              >
                <option value="">{id.dash}</option>
                {book &&
                  Array.from({ length: chapterCount }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
              </select>
            </label>
            <label className="flex-1">
              <span className="mb-1.5 block text-[13px] font-medium text-[var(--vq-muted)]">
                {id.labelVerse}
              </span>
              <select
                className="vq-select min-h-[48px] w-full rounded-[var(--vq-radius-md)] border border-[var(--vq-border-2)] bg-[var(--vq-bg-2)] px-3.5 py-3 text-[15px] text-[var(--vq-text)] disabled:opacity-50"
                disabled={!chapter}
                value={verse}
                onChange={(e) => setVerse(e.target.value)}
              >
                <option value="">{id.dash}</option>
                {chapter &&
                  Array.from({ length: verseCount }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
              </select>
            </label>
          </div>

          <span className="mb-1.5 block text-[13px] font-medium text-[var(--vq-muted)]">
            {id.labelVerseText}
          </span>
          <textarea
            className="mb-3 min-h-[120px] w-full resize-none rounded-[var(--vq-radius-md)] border border-[var(--vq-border-2)] bg-[var(--vq-bg-2)] px-3.5 py-3 pb-3 text-[14px] leading-relaxed text-[var(--vq-text)]"
            placeholder={id.versePlaceholder}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button
            type="button"
            onClick={pasteVerse}
            className="touch-manipulation mb-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[var(--vq-radius-md)] border border-[#AFA9EC] bg-[#EEEDFE] px-4 py-3 text-[14px] font-semibold text-[#534AB7] active:bg-[#ddd8fc]"
          >
            {id.paste}
          </button>

          <button
            type="button"
            disabled={!canSubmit}
            onClick={handleSubmit}
            className="flex w-full min-h-[52px] items-center justify-center gap-2 rounded-[14px] bg-[#534AB7] py-[15px] text-base font-medium text-white transition hover:bg-[#3C3489] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[var(--vq-bg-2)] disabled:text-[var(--vq-muted-2)]"
          >
            <span>🔥</span> {id.submitVerse}
          </button>
        </div>
      </div>
    </div>
  );
}
