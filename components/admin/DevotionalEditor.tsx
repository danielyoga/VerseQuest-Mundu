"use client";

import { useEffect, useRef, useState } from "react";
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND, ListItemNode, ListNode } from "@lexical/list";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { $wrapNodes } from "@lexical/selection";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  $createTextNode,
  $isElementNode,
  $isDecoratorNode,
  $isTextNode,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_LOW,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  UNDO_COMMAND,
  type LexicalEditor,
} from "lexical";
import { useLocale } from "@/contexts/LocaleContext";
import { messages } from "@/lib/i18n";

const MAX_CHARS = 5000;

function Toolbar() {
  const [editor] = useLexicalComposerContext();
  const { locale } = useLocale();
  const m = messages[locale];
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  useEffect(() => {
    const unregisterUndo = editor.registerCommand(
      CAN_UNDO_COMMAND,
      (payload) => {
        setCanUndo(payload);
        return false;
      },
      COMMAND_PRIORITY_LOW
    );
    const unregisterRedo = editor.registerCommand(
      CAN_REDO_COMMAND,
      (payload) => {
        setCanRedo(payload);
        return false;
      },
      COMMAND_PRIORITY_LOW
    );
    return () => {
      unregisterUndo();
      unregisterRedo();
    };
  }, [editor]);

  const applyHeading = (tag: "h2" | "h3" | "paragraph") => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      if (tag === "paragraph") {
        $wrapNodes(selection, () => $createParagraphNode());
      } else {
        $wrapNodes(selection, () => new HeadingNode(tag));
      }
    });
  };

  const applyQuote = () => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      $wrapNodes(selection, () => new QuoteNode());
    });
  };

  const btnClass =
    "flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-[13px] font-medium text-[var(--vq-muted)] hover:bg-[var(--vq-bg-2)] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent";

  return (
    <div className="mb-2 flex flex-wrap items-center gap-1 border-b border-[var(--vq-border-2)] pb-2">
      <button
        type="button"
        className={btnClass}
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
        disabled={!canUndo}
        aria-label={m.editorUndoAria}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
          <path d="M4 3.5 1.5 6 4 8.5M1.5 6h6.5a4 4 0 1 1 0 8H6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button
        type="button"
        className={btnClass}
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
        disabled={!canRedo}
        aria-label={m.editorRedoAria}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
          <path d="M10 3.5 12.5 6 10 8.5M12.5 6H6a4 4 0 1 0 0 8h1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div className="mx-1 h-5 w-px bg-[var(--vq-border-2)]" aria-hidden />
      <button type="button" className={btnClass} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")} aria-label={m.editorBoldAria}>
        <strong>B</strong>
      </button>
      <button type="button" className={btnClass} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")} aria-label={m.editorItalicAria}>
        <em>I</em>
      </button>
      <button type="button" className={btnClass} onClick={() => applyHeading("h2")} aria-label={m.editorH2Aria}>
        H2
      </button>
      <button type="button" className={btnClass} onClick={() => applyHeading("h3")} aria-label={m.editorH3Aria}>
        H3
      </button>
      <button type="button" className={btnClass} onClick={() => applyHeading("paragraph")} aria-label={m.editorParagraphAria}>
        P
      </button>
      <button
        type="button"
        className={btnClass}
        onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)}
        aria-label={m.editorBulletListAria}
      >
        •—
      </button>
      <button
        type="button"
        className={btnClass}
        onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)}
        aria-label={m.editorNumberedListAria}
      >
        1.
      </button>
      <button type="button" className={btnClass} onClick={applyQuote} aria-label={m.editorQuoteAria}>
        &ldquo;&rdquo;
      </button>
    </div>
  );
}

/** Trims the root back down to MAX_CHARS whenever an edit pushes it over —
 * mirrors a plain <textarea maxLength> since Lexical has no built-in cap. */
function CharacterLimitPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      const overflow = editorState.read(() => $getRoot().getTextContent().length - MAX_CHARS);
      if (overflow <= 0) return;
      editor.update(() => {
        let remaining = overflow;
        const textNodes = $getRoot().getAllTextNodes();
        for (let i = textNodes.length - 1; i >= 0 && remaining > 0; i--) {
          const node = textNodes[i];
          if (!$isTextNode(node)) continue;
          const text = node.getTextContent();
          if (text.length <= remaining) {
            remaining -= text.length;
            node.remove();
          } else {
            node.setTextContent(text.slice(0, text.length - remaining));
            remaining = 0;
          }
        }
      });
    });
  }, [editor]);

  return null;
}

function InitialHtmlPlugin({ html }: { html: string }) {
  const [editor] = useLexicalComposerContext();
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current || !html) return;
    // Don't clobber a draft the admin already started typing while this
    // (async, arrives-after-mount) content was still in flight.
    if (editor.getEditorState().read(() => $getRoot().getTextContent().length > 0)) {
      loaded.current = true;
      return;
    }
    loaded.current = true;
    editor.update(() => {
      const parser = new DOMParser();
      const dom = parser.parseFromString(html, "text/html");
      const nodes = $generateNodesFromDOM(editor, dom);
      const root = $getRoot();
      root.clear();

      // Legacy rows stored plain text (no tags), so $generateNodesFromDOM hands
      // back bare text nodes instead of paragraphs — wrap those into paragraphs,
      // splitting on blank lines the same way the old plain-text reader did.
      if (nodes.some((n) => !$isElementNode(n) && !$isDecoratorNode(n))) {
        const paragraphs = html.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
        (paragraphs.length ? paragraphs : [html]).forEach((text) => {
          root.append($createParagraphNode().append($createTextNode(text)));
        });
      } else {
        nodes.forEach((n) => root.append(n));
      }
    });
  }, [editor, html]);

  return null;
}

const theme = {
  heading: { h2: "vq-editor-h2", h3: "vq-editor-h3" },
  list: { ul: "vq-editor-ul", ol: "vq-editor-ol", listitem: "vq-editor-li" },
  quote: "vq-editor-quote",
  text: { bold: "font-semibold", italic: "italic" },
};

export default function DevotionalEditor({
  initialHtml,
  onChange,
  compact = false,
}: {
  initialHtml: string;
  onChange: (html: string, plainTextLen: number) => void;
  /** Force the mobile-sized writing surface, e.g. while previewing at mobile width. */
  compact?: boolean;
}) {
  const { locale } = useLocale();
  const m = messages[locale];

  const initialConfig = {
    namespace: "devotional-editor",
    theme,
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode],
    onError(error: Error) {
      throw error;
    },
  };

  const handleChange = (_editorState: unknown, editor: LexicalEditor) => {
    editor.getEditorState().read(() => {
      const html = $generateHtmlFromNodes(editor, null);
      const len = $getRoot().getTextContent().length;
      onChange(html, len);
    });
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="w-full rounded-[var(--vq-radius-md)] border border-[var(--vq-border-2)] bg-[var(--vq-bg-2)] p-3.5">
        <Toolbar />
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              className={`min-h-[160px] w-full resize-none text-base text-[var(--vq-text)] focus:outline-none ${compact ? "" : "md:min-h-[320px] lg:min-h-[420px]"} [&_h2]:text-xl [&_h2]:font-bold [&_h3]:text-lg [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-2 [&_blockquote]:border-[var(--vq-border-2)] [&_blockquote]:pl-3 [&_blockquote]:italic`}
              aria-placeholder={m.editorPlaceholder}
              placeholder={<div className="pointer-events-none -mt-6 text-[var(--vq-muted-2)]">{m.editorPlaceholder}</div>}
            />
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <ListPlugin />
        <InitialHtmlPlugin html={initialHtml} />
        <CharacterLimitPlugin />
        <OnChangePlugin onChange={handleChange} />
      </div>
    </LexicalComposer>
  );
}
