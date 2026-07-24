"use client";

import React, { useState } from "react";
import { Send, Mic, Bot } from "lucide-react";
import FormattedMarkdown from "@/components/FormattedMarkdown";
import AIExportToolbar from "@/components/AIExportToolbar";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AIChatPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();
      if (response.ok && data.answer) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.answer }]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: data.error || "Sorry, I could not process your query." }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Error connecting to AI chat service." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeechToText = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-50 text-cyan-600 rounded-2xl flex items-center justify-center font-bold">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-slate-900">AI Health Assistant</h2>
            <p className="text-xs text-slate-500">Retrieval Augmented Generation (RAG) initialized</p>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        {messages.length === 0 ? (
          <div className="text-center text-slate-400 my-auto py-16 flex flex-col items-center">
            <Bot className="w-12 h-12 mb-3 text-cyan-500 opacity-80" />
            <p className="font-bold text-slate-700 text-sm">Hello! I am your LifeOS AI Assistant.</p>
            <p className="text-xs mt-1 text-slate-500 max-w-sm">Ask any clinical question, search your medical history, or ask about lab results.</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
              <div className={`max-w-[92%] rounded-2xl p-4 text-xs sm:text-sm ${
                msg.role === "user" 
                  ? "bg-blue-600 text-white rounded-br-none font-medium" 
                  : "bg-slate-50 text-slate-800 rounded-bl-none border border-slate-200 shadow-2xs"
              }`}>
                {msg.role === "user" ? (
                  msg.content
                ) : (
                  <>
                    <FormattedMarkdown content={msg.content} />
                    <AIExportToolbar title="AI Clinical Report" content={msg.content} />
                  </>
                )}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded-2xl bg-slate-100 text-slate-500 text-xs flex items-center gap-1.5 animate-pulse">
              <span>Assistant is generating clinical response...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Row */}
      <form onSubmit={sendMessage} className="p-3 sm:p-4 border-t border-slate-200 bg-slate-50 flex items-center gap-2">
        <button
          type="button"
          onClick={handleSpeechToText}
          className={`p-2.5 rounded-xl border transition-colors flex-shrink-0 ${
            isListening
              ? "bg-red-500 text-white border-red-600 animate-pulse"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
          }`}
          title="Voice Speech-to-Text Input"
        >
          <Mic className="w-4 h-4" />
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
          className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          placeholder="Ask a medical question..."
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl px-4 py-2.5 text-xs sm:text-sm transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5 flex-shrink-0"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>
    </div>
  );
}
