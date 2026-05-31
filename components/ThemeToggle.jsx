"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
      style={{
        background: "var(--bg-tertiary)",
        color: "var(--text-secondary)",
        border: "1px solid var(--border)",
      }}
      title={theme === "dark" ? "Switch to light" : "Switch to dark"}
    >
      {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
}
