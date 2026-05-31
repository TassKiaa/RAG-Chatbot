"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, FileText, Trash2, Loader2, FileCheck, AlertCircle, Image } from "lucide-react";
import { useDocuments } from "../hooks/useDocuments";

// FIX: Expanded file selection filter to allow images cleanly
const ACCEPTED = ".txt,.pdf,.docx,.md,.png,.jpg,.jpeg";

function DocItem({ doc, onRemove }) {
  // Utility tracker to see if the uploaded item is an image file
  const isImage = /\.(png|jpg|jpeg)$/i.test(doc.name);

  return (
    <div
      className="flex items-start gap-2.5 p-3 rounded-xl group transition-colors"
      style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-subtle)" }}
    >
      <div
        className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center"
        style={{ background: "var(--accent-subtle)", color: "var(--accent-text)" }}
      >
        {/* FIX: If the document is an image, display an Image icon instead of FileCheck */}
        {isImage ? <Image size={15} /> : <FileCheck size={15} />}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="text-xs font-medium truncate"
          style={{ color: "var(--text-primary)" }}
        >
          {doc.name}
        </p>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
          {doc.chunks} chunks · {doc.uploadedAt}
        </p>
      </div>
      <button
        onClick={() => onRemove(doc)}
        className="opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity"
        style={{ color: "var(--text-muted)" }}
        title="Remove"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

export default function Sidebar({ documents, onAdd, onRemove }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const fileInputRef = useRef(null);

  const handleFiles = useCallback(
    async (files) => {
      const file = files[0];
      if (!file) return;
      setUploading(true);
      setFeedback(null);
      const result = await onAdd(file);
      setUploading(false);
      if (result?.success) {
        setFeedback({ ok: true, msg: `"${file.name}" indexed successfully.` });
      } else {
        setFeedback({ ok: false, msg: result?.error || "Upload failed." });
      }
      setTimeout(() => setFeedback(null), 4000);
    },
    [onAdd]
  );

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <aside
      className="h-full flex flex-col p-4 gap-4 overflow-y-auto w-72"
      style={{ background: "var(--sidebar-bg)" }}
    >
      {/* Header */}
      <div>
        <h2
          className="text-sm font-bold tracking-tight"
          style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
        >
          Knowledge Base
        </h2>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
          Upload documents or images to enable retrieval
        </p>
      </div>

      {/* Drop zone */}
      <div
        className={`drop-zone flex flex-col items-center justify-center gap-2 p-6 cursor-pointer ${dragging ? "active" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {uploading ? (
          <Loader2 size={22} className="animate-spin" style={{ color: "var(--accent)" }} />
        ) : (
          <Upload size={22} style={{ color: "var(--text-muted)" }} />
        )}
        <p className="text-xs text-center" style={{ color: "var(--text-secondary)" }}>
          {uploading ? "Indexing…" : "Drop a file or click to upload"}
        </p>
        {/* FIX: Visually updated layout strings to confirm image file formats are accepted */}
        <p className="text-[10px] tracking-wide uppercase font-semibold opacity-60 text-center" style={{ color: "var(--text-muted)" }}>
          PDF · DOCX · TXT · MD · PNG · JPG
        </p>
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          className="flex items-start gap-2 p-3 rounded-xl text-xs animate-fade-in"
          style={{
            background: feedback.ok ? "var(--accent-subtle)" : "#fee2e2",
            color: feedback.ok ? "var(--accent-text)" : "#b91c1c",
            border: `1px solid ${feedback.ok ? "var(--accent)" : "#f87171"}`,
          }}
        >
          {feedback.ok ? <FileCheck size={13} /> : <AlertCircle size={13} />}
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* Document list */}
      {documents.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
            INDEXED DOCUMENTS ({documents.length})
          </p>
          {documents.map((doc) => (
            <DocItem key={doc.id} doc={doc} onRemove={onRemove} />
          ))}
        </div>
      )}

      {documents.length === 0 && !uploading && (
        <div className="flex flex-col items-center gap-2 py-6">
          <FileText size={32} style={{ color: "var(--border)" }} />
          <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
            No files yet. Upload items to start retrieval-augmented chat.
          </p>
        </div>
      )}
    </aside>
  );
}