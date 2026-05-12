"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Send, Bot, User, Sparkles, Database, FileText } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import DocumentUploader from "@/components/DocumentUploader";

interface Source {
  docId: string;
  text: string;
  score: number;
}

export default function Home() {
  const pendingSourcesRef = useRef<Source[]>([]);
  const [messageSources, setMessageSources] = useState<Record<string, Source[]>>({});
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onFinish: ({ message }) => {
      console.log("onFinish fired", message);
      if (pendingSourcesRef.current.length > 0) {
        setMessageSources((prev) => ({
          ...prev,
          [message.id]: pendingSourcesRef.current,
        }));
        pendingSourcesRef.current = [];
      }
    },
  });

  const isLoading = status === "submitted" || status === "streaming";

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;

    const currentInput = input;
    setInput("");

    // Fetch sources in parallel before sending message
    try {
      const res = await fetch("/api/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: currentInput }),
      });
      console.log("[citations] /api/sources status:", res.status);
      const data = await res.json();
      console.log("[citations] /api/sources body:", data);
      pendingSourcesRef.current = data.sources ?? [];
    } catch (err) {
      console.log("[citations] /api/sources failed:", err);
      pendingSourcesRef.current = [];
    }
    console.log("[citations] pending after fetch:", pendingSourcesRef.current.length);

    sendMessage({ text: currentInput });
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Map sources to last assistant message when response completes
  useEffect(() => {
    const assistantMessages = messages.filter((m) => m.role === "assistant");
    if (assistantMessages.length === 0) return;

    const lastAssistant = assistantMessages[assistantMessages.length - 1];
      console.log("[citations] effect tick", {
      status,
      lastAssistantId: lastAssistant.id,
      pendingCount: pendingSourcesRef.current.length,
      alreadyMapped: !!messageSources[lastAssistant.id],
    });
    if (
      pendingSourcesRef.current.length > 0 &&
      !messageSources[lastAssistant.id] &&
      status === "ready"
    ) {
      setMessageSources((prev) => ({
        ...prev,
        [lastAssistant.id]: pendingSourcesRef.current,
      }));
      pendingSourcesRef.current = [];
    }
  }, [messages, status, messageSources]);

  return (
    <div className="flex h-screen w-full flex-col bg-neutral-950 text-neutral-50 font-sans selection:bg-indigo-500/30">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-neutral-800/50 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-lg tracking-tight">
              AI Knowledge Base
            </h1>
            <p className="text-xs text-neutral-400 hidden sm:block">
              Powered by Next.js, Vercel AI SDK & Gemini
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <DocumentUploader />
          <div className="hidden sm:flex items-center gap-2 text-sm text-neutral-400 bg-neutral-900/50 px-3 py-2 rounded-lg border border-neutral-800">
            <Database className="w-4 h-4 text-emerald-400" />
            <span>Pinecone</span>
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 w-full max-w-4xl mx-auto flex flex-col gap-6">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 opacity-0 animate-in fade-in duration-700 slide-in-from-bottom-4">
            <div className="w-20 h-20 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center shadow-2xl">
              <Sparkles className="w-10 h-10 text-indigo-400" />
            </div>
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
              How can I help you today?
            </h2>
            <p className="text-neutral-400 max-w-md">
              Ask me anything about your documents. I use RAG to fetch the most
              relevant context and generate accurate answers.
            </p>
          </div>
        ) : (
           messages.map((m) => {
            if (m.role === "assistant") {
              console.log("[citations] render", {
                mId: m.id,
                hasEntry: !!messageSources[m.id],
                entryLen: messageSources[m.id]?.length,
                keys: Object.keys(messageSources),
              });
            }
            return (
            <div
              key={m.id}
              className={`flex w-full ${m.role === "user" ? "justify-end" : "justify-start"
                }`}
            >
              <div
                className={`flex gap-4 max-w-[85%] sm:max-w-[75%] ${m.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
              >
                {/* Avatar */}
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 ${m.role === "user"
                    ? "bg-neutral-800 border border-neutral-700"
                    : "bg-indigo-500/20 border border-indigo-500/30 text-indigo-400"
                    }`}
                >
                  {m.role === "user" ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>

                {/* Message bubble + citations */}
                <div className="flex flex-col gap-2">
                  <div
                    className={`px-5 py-3.5 rounded-2xl text-sm leading-relaxed ${m.role === "user"
                      ? "bg-neutral-800 border border-neutral-700 text-neutral-100 rounded-tr-sm"
                      : "bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-tl-sm shadow-sm"
                      }`}
                  >
                    {(m as any).parts?.map((part: any, i: number) =>
                      part.type === "text" ? (
                        <span key={i}>{part.text}</span>
                      ) : null
                    )}
                  </div>

                  {/* Source Citations — only for assistant messages */}
                  {m.role === "assistant" &&
                    messageSources[m.id] &&
                    messageSources[m.id].length > 0 && (
                      <div className="flex flex-col gap-1.5 px-1">
                        <span className="text-xs text-neutral-500 font-medium uppercase tracking-wider">
                          Sources
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {Array.from(
                            new Map(
                              messageSources[m.id].map((s) => [s.docId, s])
                            ).values()
                          ).map((source, i) => (
                            <div key={i} className="relative group">
                              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-indigo-950/60 border border-indigo-800/40 text-indigo-300 hover:bg-indigo-900/60 hover:border-indigo-700/40 transition-all cursor-default">
                                <FileText className="w-3 h-3 flex-shrink-0" />
                                <span className="max-w-[180px] truncate">
                                  {source.docId}
                                </span>
                                <span className="text-indigo-500 text-[10px]">
                                  {Math.round(source.score * 100)}%
                                </span>
                              </div>

                              {/* Tooltip with chunk preview */}
                              <div className="absolute bottom-full left-0 mb-2 w-72 p-3 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-neutral-300 leading-relaxed shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                <div className="font-semibold text-indigo-400 mb-1 truncate">
                                  {source.docId}
                                </div>
                                <div className="text-neutral-400 line-clamp-4">
                                  {source.text}
                                </div>
                                <div className="absolute top-full left-4 w-2 h-2 bg-neutral-900 border-r border-b border-neutral-700 transform rotate-45 -translate-y-1" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            </div>
            );
          })
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex w-full justify-start animate-pulse">
            <div className="flex gap-4 max-w-[85%]">
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
                <Bot className="w-4 h-4" />
              </div>
              <div className="px-5 py-3.5 rounded-2xl bg-neutral-900 border border-neutral-800 rounded-tl-sm">
                <div className="flex gap-1.5 items-center h-5">
                  <div
                    className="w-1.5 h-1.5 rounded-full bg-indigo-400/50 animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <div
                    className="w-1.5 h-1.5 rounded-full bg-indigo-400/50 animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <div
                    className="w-1.5 h-1.5 rounded-full bg-indigo-400/50 animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <div className="p-4 bg-gradient-to-t from-neutral-950 via-neutral-950 to-transparent pt-10">
        <div className="max-w-3xl mx-auto relative">
          <form
            onSubmit={handleSubmit}
            className="relative flex items-end w-full gap-2 bg-neutral-900/50 border border-neutral-800 rounded-2xl p-2 shadow-xl focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all backdrop-blur-md"
          >
            <textarea
              className="w-full bg-transparent p-3 text-sm text-neutral-100 placeholder:text-neutral-500 outline-none resize-none max-h-32 min-h-[44px]"
              placeholder="Ask a question about your data..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              rows={1}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="flex-shrink-0 p-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 disabled:bg-neutral-800 disabled:text-neutral-500 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="text-center mt-3 text-xs text-neutral-600">
            AI can make mistakes. Consider verifying important information.
          </div>
        </div>
      </div>
    </div>
  );
}
