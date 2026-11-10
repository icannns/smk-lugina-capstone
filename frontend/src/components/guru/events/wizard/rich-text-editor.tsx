"use client";

import { useEffect, useRef, useState } from "react";

function editorHref(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.href
      : null;
  } catch {
    return null;
  }
}

// Only this small formatting vocabulary can be restored/rendered. No stored
// HTML attributes, scripts, images, styles or event handlers are trusted.
export function cleanEditorHtml(html: string) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const allowed = new Set([
    "B",
    "STRONG",
    "I",
    "EM",
    "UL",
    "OL",
    "LI",
    "P",
    "BR",
    "DIV",
    "A",
  ]);
  function clean(node: Node): Node {
    if (node.nodeType === Node.TEXT_NODE)
      return document.createTextNode(node.textContent ?? "");
    const fragment = document.createDocumentFragment();
    if (!(node instanceof Element)) return fragment;
    if (["SCRIPT", "STYLE", "IFRAME", "OBJECT"].includes(node.tagName))
      return fragment;
    const children = [...node.childNodes].map(clean);
    if (!allowed.has(node.tagName)) {
      fragment.append(...children);
      return fragment;
    }
    const result = document.createElement(node.tagName.toLowerCase());
    if (node.tagName === "A") {
      const href = node.getAttribute("href") ?? "";
      const safeHref = editorHref(href);
      if (safeHref) {
        result.setAttribute("href", safeHref);
        result.setAttribute("rel", "noopener noreferrer");
      }
    }
    result.append(...children);
    return result;
  }
  const root = document.createElement("div");
  root.append(...[...doc.body.childNodes].map(clean));
  return root.innerHTML;
}

export function RichTextEditor({
  id,
  label,
  value,
  onChange,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (html: string) => void;
  error?: string;
}) {
  const editor = useRef<HTMLDivElement>(null);
  const initial = useRef(value);
  const selection = useRef<Range | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (editor.current)
      editor.current.innerHTML = cleanEditorHtml(initial.current);
  }, []);
  function publish() {
    if (editor.current) onChange(cleanEditorHtml(editor.current.innerHTML));
  }
  function command(name: string, argument?: string) {
    editor.current?.focus();
    document.execCommand(name, false, argument);
    publish();
  }
  return (
    <div
      className="overflow-hidden rounded-control border border-line"
      data-invalid={!!error}
    >
      <div
        role="toolbar"
        aria-label={`Format ${label}`}
        className="flex min-h-10 flex-wrap items-start gap-1 border-b border-line bg-gray-50 px-2 py-1.5 text-xs leading-4 text-secondary"
      >
        {[
          ["B", "Tebal", "bold"],
          ["I", "Miring", "italic"],
          ["• List", "Daftar berpoin", "insertUnorderedList"],
          ["1. List", "Daftar bernomor", "insertOrderedList"],
        ].map(([text, title, action]) => (
          <button
            key={action}
            type="button"
            aria-label={title}
            title={title}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => command(action)}
            className={`h-7 rounded-md px-2 hover:bg-gray-200 ${action === "bold" ? "font-bold" : action === "italic" ? "italic" : ""}`}
          >
            {text}
          </button>
        ))}
        <button
          type="button"
          aria-expanded={linkOpen}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            const s = window.getSelection();
            selection.current =
              s?.rangeCount && editor.current?.contains(s.anchorNode)
                ? s.getRangeAt(0).cloneRange()
                : null;
            setLinkOpen((v) => !v);
          }}
          className="h-7 rounded-md px-2 hover:bg-gray-200"
        >
          Tautan
        </button>
      </div>
      {linkOpen && (
        <div className="flex flex-wrap items-end gap-2 border-b border-line bg-white p-3">
          <label className="min-w-0 flex-1 text-xs">
            URL tautan (http/https)
            <input
              type="url"
              aria-label={`URL tautan ${label}`}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="mt-1 h-9 w-full min-w-0 rounded-lg border border-line px-2 text-sm"
            />
          </label>
          <button
            type="button"
            disabled={!editorHref(url)}
            onClick={() => {
              const href = editorHref(url);
              if (!href || !editor.current) return;
              editor.current?.focus();
              const range = selection.current ?? document.createRange();
              if (!selection.current) {
                range.selectNodeContents(editor.current);
                range.collapse(false);
              }
              const s = window.getSelection();
              s?.removeAllRanges();
              s?.addRange(range);
              if (range.collapsed) {
                const link = document.createElement("a");
                link.href = href;
                link.textContent = href;
                link.rel = "noopener noreferrer";
                command("insertHTML", link.outerHTML);
              } else command("createLink", href);
              setLinkOpen(false);
              setUrl("");
            }}
            className="h-9 rounded-lg bg-primary px-3 text-xs font-medium text-white disabled:opacity-40"
          >
            Sisipkan
          </button>
          <button
            type="button"
            onClick={() => setLinkOpen(false)}
            className="h-9 px-2 text-xs text-secondary"
          >
            Batal
          </button>
        </div>
      )}
      <div
        ref={editor}
        id={id}
        role="textbox"
        aria-label={label}
        aria-multiline="true"
        aria-required={label === "Studi Kasus & Tujuan"}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        contentEditable
        suppressContentEditableWarning
        onInput={publish}
        onPaste={(e) => {
          e.preventDefault();
          command("insertText", e.clipboardData.getData("text/plain"));
        }}
        onDrop={(e) => e.preventDefault()}
        className="min-h-[116px] [overflow-wrap:anywhere] px-3 py-2.5 text-sm leading-5 outline-primary focus:outline-2 [&_a]:text-primary [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
      />
    </div>
  );
}
