"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, User } from "lucide-react";
import SourceCard from "./SourceCard";

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-1">
      <div className="w-1.5 h-1.5 rounded-full bg-current opacity-40 animate-bounce [animation-delay:-0.3s]" />
      <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60 animate-bounce [animation-delay:-0.15s]" />
      <div className="w-1.5 h-1.5 rounded-full bg-current opacity-80 animate-bounce" />
    </div>
  );
}

export default function Message({ message }) {
  const isUser = message.role === "user";
  
  // FIX: Clearer checking parameters ensuring empty tokens don't choke the layout
  const hasContent = message.content && message.content.trim() !== "";
  const showTyping = message.streaming && !hasContent;

  return (
    <div
      className={`flex gap-3 w-full mb-4 animate-slide-up ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-sm transition-all"
        style={{
          background: isUser ? "var(--accent)" : "var(--bg-tertiary)",
          color: isUser ? "#fff" : "var(--text-secondary)",
          border: isUser ? "none" : "1px solid var(--border)",
          alignSelf: "flex-start",
        }}
      >
        {isUser ? <User size={15} /> : <Bot size={15} />}
      </div>

      {/* Bubble Wrapper */}
      <div className={`flex flex-col gap-1.5 max-w-[75%] ${isUser ? "items-end" : "items-start"}`}>
        <div
          className="px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed break-words whitespace-pre-wrap min-w-[40px]"
          style={
            isUser
              ? {
                  background: "var(--user-bubble)",
                  color: "var(--user-bubble-text)",
                  borderBottomRightRadius: "4px",
                }
              : {
                  background: "var(--ai-bubble)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--ai-bubble-border)",
                  borderBottomLeftRadius: "4px",
                  boxShadow: "var(--shadow-sm)",
                }
          }
        >
          {showTyping ? (
            <TypingIndicator />
          ) : isUser ? (
            <span className="block break-words">{message.content}</span>
          ) : (
            // FIX: Guard block layout with string validation to prevent markdown collapse
            <div className="prose-chat break-words w-full">
              {hasContent ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </ReactMarkdown>
              ) : (
                <span className="opacity-40 italic">No viewable response text</span>
              )}
              
              {message.streaming && (
                <span 
                  className="inline-block w-1.5 h-3.5 ml-1 rounded-sm animate-pulse align-middle" 
                  style={{ background: "var(--accent)" }} 
                />
              )}
            </div>
          )}
        </div>

        {/* Sources (AI only) */}
        {!isUser && !message.streaming && message.sources && message.sources.length > 0 && (
          <div className="w-full mt-1 animate-fade-in">
            <SourceCard sources={message.sources} />
          </div>
        )}

        {/* Error Flag Alert */}
        {message.error && (
          <p className="text-[11px] px-1 font-medium mt-0.5" style={{ color: "#ef4444" }}>
            {message.content || "An error occurred. Please try again."}
          </p>
        )}
      </div>
    </div>
  );
}