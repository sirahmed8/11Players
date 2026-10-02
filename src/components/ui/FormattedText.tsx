"use client";

import React from "react";

export function formatBidiText(text: string): React.ReactNode {
  if (!text) return text;
  const parts = text.split(/(\b11Players\b|\b[A-Z]{2,5}\b|\([A-Z0-9\s_]{2,15}\))/g);
  return parts.map((part, idx) => {
    if (part === "11Players" || /^[A-Z]{2,5}$/.test(part) || (part.startsWith("(") && part.endsWith(")"))) {
      return (
        <span key={idx} className="inline-block [unicode-bidi:isolate] text-emerald-600 dark:text-emerald-300 font-bold px-0.5" dir="ltr">
          {part}
        </span>
      );
    }
    return part;
  });
}

function parseInlineTokens(text: string): React.ReactNode[] {
  if (!text) return [];

  // Match:
  // 1. ***bold italic***
  // 2. **bold** or __bold__
  // 3. `code`
  // 4. *italic* or _italic_
  const tokenRegex = /(\*\*\*[\s\S]+?\*\*\*|\*\*[\s\S]+?\*\*|__[\s\S]+?__|`[\s\S]+?`|\*[\s\S]+?\*|_[\s\S]+?_)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, pIdx) => {
    if (!part) return null;

    if (part.startsWith("***") && part.endsWith("***") && part.length > 6) {
      const inner = part.slice(3, -3);
      return (
        <strong key={pIdx} className="font-extrabold text-emerald-600 dark:text-emerald-300 inline-block [unicode-bidi:isolate]">
          <em className="italic">{formatBidiText(inner)}</em>
        </strong>
      );
    }

    if (
      (part.startsWith("**") && part.endsWith("**") && part.length > 4) ||
      (part.startsWith("__") && part.endsWith("__") && part.length > 4)
    ) {
      const inner = part.slice(2, -2);
      return (
        <strong key={pIdx} className="font-extrabold text-emerald-600 dark:text-emerald-300 inline-block [unicode-bidi:isolate]">
          {formatBidiText(inner)}
        </strong>
      );
    }

    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      const inner = part.slice(1, -1);
      return (
        <code
          key={pIdx}
          className="px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-semibold inline-block [unicode-bidi:isolate]"
        >
          {inner}
        </code>
      );
    }

    if (
      (part.startsWith("*") && part.endsWith("*") && part.length > 2) ||
      (part.startsWith("_") && part.endsWith("_") && part.length > 2)
    ) {
      const inner = part.slice(1, -1);
      return (
        <em key={pIdx} className="italic text-slate-700 dark:text-slate-200 inline-block [unicode-bidi:isolate]">
          {formatBidiText(inner)}
        </em>
      );
    }

    // Clean any stray formatting asterisks so raw symbols never leak into the rendered DOM
    const sanitized = part.replace(/\*\*/g, "");
    return formatBidiText(sanitized);
  });
}

export default function FormattedText({ content }: { content: string }) {
  if (!content || typeof content !== "string") return null;
  const lines = content.split("\n");
  return (
    <div className="space-y-1.5 font-medium leading-relaxed [unicode-bidi:isolate] text-start" dir="auto">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        const isBullet = trimmed.startsWith("- ") || trimmed.startsWith("• ") || trimmed.startsWith("* ");
        const cleanText = isBullet ? trimmed.replace(/^[-•*]\s*/, "") : trimmed;

        const formattedLine = parseInlineTokens(cleanText);

        if (isBullet) {
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-1 rtl:pl-0 rtl:pr-1 [unicode-bidi:isolate]" dir="auto">
              <span className="text-emerald-500 dark:text-emerald-400 font-bold shrink-0">•</span>
              <span className="[unicode-bidi:isolate] flex-1">{formattedLine}</span>
            </div>
          );
        }

        return (
          <p key={idx} className="[unicode-bidi:isolate]" dir="auto">
            {formattedLine}
          </p>
        );
      })}
    </div>
  );
}
