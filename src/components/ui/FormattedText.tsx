"use client";

import React from "react";

export function formatBidiText(text: string) {
  if (!text) return text;
  const parts = text.split(/(\b11Players\b|\b[A-Z]{2,5}\b|\([A-Z0-9\s_]{2,15}\))/g);
  return parts.map((part, idx) => {
    if (part === "11Players" || /^[A-Z]{2,5}$/.test(part) || (part.startsWith("(") && part.endsWith(")"))) {
      return (
        <span key={idx} className="inline-block [unicode-bidi:isolate] text-emerald-300 font-black px-0.5" dir="ltr">
          {part}
        </span>
      );
    }
    return part;
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

        // Split by markdown bold **text** first
        const parts = cleanText.split(/(\*\*.*?\*\*)/g);
        const formattedLine = parts.map((part, pIdx) => {
          if (part && part.startsWith("**") && part.endsWith("**")) {
            const rawInner = part.slice(2, -2);
            return (
              <strong key={pIdx} className="font-black text-emerald-300 inline-block [unicode-bidi:isolate]">
                {formatBidiText(rawInner)}
              </strong>
            );
          }
          return formatBidiText(part);
        });

        if (isBullet) {
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-1 rtl:pl-0 rtl:pr-1 [unicode-bidi:isolate]" dir="auto">
              <span className="text-emerald-400 font-bold shrink-0">•</span>
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
