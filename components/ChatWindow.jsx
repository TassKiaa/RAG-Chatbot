"use client";

import { useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
import Message from "./Message";

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{ background: "var(--accent-subtle)" }}
      >
        <Sparkles size={24} style={{ color: "var(--accent)" }} />
      </div>
      <div>
        <h3
          className="text-lg font-bold mb-1"
          style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
        >
          Start a conversation
        </h3>
        <p className="text-sm max-w-sm" style={{ color: "var(--text-secondary)" }}>
          Upload documents in the sidebar to enable retrieval‑augmented answers, or just chat with Claude directly.
        </p>
      </div>
      <div className="flex flex-wrap gap-2 justify-center mt-2">
        {[
          "Summarize my documents",
          "What is this document about?",
          "Find key insights",
          "Compare sections",
        ].map((hint) => (
          <span
            key={hint}
            className="text-xs px-3 py-1.5 rounded-full"
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
            }}
          >
            {hint}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function ChatWindow({ messages, isLoading }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto">
      {messages.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-5">
          {messages.map((msg) => (
            <Message key={msg.id} message={msg} />
          ))}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}
