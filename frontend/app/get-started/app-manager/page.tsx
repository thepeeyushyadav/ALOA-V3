"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// ── Types ────────────────────────────────────────────────────────────────────
type UIState = "idle" | "thinking" | "confirm" | "executing" | "done" | "error";

interface Step {
  message: string;
  detail: string;
}

interface Intent {
  action: string;
  action_label: string;
  emoji: string;
  app_name: string;
  steps: Step[];
  command: string;
}

interface StepStatus {
  status: "pending" | "active" | "done" | "error";
  message: string;
  detail: string;
}

import { API_BASE_URL } from "@/lib/api";

const API = API_BASE_URL;

const QUICK_PICKS = [
  "Open Chrome",
  "Install Spotify",
  "Install VS Code",
  "Close Notepad",
  "Open Calculator",
  "Remove VLC",
];

const ACTION_DESCRIPTIONS: Record<string, string> = {
  install: "ALOA will download and install this app on your computer using the official package.",
  open:    "ALOA will search your computer and open this app for you.",
  close:   "ALOA will find the running process and close it safely.",
  uninstall: "ALOA will completely remove this app and its files from your computer.",
};

// ── Page ─────────────────────────────────────────────────────────────────────
export default function AppManagerPage() {
  const [input, setInput]       = useState("");
  const [uiState, setUiState]   = useState<UIState>("idle");
  const [intent, setIntent]     = useState<Intent | null>(null);
  const [steps, setSteps]       = useState<StepStatus[]>([]);
  const [doneMsg, setDoneMsg]   = useState("");
  const [errorMsg, setErrorMsg] = useState({ title: "", detail: "" });
  const [agentOffline, setAgentOffline] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Ask ALOA ───────────────────────────────────────────────────────────────
  async function handleAsk(query?: string) {
    const q = (query ?? input).trim();
    if (!q) return;

    setUiState("thinking");
    setAgentOffline(false);

    try {
      const res = await fetch(`${API}/api/app-manager/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: q }),
      });
      const data = await res.json();

      if (data.error) {
        setErrorMsg({ title: "AI Error", detail: data.message });
        setUiState("error");
        return;
      }

      setIntent(data);
      setUiState("confirm");
    } catch {
      setAgentOffline(true);
      setUiState("idle");
    }
  }

  // ── Confirm & Execute ──────────────────────────────────────────────────────
  async function handleConfirm() {
    if (!intent) return;

    // Build initial step statuses from intent
    const initial: StepStatus[] = [
      { status: "done", message: "Request confirmed", detail: `${intent.action_label} ${intent.app_name}` },
      ...intent.steps.map(s => ({ status: "pending" as const, message: s.message, detail: s.detail })),
    ];
    setSteps(initial);
    setUiState("executing");

    try {
      const res = await fetch(`${API}/api/app-manager/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action:       intent.action,
          action_label: intent.action_label,
          app_name:     intent.app_name,
          command:      intent.command,
        }),
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = JSON.parse(line.slice(6));

          if (payload.type === "step") {
            setSteps(prev => {
              const next = [...prev];
              const idx = payload.index;
              if (next[idx]) {
                next[idx] = { status: payload.status, message: payload.message, detail: payload.detail };
              }
              // mark next as active if this one just finished
              if (payload.status === "done" && next[idx + 1]?.status === "pending") {
                next[idx + 1] = { ...next[idx + 1], status: "active" };
              }
              return next;
            });
          }

          if (payload.type === "done") {
            setDoneMsg(payload.message);
            setUiState("done");
            // Auto-reset after 2.5s — returns to input
            setTimeout(() => {
              setUiState("idle");
              setIntent(null);
              setInput("");
              setSteps([]);
              setDoneMsg("");
              setTimeout(() => inputRef.current?.focus(), 50);
            }, 2500);
          }

          if (payload.type === "error") {
            setErrorMsg({ title: payload.message, detail: payload.detail });
            setUiState("error");
          }
        }
      }
    } catch {
      setErrorMsg({ title: "Connection lost", detail: "ALOA agent stopped responding." });
      setUiState("error");
    }
  }

  function handleCancel() {
    setUiState("idle");
    setIntent(null);
    setInput("");
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  function handleReset() {
    setUiState("idle");
    setIntent(null);
    setInput("");
    setSteps([]);
    setDoneMsg("");
    setErrorMsg({ title: "", detail: "" });
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <Navbar variant="dark" />

      <div className="max-w-2xl mx-auto px-6 py-12 pb-24">

        {/* ── Module Header ── */}
        <div className="mb-10">
          <Link
            href="/get-started"
            className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-white transition-colors mb-8"
          >
            <span>←</span>
            <span>Back to modules</span>
          </Link>

          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-mono text-neutral-500">01 / 10</span>
            <span className="text-xs text-neutral-400 bg-white/[0.04] border border-white/10 px-2.5 py-0.5 rounded-full">
              System
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-400/10 border border-sky-400/20 flex items-center justify-center text-2xl shrink-0">
              🪟
            </div>
            <div>
              <h1 className="text-3xl font-light tracking-tight">App Manager</h1>
              <p className="text-neutral-500 text-sm mt-0.5">
                Install, open, and manage apps using plain English
              </p>
            </div>
          </div>
        </div>

        {/* ── Agent Offline Banner ── */}
        {agentOffline && (
          <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/20">
            <span className="text-red-400 text-lg shrink-0">⚠</span>
            <div>
              <p className="text-sm text-white font-medium">ALOA Agent is not running</p>
              <p className="text-xs text-neutral-400 mt-1">
                Start the agent first:{" "}
                <code className="text-sky-400 bg-white/[0.04] px-1.5 py-0.5 rounded">
                  uvicorn backend.server:app --port 8000
                </code>
              </p>
            </div>
          </div>
        )}

        {/* ── INPUT (always visible unless executing/done) ── */}
        {(uiState === "idle" || uiState === "thinking") && (
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 mb-5">
            <label className="text-xs font-medium tracking-[0.2em] uppercase text-neutral-500 block mb-4">
              What do you want to do?
            </label>

            <div className="flex gap-3">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAsk()}
                placeholder='e.g. "Install Spotify" or "Open Chrome"'
                disabled={uiState === "thinking"}
                className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-sky-400/40 transition-colors disabled:opacity-40"
              />
              <button
                onClick={() => handleAsk()}
                disabled={!input.trim() || uiState === "thinking"}
                className="bg-white text-black text-sm font-medium rounded-xl px-5 py-3 hover:bg-neutral-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                {uiState === "thinking" ? "..." : "Ask →"}
              </button>
            </div>

            {/* Quick picks */}
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="text-xs text-neutral-600 pt-1">Try:</span>
              {QUICK_PICKS.map(q => (
                <button
                  key={q}
                  onClick={() => { setInput(q); handleAsk(q); }}
                  disabled={uiState === "thinking"}
                  className="text-xs text-neutral-400 hover:text-white border border-white/[0.08] hover:border-white/20 rounded-full px-3 py-1 transition-colors disabled:opacity-40"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── THINKING ── */}
        {uiState === "thinking" && (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 flex items-center gap-4">
            <div className="w-6 h-6 border-2 border-sky-400/30 border-t-sky-400 rounded-full animate-spin shrink-0" />
            <div>
              <p className="text-sm text-white">ALOA is figuring this out...</p>
              <p className="text-xs text-neutral-500 mt-0.5">Understanding your request using AI</p>
            </div>
          </div>
        )}

        {/* ── CONFIRM (Permission Card) ── */}
        {uiState === "confirm" && intent && (
          <div className="border border-sky-400/25 rounded-2xl overflow-hidden bg-sky-400/[0.03]">
            {/* Card Header */}
            <div className="px-6 py-5 border-b border-white/[0.06] flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-sky-400/10 border border-sky-400/20 flex items-center justify-center text-xl shrink-0">
                {intent.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-medium text-white truncate">
                  {intent.action_label} {intent.app_name}
                </p>
                <p className="text-xs text-neutral-500 mt-0.5">ALOA needs your permission</p>
              </div>
              <span className="text-xs bg-sky-400/10 text-sky-400 border border-sky-400/20 px-2.5 py-1 rounded-full shrink-0">
                {intent.action_label}
              </span>
            </div>

            {/* Description + What will happen */}
            <div className="px-6 py-5">
              <p className="text-sm text-neutral-400 leading-relaxed mb-5">
                {ACTION_DESCRIPTIONS[intent.action] ??
                  `ALOA will ${intent.action_label.toLowerCase()} ${intent.app_name} on your computer.`}
              </p>

              {/* Steps — user-friendly, NO technical commands */}
              <div className="space-y-0 mb-6 rounded-xl border border-white/[0.06] overflow-hidden">
                {intent.steps.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.05] last:border-b-0"
                  >
                    <span className="text-sky-400 text-sm shrink-0">
                      {i === 0 ? "↓" : i === intent.steps.length - 1 ? "🚀" : "⚙"}
                    </span>
                    <div className="min-w-0">
                      <span className="text-sm text-white">{s.message}</span>
                      <span className="text-xs text-neutral-500 ml-2">{s.detail}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons — human language */}
              <div className="flex gap-3">
                <button
                  onClick={handleConfirm}
                  className="flex-1 bg-white text-black text-sm font-medium rounded-xl py-3.5 hover:bg-neutral-100 transition-colors"
                >
                  Yes, {intent.action_label} {intent.app_name}
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 border border-white/10 text-neutral-400 hover:text-white hover:border-white/20 text-sm rounded-xl py-3.5 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── EXECUTING (Friendly Step Cards) ── */}
        {(uiState === "executing" || uiState === "done") && (
          <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl overflow-hidden">
            {/* Status bar */}
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
              {uiState === "executing" ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-sky-400 animate-pulse shrink-0" />
                  <span className="text-sm text-neutral-400">Running...</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                  <span className="text-sm text-neutral-400">Complete</span>
                </>
              )}
            </div>

            {/* Steps */}
            <div className="px-5 py-5 space-y-4">
              {steps.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  {/* Icon */}
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
                    {step.status === "error" && (
                      <div className="w-5 h-5 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                        <span className="text-red-400 text-[10px]">✕</span>
                      </div>
                    )}
                  </div>

                  {/* Text */}
                  <div className={step.status === "pending" ? "opacity-30" : ""}>
                    <p className="text-sm text-white">{step.message}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Success block */}
            {uiState === "done" && (
              <div className="px-5 py-5 border-t border-white/[0.06] bg-green-400/[0.03] text-center">
                <div className="text-2xl mb-2">🎉</div>
                <p className="text-white font-medium text-sm">{doneMsg}</p>
                <button
                  onClick={handleReset}
                  className="mt-4 text-xs text-neutral-500 hover:text-white border border-white/[0.08] hover:border-white/20 rounded-full px-4 py-1.5 transition-colors"
                >
                  Do something else
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── ERROR ── */}
        {uiState === "error" && (
          <div className="border border-red-500/20 rounded-2xl overflow-hidden bg-red-500/[0.03]">
            <div className="px-6 py-5">
              <div className="flex items-start gap-3 mb-4">
                <span className="text-red-400 text-xl shrink-0">⚠</span>
                <div>
                  <p className="text-white font-medium">{errorMsg.title}</p>
                  <p className="text-sm text-neutral-400 mt-1">{errorMsg.detail}</p>
                </div>
              </div>
              <button
                onClick={handleReset}
                className="w-full border border-white/10 text-neutral-400 hover:text-white text-sm rounded-xl py-3 transition-colors"
              >
                Try again
              </button>
            </div>
          </div>
        )}

      </div>
      <Footer />
    </main>
  );
}
