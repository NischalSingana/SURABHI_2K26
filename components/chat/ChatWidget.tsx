"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiMessageSquare, FiX, FiMinimize2, FiSend } from "react-icons/fi";
import { FaRobot } from "react-icons/fa";

/** Uses only the AI model (no FAQ matching). FAQ code is kept in admin/API but unused here. */
type Message = { role: "user" | "assistant"; content: string };

const PLACEHOLDER = "Ask about events, registration, accommodation...";
const SEND_COOLDOWN_MS = 2000;

/** Strip markdown asterisks so * and ** don't show in plain text display */
function formatMessageContent(content: string): string {
  return content
    .replace(/\*\*(.+?)\*\*/g, "$1") // **bold** → bold
    .replace(/\*(.+?)\*/g, "$1")     // *italic* → italic
    .replace(/^\s*\*\s+/gm, "• ")    // * list item → • item
    .trim();
}
const SPAM_WINDOW_MS = 8000;
const SPAM_THRESHOLD = 4;

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const sendCountRef = useRef(0);
  const sendWindowStartRef = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const now = Date.now();
    if (now < cooldownUntil) return;

    const windowStart = sendWindowStartRef.current;
    if (now - windowStart > SPAM_WINDOW_MS) {
      sendWindowStartRef.current = now;
      sendCountRef.current = 0;
    }
    sendCountRef.current += 1;
    if (sendCountRef.current > SPAM_THRESHOLD) {
      setError("Please slow down. Wait a moment before sending more messages.");
      setCooldownUntil(now + 5000);
      return;
    }

    setInput("");
    setError(null);
    const userMsg: Message = { role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);
    try {
      const apiMessages = [...messages, userMsg].map(({ role, content }) => ({
        role,
        content,
      }));
      const res = await fetch("/api/chatbot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) {
          setCooldownUntil(Date.now() + 60000);
          throw new Error(data.error || "Too many messages. Please wait a minute.");
        }
        throw new Error(data.error || "Request failed");
      }
      const raw = data.content?.trim() || "No response.";
      const content = formatMessageContent(raw);
      setMessages((m) => [...m, { role: "assistant", content }]);
      setCooldownUntil(Date.now() + SEND_COOLDOWN_MS);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      setError(msg);
      setMessages((m) => [...m, { role: "assistant", content: formatMessageContent(msg) }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-[90vw] md:w-[380px] h-[520px] max-h-[80vh] bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden pointer-events-auto"
          >
            <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center">
                  <FaRobot className="text-white text-2xl" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">Surabhi Assistant</h3>
                  <p className="text-xs text-green-500 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    AI · Fest queries
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
                aria-label="Close"
              >
                <FiMinimize2 className="text-xl" />
              </button>
            </div>

            <div
              className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-3 custom-scrollbar bg-black/20"
              onWheel={(e) => e.stopPropagation()}
            >
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <FaRobot className="text-5xl mx-auto mb-3 text-red-500 opacity-80" />
                  <p className="text-zinc-400 text-sm">
                    Ask anything about Surabhi 2026: events, registration, accommodation, schedule.
                  </p>
                  <p className="text-zinc-500 text-xs mt-2">Short, fast answers.</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm ${
                      msg.role === "user"
                        ? "bg-red-600/90 text-white"
                        : "bg-zinc-800 text-zinc-200 border border-zinc-700"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-zinc-400 text-sm">
                    <span className="animate-pulse">Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-3 border-t border-zinc-800 bg-zinc-950 shrink-0">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={PLACEHOLDER}
                  disabled={loading}
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 disabled:opacity-60"
                />
                <button
                  onClick={send}
                  disabled={loading || !input.trim() || Date.now() < cooldownUntil}
                  className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 disabled:opacity-50 text-white p-2.5 rounded-xl transition-all shrink-0"
                  aria-label="Send"
                >
                  <FiSend className="text-lg" />
                </button>
              </div>
              {error && (
                <p className="text-xs text-amber-500 mt-1.5 truncate" title={error}>
                  {error}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 rounded-full bg-gradient-to-br from-red-600 to-orange-600 text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center pointer-events-auto"
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? <FiX className="text-2xl" /> : <FiMessageSquare className="text-2xl" />}
      </motion.button>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #52525b;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #71717a;
        }
      `}</style>
    </div>
  );
}
