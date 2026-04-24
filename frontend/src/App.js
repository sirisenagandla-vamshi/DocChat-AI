import React, { useState, useRef, useEffect } from "react";

export default function App() {
  const [file, setFile] = useState(null);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: `Hi! Upload a PDF and I'll answer any questions about it using Gemini AI.\n\n• "What are the main skills listed?"\n• "What needs to be updated?"\n• "Summarize the experience"`,
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [chunks, setChunks] = useState(0);
  const [uploaded, setUploaded] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleUpload = async () => {
    if (!file) return alert("Please select a PDF first");
    const formData = new FormData();
    formData.append("file", file);
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/upload", { method: "POST", body: formData });
      const data = await res.json();
      setChunks(data.totalChunks || 0);
      setUploaded(true);
      setMessages(prev => [...prev, { role: "ai", text: `✓ PDF uploaded! ${data.totalChunks} chunks indexed. Ask me anything.` }]);
    } catch {
      alert("Upload failed. Is your backend running?");
    } finally {
      setLoading(false);
    }
  };

  const handleAsk = async () => {
    const q = question.trim();
    if (!q) return;
    setMessages(prev => [...prev, { role: "user", text: q }, { role: "thinking" }]);
    setQuestion("");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      setMessages(prev => prev.filter(m => m.role !== "thinking").concat({ role: "ai", text: data.answer }));
    } catch {
      setMessages(prev => prev.filter(m => m.role !== "thinking").concat({ role: "ai", text: "Error getting answer. Check your backend." }));
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAsk(); }
  };

  return (
    <div className="h-screen w-screen bg-[#0a0a0f] flex items-center justify-center p-6 overflow-hidden">
      <div className="grid grid-cols-[280px_1fr] w-full max-w-5xl h-full max-h-[800px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl">

        {/* ── Sidebar ── */}
        <div className="bg-[#111118] border-r border-white/10 p-6 flex flex-col gap-5 overflow-hidden">

          {/* Logo */}
          <div className="flex items-center gap-3 pb-5 border-b border-white/10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-violet-400 flex items-center justify-center text-xl shrink-0">
              📄
            </div>
            <div>
              <div className="text-sm font-semibold text-white tracking-tight">DocChat</div>
              <div className="text-xs text-violet-400 font-mono mt-0.5 opacity-70">RAG + Gemini</div>
            </div>
          </div>

          {/* Upload zone */}
          <div>
            <div className="text-[10px] text-white/30 font-mono tracking-widest mb-2 uppercase">Document</div>
            <label className={`flex flex-col items-center text-center p-5 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200
              ${file
                ? "border-green-500/50 bg-green-500/10"
                : "border-violet-500/40 bg-violet-500/10 hover:border-violet-400 hover:bg-violet-500/20"}`}>
              <input type="file" accept="application/pdf" className="hidden" onChange={e => setFile(e.target.files[0])} />
              <span className="text-3xl mb-2">{file ? "📎" : "☁️"}</span>
              <span className="text-xs text-white/50 leading-relaxed">
                <span className="text-violet-400 font-semibold">Click to choose</span> or drag PDF here
              </span>
              {file && (
                <span className="text-xs font-mono text-green-400 mt-2 break-all leading-relaxed">{file.name}</span>
              )}
            </label>
          </div>

          {/* Upload button */}
          <button
            onClick={handleUpload}
            disabled={loading || !file}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-violet-400 text-white text-sm font-semibold
              hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150
              disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0 shadow-lg shadow-violet-500/20"
          >
            {loading ? "Uploading..." : "Upload PDF"}
          </button>

          {/* Status pill */}
          <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-medium border transition-all duration-300
            ${uploaded
              ? "bg-green-500/20 text-green-400 border-green-500/30"
              : "bg-white/5 text-white/30 border-white/10"}`}>
            <div className={`w-2 h-2 rounded-full bg-current shrink-0 ${uploaded ? "animate-pulse" : "opacity-40"}`} />
            {uploaded ? `Ready · ${chunks} chunks indexed` : "No document loaded"}
          </div>

          {/* Hints */}
          <div className="mt-auto space-y-1 text-xs font-mono text-white/20">
            <div>1. Upload your PDF</div>
            <div>2. Ask any question</div>
            <div>3. Get AI answers</div>
          </div>
        </div>

        {/* ── Chat ── */}
        <div className="flex flex-col bg-[#0d0d14] overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
            <div>
              <div className="text-sm font-semibold text-white/90">Ask your document</div>
              <div className="text-xs font-mono text-white/30 mt-0.5">Powered by Gemini 2.5 Flash</div>
            </div>
            {chunks > 0 && (
              <span className="text-xs font-mono text-violet-400 bg-violet-500/20 border border-violet-500/30 px-3 py-1.5 rounded-full">
                {chunks} chunks indexed
              </span>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5 scrollbar-hide">
            {messages.map((msg, i) => {

              if (msg.role === "thinking") return (
                <div key={i} className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-violet-400 flex items-center justify-center text-sm text-white shrink-0 shadow-md">
                    ✦
                  </div>
                  <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white/5 border border-white/10">
                    <div className="flex gap-1.5 items-center h-4">
                      {[0, 150, 300].map(d => (
                        <span
                          key={d}
                          style={{ animationDelay: `${d}ms` }}
                          className="w-2 h-2 rounded-full bg-violet-500 animate-bounce"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );

              const isAI = msg.role === "ai";
              return (
                <div key={i} className={`flex gap-3 items-start ${isAI ? "" : "flex-row-reverse"}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 shadow-md
                    ${isAI
                      ? "bg-gradient-to-br from-violet-600 to-violet-400 text-white"
                      : "bg-white/10 border border-white/20 text-white/60"}`}>
                    {isAI ? "✦" : "V"}
                  </div>
                  <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
                    ${isAI
                      ? "bg-white/5 border border-white/10 text-white/75 rounded-tl-sm"
                      : "bg-violet-500/25 border border-violet-500/30 text-violet-100 rounded-tr-sm"}`}>
                    {msg.text}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input bar */}
          <div className="px-6 pb-6 pt-4 border-t border-white/10 flex gap-3 items-end shrink-0">
            <textarea
              rows={1}
              placeholder="Ask anything about your document..."
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={handleKey}
              className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm text-white
                placeholder-white/30 resize-none outline-none focus:border-violet-500/70 focus:bg-white/[0.12]
                transition-all duration-200 leading-relaxed"
              style={{ fontFamily: "inherit" }}
            />
            <button
              onClick={handleAsk}
              disabled={loading || !question.trim()}
              className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-600 to-violet-400 text-white flex items-center justify-center text-base
                hover:opacity-90 hover:-translate-y-0.5 transition-all duration-150
                disabled:opacity-30 disabled:cursor-not-allowed disabled:translate-y-0 shrink-0 shadow-lg shadow-violet-500/20"
            >
              ➤
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}