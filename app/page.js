"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClientComponentClient } from "../lib/supabaseClient"; 
// Components
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import ChatInput from "../components/ChatInput";

// Hooks
import { useChat } from "../hooks/useChat";
import { useDocuments } from "../hooks/useDocuments";

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();
  
  // Tracking historical threads from Supabase
  const [historicChats, setHistoricChats] = useState([]);
  const [user, setUser] = useState(null);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { documents, addDocument, removeDocument } = useDocuments();
  
  // Detect if an active chat thread is selected via URL query parameters (?id=...)
  const activeChatId = searchParams.get("id") || null;

  // Pass activeChatId down into your useChat hook so it knows whether to append or insert
  const { messages, isLoading, sendMessage, clearMessages, setMessages } = useChat(activeChatId);

  // 1. Enforce Authentication and Fetch Saved Chats
  useEffect(() => {
    const checkAuthAndFetchChats = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        router.push("/login");
        return;
      }
      setUser(currentUser);

      // Pull historic threads from PostgreSQL database
      const { data: chats, error } = await supabase
        .from("chats")
        .select("id, title, messages, created_at")
        .order("created_at", { ascending: false });

      if (!error && chats) {
        setHistoricChats(chats);
        
        // If an active thread ID exists in URL, seed the window state with those messages
        if (activeChatId) {
          const selectedChat = chats.find((c) => c.id === activeChatId);
          if (selectedChat) {
            setMessages(selectedChat.messages);
          }
        }
      }
    };

    checkAuthAndFetchChats();
  }, [activeChatId, router, supabase, setMessages]);

  // 2. Handle Signing Out cleanly
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ background: "var(--bg-primary)" }}
    >
      <Navbar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        onClearChat={clearMessages}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Panel with Document Management AND Chat History */}
        <div
          className={`
            flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden flex flex-col justify-between
            ${sidebarOpen ? "w-72" : "w-0"}
          `}
          style={{ borderRight: sidebarOpen ? "1px solid var(--border)" : "none", background: "var(--bg-secondary)" }}
        >
          {sidebarOpen && (
            <div className="flex flex-col h-full justify-between p-4 space-y-6 overflow-hidden">
              <div className="flex flex-col flex-1 space-y-4 overflow-hidden">
                {/* Document Upload Area */}
                <Sidebar documents={documents} onAdd={addDocument} onRemove={removeDocument} />
                
                {/* Saved Chat History Section */}
                <div className="flex flex-col flex-1 border-t border-slate-800 pt-4 overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-slate-400">Saved Conversations</h3>
                    <button 
                      onClick={() => { router.push("/"); clearMessages(); }}
                      className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-2 py-0.5 rounded transition"
                    >
                      + New
                    </button>
                  </div>
                  
                  <div className="space-y-1 overflow-y-auto flex-1 pr-1">
                    {historicChats.map((chat) => (
                      <button
                        key={chat.id}
                        onClick={() => router.push(`/?id=${chat.id}`)}
                        className={`w-full text-left p-2 rounded text-xs truncate block transition ${
                          activeChatId === chat.id 
                            ? "bg-slate-800 text-white font-medium" 
                            : "hover:bg-slate-800/40 text-slate-400"
                        }`}
                      >
                        {chat.title}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Logged-in User Profile Status Bar */}
              {user && (
                <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-xs text-slate-400">
                  <span className="truncate max-w-[140px]">{user.email}</span>
                  <button onClick={handleSignOut} className="text-red-400 hover:underline">
                    Log Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Chat area */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <ChatWindow messages={messages} isLoading={isLoading} />
          <ChatInput
            onSend={(text) => sendMessage(text)}
            isLoading={isLoading}
            hasDocuments={documents.length > 0}
          />
        </div>
      </div>
    </div>
  );
}