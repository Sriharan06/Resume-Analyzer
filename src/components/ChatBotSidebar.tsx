import React, { useState, useRef, useEffect } from "react";
import { 
  MessageSquare, 
  Send, 
  Sparkles, 
  X, 
  HelpCircle, 
  ArrowRight,
  User,
  Bot
} from "lucide-react";
import { ChatMessage } from "../types";

interface ChatBotSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const STARTER_PROMPTS = [
  "Rewrite my Lead Developer summary block",
  "How can I state Kubernetes on my resume?",
  "What is the STAR method for action bullet points?",
  "Suggest action verbs instead of 'responsible for'"
];

export default function ChatBotSidebar({ isOpen, onClose }: ChatBotSidebarProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "assistant",
      text: "Hello! I am your AI Resume Architect. Paste any bullet point, summary statement, or skill block here and I will optimize it for ATS systems in seconds! How can I help you?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputMsg, setInputMsg] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (textToSend = inputMsg) => {
    if (!textToSend.trim()) return;
    
    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMsg("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/chatbot/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: messages.concat(userMsg).map(m => ({ sender: m.sender, text: m.text })),
          userMessage: textToSend
        })
      });

      if (res.ok) {
        const data = await res.json();
        const replyMsg: ChatMessage = {
          id: Math.random().toString(36).substr(2, 9),
          sender: 'assistant',
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, replyMsg]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      id="chatbot-sidebar-panel" 
      className="fixed inset-y-0 right-0 w-full sm:w-[420px] bg-slate-950 border-l border-slate-800/80 shadow-2xl z-50 flex flex-col justify-between"
    >
      {/* Header */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-200">AI Resume Architect</h3>
            <span className="text-[10px] text-teal-400 font-mono font-medium">ATS Optimization Assistant</span>
          </div>
        </div>
        <button 
          id="close-chatbot-sidebar"
          onClick={onClose}
          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => {
          const isMe = m.sender === 'user';
          return (
            <div 
              key={m.id} 
              className={`flex gap-3 max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              <div className={`h-8 w-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${
                isMe ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' : 'bg-slate-900 text-emerald-400 border border-slate-800'
              }`}>
                {isMe ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>

              <div className="space-y-1">
                <div className={`p-3 rounded-2xl text-xs leading-relaxed font-medium ${
                  isMe 
                    ? 'bg-teal-500 text-slate-950 rounded-tr-none font-semibold' 
                    : 'bg-slate-900 text-slate-300 border border-slate-850 rounded-tl-none'
                }`}>
                  {m.text}
                </div>
                <span className="text-[9px] text-slate-500 font-mono block px-1 text-right">
                  {m.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex gap-3 max-w-[80%] mr-auto">
            <div className="h-8 w-8 rounded-full bg-slate-900 border border-slate-850 shrink-0 flex items-center justify-center text-emerald-400">
              <Bot className="h-4 w-4 animate-pulse" />
            </div>
            <div className="bg-slate-900 p-3 rounded-2xl rounded-tl-none border border-slate-850 flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-teal-400 animate-bounce [animation-delay:-0.3s]"></div>
              <div className="h-2 w-2 rounded-full bg-teal-400 animate-bounce [animation-delay:-0.15s]"></div>
              <div className="h-2 w-2 rounded-full bg-teal-400 animate-bounce"></div>
            </div>
          </div>
        )}
        <div ref={bottomRef}></div>
      </div>

      {/* Starter Prompts */}
      {messages.length === 1 && (
        <div className="px-4 py-2 border-t border-slate-900 space-y-2">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1">
            <HelpCircle className="h-3.5 w-3.5" /> Fast Suggestions
          </span>
          <div className="grid grid-cols-2 gap-2">
            {STARTER_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                className="p-2 bg-slate-900 hover:bg-slate-850 text-[10px] text-slate-300 font-medium text-left rounded-xl border border-slate-800/80 transition flex items-center justify-between gap-1"
              >
                <span>{prompt}</span>
                <ArrowRight className="h-3 w-3 shrink-0 text-teal-400" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <div className="p-4 bg-slate-900 border-t border-slate-800">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }} 
          className="flex items-center gap-2"
        >
          <input 
            id="chatbot-msg-input"
            type="text"
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            placeholder="Optimize bullet or ask for help..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500 transition font-medium"
          />
          <button 
            id="send-chatbot-msg"
            type="submit"
            disabled={!inputMsg.trim()}
            className="p-2.5 bg-teal-500 hover:bg-teal-400 disabled:opacity-40 text-slate-950 rounded-xl transition shrink-0"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
