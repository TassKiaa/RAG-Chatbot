"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Database } from "lucide-react";

export default function ChatInput({ onSend, isLoading, hasDocuments }) {
  const [value, setValue] = useState("");
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 180) + "px";
  }, [value]);

  const handleSubmit = () => {
    if (!value.trim() || isLoading) return;
    onSend(value.trim());
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      className="flex-shrink-0 px-4 py-3"
      style={{ borderTop: "1px solid var(--border)", background: "var(--bg-primary)" }}
    >
      <div className="max-w-3xl mx-auto">
        <div
          className="flex items-end gap-2 rounded-2xl px-4 py-3 transition-shadow"
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          {/* RAG indicator */}
          {hasDocuments && (
            <div
              className="mb-1 flex-shrink-0"
              title="Retrieval enabled"
              style={{ color: "var(--accent)" }}
            >
              <Database size={15} />
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKey}
            placeholder={
              hasDocuments
                ? "Ask about your documents…"
                : "Send a message… (Shift+Enter for newline)"
            }
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm outline-none leading-relaxed"
            style={{
              color: "var(--text-primary)",
              maxHeight: "180px",
              fontFamily: "var(--font-body)",
            }}
            disabled={isLoading}
          />

          <button
            onClick={handleSubmit}
            disabled={!value.trim() || isLoading}
            className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all"
            style={{
              background: value.trim() && !isLoading ? "var(--accent)" : "var(--bg-tertiary)",
              color: value.trim() && !isLoading ? "#fff" : "var(--text-muted)",
              cursor: value.trim() && !isLoading ? "pointer" : "not-allowed",
            }}
          >
            {isLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Send size={14} />
            )}
          </button>
        </div>

        <p className="text-center text-xs mt-2" style={{ color: "var(--text-muted)" }}>
          {hasDocuments
            ? "Retrieval-augmented mode active"
            : "No documents — chatting with Claude directly"}
        </p>
      </div>
    </div>
  );
}
