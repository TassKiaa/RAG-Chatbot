"use client";

import { Bot, PanelLeft, Trash2 } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

export default function Navbar({ sidebarOpen, onToggleSidebar, onClearChat }) {
  return (
    <nav
      className="flex items-center justify-between px-4 h-14 flex-shrink-0 backdrop-blur-md z-10"
      style={{
        background: "var(--navbar-bg)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: "var(--text-secondary)" }}
          title="Toggle sidebar"
        >
          <PanelLeft size={18} />
        </button>

        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            <Bot size={15} />
          </div>
          <span
            className="text-sm font-semibold tracking-tight"
            style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
          >
            RAG Chatbot
          </span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <button
          onClick={onClearChat}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
          style={{
            color: "var(--text-secondary)",
            border: "1px solid var(--border)",
            background: "var(--bg-secondary)",
          }}
          title="Clear chat"
        >
          <Trash2 size={13} />
          Clear
        </button>
        <ThemeToggle />
      </div>
    </nav>
  );
}
