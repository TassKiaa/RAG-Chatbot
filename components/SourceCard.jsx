"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, FileSearch } from "lucide-react";

function ScoreBadge({ score }) {
  const pct = Math.round(score * 100);
  const color = score > 0.5 ? "#16a34a" : score > 0.25 ? "#d97706" : "#6b7280";
  return (
    <span
      className="text-xs px-1.5 py-0.5 rounded-full font-medium"
      style={{ background: `${color}18`, color }}
    >
      {pct}%
    </span>
  );
}

export default function SourceCard({ sources }) {
  const [expanded, setExpanded] = useState(false);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-2 animate-fade-in">
      <button
        className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors"
        style={{
          color: "var(--accent-text)",
          background: "var(--accent-subtle)",
          border: "1px solid var(--accent)",
        }}
        onClick={() => setExpanded((v) => !v)}
      >
        <FileSearch size={12} />
        {sources.length} source{sources.length > 1 ? "s" : ""} retrieved
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {expanded && (
        <div className="mt-2 flex flex-col gap-2">
          {sources.map((src, i) => (
            <div
              key={i}
              className="rounded-xl p-3 text-xs animate-slide-up"
              style={{
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border)",
              }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold truncate" style={{ color: "var(--text-secondary)" }}>
                  [{i + 1}] {src.source}
                </span>
                <ScoreBadge score={src.score} />
              </div>
              <p
                className="leading-relaxed line-clamp-4"
                style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}
              >
                {src.text}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
