"use client";

import { useState, useCallback } from "react";

export function useChat(activeChatId = null) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim()) return;

    const userMessage = { role: "user", content: text, id: Date.now() };
    
    // 1. Add user message right away
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Placeholder for AI response
    const aiId = Date.now() + 1;
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "", id: aiId, sources: [], streaming: true },
    ]);

    try {
      // 2. Fetch inside a functional tracking block to avoid closed closures
      let currentHistory = [];
      setMessages((prev) => {
        currentHistory = prev.filter(m => m.id !== aiId);
        return prev;
      });

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: text,
          chatId: activeChatId,
          messages: [...currentHistory].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) throw new Error("Request failed");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let sources = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop(); // Keep incomplete line

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);

            if (parsed.type === "sources") {
              sources = parsed.sources || [];
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiId ? { ...m, sources } : m
                )
              );
            } else if (parsed.type === "text") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiId
                    ? { ...m, content: m.content + parsed.text }
                    : m
                )
              );
            } else if (parsed.type === "done") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiId ? { ...m, streaming: false } : m
                )
              );
            } else if (parsed.type === "error") {
              throw new Error(parsed.error);
            }
          } catch (e) {
            // Skip malformed lines safely
          }
        }
      }
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiId
            ? {
                ...m,
                content: `Sorry, something went wrong: ${err.message}`,
                streaming: false,
                error: true,
              }
            : m
        )
      );
    } finally {
      setIsLoading(false);
      setMessages((prev) =>
        prev.map((m) => (m.streaming ? { ...m, streaming: false } : m))
      );
    }
  }, [activeChatId]); // FIX: Removed messages and isLoading! Callback is now stable.

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return { messages, isLoading, sendMessage, clearMessages, setMessages };
}