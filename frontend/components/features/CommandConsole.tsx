"use client";

/**
 * /frontend/components/features/CommandConsole.tsx
 *
 * Interactive terminal & command console for ALOA's App Manager.
 * Reads real user input, parses natural language intent dynamically
 * (via simulateIntent.ts), displays animated multi-step execution logs,
 * and provides inline security confirmation dialogs.
 *
 * TODO Phase 4: Wire to real WebSocket backend agent (DualModelChain).
 */

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Terminal as TerminalIcon,
  Play,
  RotateCcw,
  Trash2,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Sparkles,
} from "lucide-react";
import {
  parseAppCommand,
  generateSimulationSteps,
  ParsedCommand,
  TerminalLogStep,
} from "@/lib/simulateIntent";

export interface CommandConsoleProps {
  initialCommand?: string;
}

interface LogEntry {
  id: string;
  text: string;
  type: "info" | "success" | "warning" | "error" | "command" | "agent" | "prompt";
  timestamp: string;
}

const QUICK_PROMPTS = [
  "install cursor",
  "launch spotify",
  "update vs code",
  "uninstall skype",
  "search docker",
];

export default function CommandConsole({ initialCommand = "" }: CommandConsoleProps) {
  const [input, setInput] = useState(initialCommand);
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: "boot-1",
      text: "ALOA Agent v3.4.0 [Windows System Bridge Initialized]",
      type: "agent",
      timestamp: "12:00:01",
    },
    {
      id: "boot-2",
      text: "DualModelChain: Groq Llama-3.3-70b (Primary) • Gemini 1.5 Pro (Fallback)",
      type: "info",
      timestamp: "12:00:01",
    },
    {
      id: "boot-3",
      text: 'Ready for natural language commands. Example: "install cursor" or "launch spotify"',
      type: "success",
      timestamp: "12:00:02",
    },
  ]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState<{
    parsed: ParsedCommand;
    remainingSteps: TerminalLogStep[];
  } | null>(null);
  const [copiedLog, setCopiedLog] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of logs
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, pendingConfirmation]);

  // Update input if initialCommand changes from external prop
  useEffect(() => {
    if (initialCommand) {
      setInput(initialCommand);
      inputRef.current?.focus();
    }
  }, [initialCommand]);

  const getTimeString = () => {
    const d = new Date();
    return d.toTimeString().split(" ")[0];
  };

  const executeSteps = async (steps: TerminalLogStep[]) => {
    for (const step of steps) {
      await new Promise((r) => setTimeout(r, step.delayMs ?? 400));
      setLogs((prev) => [
        ...prev,
        {
          id: `step-${Date.now()}-${Math.random()}`,
          text: step.text,
          type: step.type,
          timestamp: getTimeString(),
        },
      ]);
    }
  };

  const handleRunCommand = async (commandToRun?: string) => {
    const textToExecute = (commandToRun ?? input).trim();
    if (!textToExecute || isExecuting) return;

    setIsExecuting(true);
    setPendingConfirmation(null);

    // 1. Log the user prompt
    const promptEntry: LogEntry = {
      id: `prompt-${Date.now()}`,
      text: `> ${textToExecute}`,
      type: "prompt",
      timestamp: getTimeString(),
    };

    setLogs((prev) => [...prev, promptEntry]);
    setInput("");

    // 2. Parse command intent dynamically
    const parsed = parseAppCommand(textToExecute);
    const steps = generateSimulationSteps(parsed);

    // If confirmation is needed (install/uninstall/update), run initial 4 steps then pause for user approval
    if (parsed.requiresConfirmation && steps.length > 5) {
      const initialSteps = steps.slice(0, 5);
      const remainingSteps = steps.slice(5);

      await executeSteps(initialSteps);
      setPendingConfirmation({ parsed, remainingSteps });
      setIsExecuting(false);
      return;
    }

    // Otherwise execute all steps continuously
    await executeSteps(steps);
    setIsExecuting(false);
  };

  const handleConfirmAction = async () => {
    if (!pendingConfirmation) return;
    const { remainingSteps } = pendingConfirmation;
    setPendingConfirmation(null);
    setIsExecuting(true);

    setLogs((prev) => [
      ...prev,
      {
        id: `confirm-${Date.now()}`,
        text: `[User Action] Execution authorization GRANTED by operator.`,
        type: "agent",
        timestamp: getTimeString(),
      },
    ]);

    await executeSteps(remainingSteps);
    setIsExecuting(false);
  };

  const handleCancelAction = () => {
    if (!pendingConfirmation) return;
    setPendingConfirmation(null);
    setIsExecuting(false);

    setLogs((prev) => [
      ...prev,
      {
        id: `cancel-${Date.now()}`,
        text: `[User Action] Execution authorization CANCELLED by operator. Safe abort.`,
        type: "warning",
        timestamp: getTimeString(),
      },
    ]);
  };

  const handleClearLogs = () => {
    setLogs([
      {
        id: `clear-${Date.now()}`,
        text: "Console cleared. Terminal session reset.",
        type: "agent",
        timestamp: getTimeString(),
      },
    ]);
    setPendingConfirmation(null);
  };

  const handleReplayDemo = () => {
    handleRunCommand("install visual studio code");
  };

  const handleCopyLogs = () => {
    const text = logs.map((l) => `[${l.timestamp}] ${l.text}`).join("\n");
    navigator.clipboard.writeText(text);
    setCopiedLog(true);
    setTimeout(() => setCopiedLog(false), 1600);
  };

  return (
    <section id="console" className="py-20 md:py-28 bg-[#0F0F0F] relative">
      <div className="max-w-5xl mx-auto px-6 md:px-12">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Sparkles size={11} />
                LIVE DEMO ENVIRONMENT
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ONLINE
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-light text-white tracking-tight">
              Interactive Terminal Console
            </h2>
            <p className="text-sm text-neutral-400 mt-1">
              Type any command to see ALOA parse your request in real time.
            </p>
          </div>

          {/* Quick Console Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleReplayDemo}
              disabled={isExecuting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg transition-colors disabled:opacity-50"
            >
              <RotateCcw size={12} />
              <span>Replay Demo</span>
            </button>

            <button
              onClick={handleClearLogs}
              title="Clear terminal"
              className="p-1.5 text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900 border border-neutral-800/60 rounded-lg transition-colors"
            >
              <Trash2 size={13} />
            </button>

            <button
              onClick={handleCopyLogs}
              title="Copy terminal session"
              className="p-1.5 text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900 border border-neutral-800/60 rounded-lg transition-colors"
            >
              {copiedLog ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            </button>
          </div>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs text-neutral-500 font-mono">Quick Try:</span>
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleRunCommand(prompt)}
              disabled={isExecuting}
              className="px-2.5 py-1 text-xs font-mono rounded-lg bg-neutral-900/80 text-neutral-400 hover:text-white hover:bg-neutral-800 border border-neutral-800 transition-colors active:scale-95 disabled:opacity-50"
            >
              &gt; {prompt}
            </button>
          ))}
        </div>

        {/* Main Terminal Window */}
        <div className="rounded-2xl overflow-hidden border border-neutral-800 bg-[#070707] shadow-2xl shadow-black/80">
          {/* Terminal Window Chrome Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#111111] border-b border-neutral-800">
            {/* macOS / Linux style dots */}
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
              <span className="ml-3 font-mono text-xs text-neutral-400 flex items-center gap-1.5">
                <TerminalIcon size={12} className="text-neutral-500" />
                <span>aloa@agent-session: ~/modules/app-manager</span>
              </span>
            </div>

            {/* Status indicator */}
            <div className="flex items-center gap-2 text-xs font-mono">
              {isExecuting ? (
                <span className="text-amber-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  PARSING &amp; RUNNING...
                </span>
              ) : pendingConfirmation ? (
                <span className="text-indigo-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                  AWAITING PERMISSION
                </span>
              ) : (
                <span className="text-neutral-500">STANDBY</span>
              )}
            </div>
          </div>

          {/* Terminal Log Output Area */}
          <div
            ref={scrollRef}
            className="h-80 md:h-96 p-5 overflow-y-auto font-mono text-xs md:text-sm space-y-2.5 select-text"
          >
            {logs.map((log) => {
              let colorClass = "text-neutral-300";
              if (log.type === "prompt") colorClass = "text-indigo-400 font-semibold";
              else if (log.type === "command") colorClass = "text-amber-300 bg-neutral-900/60 px-2 py-0.5 rounded";
              else if (log.type === "success") colorClass = "text-emerald-400 font-medium";
              else if (log.type === "agent") colorClass = "text-purple-400";
              else if (log.type === "warning") colorClass = "text-rose-400";

              return (
                <div key={log.id} className="flex items-start gap-3 leading-relaxed">
                  <span className="text-neutral-600 select-none text-[11px] pt-0.5 shrink-0">
                    {log.timestamp}
                  </span>
                  <span className={`${colorClass} break-all flex-1`}>{log.text}</span>
                </div>
              );
            })}

            {/* Inline Confirmation Card */}
            <AnimatePresence>
              {pendingConfirmation && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  className="my-4 p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/40 text-neutral-200"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <ShieldAlert size={20} className="text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-white">
                        User Confirmation Required
                      </h4>
                      <p className="text-xs text-neutral-400 mt-1">
                        ALOA Agent is ready to execute:{" "}
                        <code className="text-indigo-300 font-mono bg-neutral-900 px-1 py-0.5 rounded">
                          {pendingConfirmation.parsed.commandSnippet}
                        </code>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 pt-2 border-t border-indigo-500/20">
                    <button
                      onClick={handleConfirmAction}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors shadow"
                    >
                      <CheckCircle2 size={13} />
                      <span>Authorize Execution</span>
                    </button>
                    <button
                      onClick={handleCancelAction}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-medium border border-neutral-700 transition-colors"
                    >
                      <XCircle size={13} />
                      <span>Cancel</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Typing / Executing Pulsing Cursor */}
            {isExecuting && (
              <div className="flex items-center gap-2 text-neutral-500 text-xs">
                <span className="w-2 h-4 bg-indigo-400 animate-pulse" />
                <span>Processing system operation...</span>
              </div>
            )}
          </div>

          {/* Terminal Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleRunCommand();
            }}
            className="flex items-center gap-3 p-3.5 bg-[#0D0D0D] border-t border-neutral-800"
          >
            <span className="text-indigo-400 font-mono font-bold text-sm pl-2 select-none">
              &gt;
            </span>

            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isExecuting || !!pendingConfirmation}
              placeholder='Try typing: "install cursor", "launch chrome", "update vs code"...'
              className="flex-1 bg-transparent text-sm font-mono text-white placeholder:text-neutral-600 focus:outline-none disabled:opacity-50"
            />

            <button
              type="submit"
              disabled={!input.trim() || isExecuting || !!pendingConfirmation}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white text-neutral-950 text-xs font-semibold hover:bg-neutral-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
            >
              <Play size={12} fill="currentColor" />
              <span>Run</span>
            </button>
          </form>
        </div>

        {/* Console Footnote */}
        <p className="text-center text-xs text-neutral-500 mt-4">
          Simulated browser runtime with live intent extraction. In Phase 4, commands execute directly on your host OS via ALOA Desktop Bridge.
        </p>
      </div>
    </section>
  );
}
