"use client";

import { useState, useCallback } from "react";

export function useDocuments() {
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);

  const addDocument = useCallback(async (file) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Upload failed");

      setDocuments((prev) => [
        ...prev,
        {
          id: Date.now(),
          name: data.fileName,
          chunks: data.chunks,
          preview: data.preview,
          uploadedAt: new Date().toLocaleTimeString(),
        },
      ]);

      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setUploading(false);
    }
  }, []);

  const removeDocument = useCallback(async (doc) => {
    await fetch(`/api/upload?source=${encodeURIComponent(doc.name)}`, {
      method: "DELETE",
    });
    setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
  }, []);

  return { documents, uploading, addDocument, removeDocument };
}
