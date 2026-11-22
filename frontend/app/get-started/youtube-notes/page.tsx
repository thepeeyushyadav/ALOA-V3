"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const API = "http://localhost:8000";

// ── Types ─────────────────────────────────────────────────────────────────────
type UIState = "idle" | "generating" | "done" | "error";

interface Step {
  message: string;
  detail: string;
  status: "pending" | "active" | "done";
}

interface NoteResult {
  title: string;
  markdown: string;
  pdf_file: string | null;
  note_id: string;
}

interface HistoryItem {
  id: string;
  url: string;
  title: string;
  created_at: string;
  pdf_file: string | null;
  word_count: number;
}

// ── Simple markdown → HTML renderer (no extra libs) ───────────────────────────
function renderMarkdown(md: string): string {
  return md
    .split("\n")
    .map(line => {
      if (line.startsWith("# "))  return `<h1>${line.slice(2)}</h1>`;
      if (line.startsWith("## ")) return `<h2>${line.slice(3)}</h2>`;
      if (line.startsWith("### "))return `<h3>${line.slice(4)}</h3>`;
      if (line.startsWith("- ") || line.startsWith("* "))
        return `<li>${line.slice(2).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")}</li>`;
      if (line.trim() === "") return "<br/>";
      return `<p>${line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")}</p>`;
    })
    .join("")
    .replace(/(<li>.*<\/li>)+/g, m => `<ul>${m}</ul>`);
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const INIT_STEPS: Step[] = [
  { message: "Reading video link",    detail: "Extracting video ID",           status: "pending" },
  { message: "Fetching captions",     detail: "Reading YouTube transcript",     status: "pending" },
  { message: "AI writing notes...",   detail: "Gemini structuring content",     status: "pending" },
  { message: "Saving files",          detail: "Creating PDF & Markdown",        status: "pending" },
];

// ── Page ──────────────────────────────────────────────────────────────────────
export default function YouTubeNotesPage() {
  const [ui, setUi]           = useState<UIState>("idle");
  const [url, setUrl]         = useState("");
  const [steps, setSteps]     = useState<Step[]>(INIT_STEPS);
  const [result, setResult]   = useState<NoteResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [errorMsg, setErrorMsg] = useState({ title: "", detail: "" });
  const [agentOffline, setAgentOffline] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load history on mount
  useEffect(() => {
    fetch(`${API}/api/youtube-notes/history`)
      .then(r => r.json())
      .then(setHistory)
      .catch(() => {});
  }, []);

  // ── Generate ──────────────────────────────────────────────────────────────
  const handleGenerate = useCallback(async (videoUrl?: string) => {
    const u = (videoUrl ?? url).trim();
    if (!u) return;

    setUi("generating");
    setSteps(INIT_STEPS.map(s => ({ ...s, status: "pending" })));
    setResult(null);
    setAgentOffline(false);

    try {
      const res = await fetch(`${API}/api/youtube-notes/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: u }),
      });

      const reader  = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        for (const line of decoder.decode(value).split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const payload = JSON.parse(line.slice(6));

          if (payload.type === "step") {
            setSteps(prev => {
              const next = [...prev];
              if (next[payload.index]) {
                next[payload.index] = {
                  ...next[payload.index],
                  status: payload.status,
                  message: payload.message,
                  detail: payload.detail,
                };
              }
              // activate next step
              if (payload.status === "done" && next[payload.index + 1]?.status === "pending") {
                next[payload.index + 1] = { ...next[payload.index + 1], status: "active" };
              }
              return next;
            });
          }

          if (payload.type === "done") {
            setResult({
              title:    payload.title,
              markdown: payload.markdown,
              pdf_file: payload.pdf_file,
              note_id:  payload.note_id,
            });
            setUi("done");
            // Refresh history
            fetch(`${API}/api/youtube-notes/history`).then(r => r.json()).then(setHistory).catch(() => {});
          }

          if (payload.type === "error") {
            setErrorMsg({ title: payload.message, detail: payload.detail });
            setUi("error");
          }
        }
      }
    } catch {
      setAgentOffline(true);
      setUi("idle");
    }
  }, [url]);

  function handleReset() {
    setUi("idle");
    setUrl("");
    setResult(null);
    setSteps(INIT_STEPS.map(s => ({ ...s, status: "pending" })));
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <Navbar variant="dark" />

      <div className="max-w-2xl mx-auto px-6 py-12 pb-24">

        {/* Back */}
        <Link href="/get-started"
          className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-white transition-colors mb-8">
          <span>←</span><span>Back to modules</span>
        </Link>

        {/* Meta */}
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs font-mono text-neutral-500">04 / 10</span>
          <span className="text-xs text-neutral-400 bg-white/[0.04] border border-white/10 px-2.5 py-0.5 rounded-full">Productivity</span>
        </div>

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-sky-400/10 border border-sky-400/20 flex items-center justify-center text-2xl shrink-0">🎬</div>
          <div>
            <h1 className="text-3xl font-light tracking-tight">YouTube Notes</h1>
            <p className="text-neutral-500 text-sm mt-0.5">Paste any lecture link — get structured PDF notes in seconds</p>
          </div>
        </div>

        {/* Agent offline */}
        {agentOffline && (
          <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/20">
            <span className="text-red-400 text-lg shrink-0">⚠</span>
            <div>
              <p className="text-sm text-white font-medium">ALOA Agent is not running</p>
              <p className="text-xs text-neutral-400 mt-1">Start it: <code className="text-sky-400 bg-white/[0.04] px-1.5 py-0.5 rounded">uvicorn backend.server:app --port 8000</code></p>
            </div>
          </div>
        )}

        {/* ── IDLE ── */}
        {ui === "idle" && (
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
            <label className="text-xs font-medium tracking-[0.2em] uppercase text-neutral-500 block mb-4">
              YouTube lecture link
            </label>
            <div className="flex gap-3">
              <input
                ref={inputRef}
                type="text"
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleGenerate()}
                placeholder="https://youtube.com/watch?v=..."
                className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-sky-400/40 transition-colors"
              />
              <button
                onClick={() => handleGenerate()}
                disabled={!url.trim()}
                className="bg-white text-black text-sm font-medium rounded-xl px-5 py-3 hover:bg-neutral-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
              >
                Generate →
              </button>
            </div>
            <p className="text-xs text-neutral-600 mt-3">Works with any YouTube video that has captions (auto-generated or manual)</p>
          </div>
        )}

        {/* ── GENERATING ── */}
        {ui === "generating" && (
          <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-sky-400 animate-pulse shrink-0" />
              <span className="text-sm text-neutral-400">Generating notes...</span>
              <span className="text-xs text-neutral-600 ml-auto">takes 20–60s</span>
            </div>
            <div className="px-5 py-5 space-y-5">
              {steps.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="shrink-0 mt-0.5">
                    {step.status === "done" && (
                      <div className="w-5 h-5 rounded-full bg-sky-400/10 border border-sky-400/30 flex items-center justify-center">
                        <span className="text-sky-400 text-[10px]">✓</span>
                      </div>
                    )}
                    {step.status === "active" && (
                      <div className="w-5 h-5 rounded-full border-2 border-sky-400/30 border-t-sky-400 animate-spin" />
                    )}
                    {step.status === "pending" && (
                      <div className="w-5 h-5 rounded-full border border-white/10" />
                    )}
                  </div>
                  <div className={step.status === "pending" ? "opacity-25" : ""}>
                    <p className="text-sm text-white">{step.message}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── DONE ── */}
        {ui === "done" && result && (
          <>
            {/* Header card */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 flex items-center justify-between gap-4 mb-5">
              <div>
                <p className="text-xs text-neutral-500 mb-1">📄 Notes ready</p>
                <p className="text-base font-medium leading-tight">{result.title}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                {result.pdf_file && (
                  <a
                    href={`${API}/api/youtube-notes/download/${result.pdf_file}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-sky-400 text-black font-semibold text-sm rounded-xl px-4 py-2.5 hover:bg-sky-300 transition-colors flex items-center gap-2"
                  >
                    ⬇ Download PDF
                  </a>
                )}
              </div>
            </div>

            {/* Markdown preview */}
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-[10px] tracking-widest uppercase text-neutral-600">Preview</span>
              <button
                onClick={() => navigator.clipboard.writeText(result.markdown)}
                className="text-[11px] text-neutral-500 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1 hover:text-white transition-colors"
              >
                Copy Markdown
              </button>
            </div>

            <div
              className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-7 max-h-[520px] overflow-y-auto prose-dark mb-5"
              style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(result.markdown) }}
            />

            <div className="text-center">
              <button onClick={handleReset}
                className="text-xs text-neutral-500 hover:text-white border border-white/[0.08] hover:border-white/15 rounded-full px-5 py-2 transition-colors">
                ↺ Generate notes for another video
              </button>
            </div>
          </>
        )}

        {/* ── ERROR ── */}
        {ui === "error" && (
          <div className="border border-red-500/20 rounded-2xl p-6 bg-red-500/[0.03]">
            <div className="flex items-start gap-3 mb-4">
              <span className="text-red-400 text-xl shrink-0">⚠</span>
              <div>
                <p className="text-white font-medium">{errorMsg.title}</p>
                <p className="text-sm text-neutral-400 mt-1">{errorMsg.detail}</p>
              </div>
            </div>
            <button onClick={handleReset}
              className="w-full border border-white/10 text-neutral-400 hover:text-white text-sm rounded-xl py-3 transition-colors">
              Try again
            </button>
          </div>
        )}

        {/* ── HISTORY ── */}
        {history.length > 0 && (ui === "idle" || ui === "done") && (
          <div className="mt-10">
            <p className="text-[10px] tracking-widest uppercase text-neutral-600 mb-4 px-1">
              Previously generated
            </p>
            <div className="flex flex-col gap-2">
              {history.map(item => (
                <div key={item.id}
                  className="flex items-center justify-between gap-4 px-4 py-3.5 bg-white/[0.02] border border-white/[0.06] rounded-xl hover:bg-white/[0.04] transition-colors group">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-neutral-200 truncate">{item.title}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[11px] text-neutral-600">{timeAgo(item.created_at)}</span>
                      {item.word_count && (
                        <span className="text-[11px] text-neutral-700">{item.word_count.toLocaleString()} words</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => { setUrl(item.url); handleGenerate(item.url); }}
                      className="text-[11px] text-neutral-600 hover:text-white border border-white/[0.06] hover:border-white/15 rounded-lg px-3 py-1.5 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      Regenerate
                    </button>
                    {item.pdf_file && (
                      <a
                        href={`${API}/api/youtube-notes/download/${item.pdf_file}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-sky-400 border border-sky-400/20 bg-sky-400/[0.06] rounded-lg px-3 py-1.5 hover:bg-sky-400/10 transition-colors"
                      >
                        ⬇ PDF
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Prose styles injected globally for the preview */}
      {/* suppressHydrationWarning: prevents content:'' quote mismatch between SSR and client */}
      <style suppressHydrationWarning>{`
        .prose-dark h1 { font-size:1.25rem; font-weight:600; margin-bottom:1rem; color:#fff; }
        .prose-dark h2 { font-size:1.1rem; font-weight:600; color:#38bdf8; margin:1.25rem 0 0.6rem; }
        .prose-dark h3 { font-size:0.95rem; font-weight:600; color:#38bdf8; margin:1.1rem 0 0.5rem; display:flex; align-items:center; gap:6px; }
        .prose-dark p  { font-size:0.8rem; color:rgba(255,255,255,0.6); line-height:1.8; margin-bottom:0.5rem; }
        .prose-dark ul { padding-left:1.2rem; margin-bottom:0.75rem; }
        .prose-dark li { font-size:0.8rem; color:rgba(255,255,255,0.6); line-height:1.8; }
        .prose-dark strong { color:rgba(255,255,255,0.85); font-weight:600; }
        .prose-dark br { display:block; margin:4px 0; content:''; }
      `}</style>

      <Footer />
    </main>
  );
}
