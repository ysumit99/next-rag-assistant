"use client";

import { useChat } from '@ai-sdk/react';
import { Send, Bot, User, Sparkles, Database } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';
import DocumentUploader from '@/components/DocumentUploader';

export default function Home() {
  const { messages, sendMessage, status } = useChat();
  const isLoading = status === 'submitted' || status === 'streaming';
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ role: 'user', parts: [{ type: 'text', text: input }] });
    setInput('');
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex h-screen w-full flex-col bg-neutral-950 text-neutral-50 font-sans selection:bg-indigo-500/30">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-neutral-800/50 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-lg tracking-tight">AI Knowledge Base</h1>
            <p className="text-xs text-neutral-400 hidden sm:block">Powered by Next.js, Vercel AI SDK & Gemini</p>
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
              Ask me anything about your documents. I use RAG to fetch the most relevant context and generate accurate answers.
            </p>
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`flex w-full ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`flex gap-4 max-w-[85%] sm:max-w-[75%] ${
                  m.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 ${
                    m.role === 'user'
                      ? 'bg-neutral-800 border border-neutral-700'
                      : 'bg-indigo-500/20 border border-indigo-500/30 text-indigo-400'
                  }`}
                >
                  {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div
                  className={`px-5 py-3.5 rounded-2xl text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-neutral-800 border border-neutral-700 text-neutral-100 rounded-tr-sm'
                      : 'bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-tl-sm shadow-sm'
                  }`}
                >
                  {m.parts ? m.parts.map((part: any, i: number) => part.type === 'text' ? <span key={i}>{part.text}</span> : null) : null}
                </div>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex w-full justify-start animate-pulse">
            <div className="flex gap-4 max-w-[85%]">
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
                <Bot className="w-4 h-4" />
              </div>
              <div className="px-5 py-3.5 rounded-2xl bg-neutral-900 border border-neutral-800 rounded-tl-sm">
                <div className="flex gap-1.5 items-center h-5">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400/50 animate-bounce" style={{ animationDelay: '300ms' }} />
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
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  // Trigger form submission
                  const form = e.currentTarget.form;
                  if (form) form.requestSubmit();
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
