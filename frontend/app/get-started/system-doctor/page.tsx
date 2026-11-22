"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const API = "http://localhost:8000";

// ── Types ─────────────────────────────────────────────────────────────────────
type UIState =
  | "idle"
  | "scanning"
  | "scanned"
  | "confirming"
  | "cleaning"
  | "error";
type ImpactLevel = "critical" | "moderate" | "normal";

interface Process {
  rank: number;
  name: string;
  pid: number;
  mem_label: string;
  impact: ImpactLevel;
}

interface ScanResult {
  cpu: number;
  ram: number;
  disk: number;
  disk_free: string;
  cpu_status: "stable" | "high" | "critical";
  ram_status: "stable" | "high" | "critical";
  disk_status: "stable" | "high" | "critical";
  processes: Process[];
  junk_label: string;
  insight: string;
}

interface KillingState {
  [pid: number]: "idle" | "killing" | "done" | "error";
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const STATUS_COLOR: Record<string, string> = {
  stable: "text-sky-400",
  high: "text-amber-400",
  critical: "text-red-400",
};
const STATUS_BAR: Record<string, string> = {
  stable: "bg-sky-400",
  high: "bg-amber-400",
  critical: "bg-red-400",
};
const STATUS_LABEL: Record<string, string> = {
  stable: "Stable",
  high: "High",
  critical: "Critical",
};
const IMPACT_COLOR: Record<ImpactLevel, string> = {
  critical: "text-red-400",
  moderate: "text-amber-400",
  normal: "text-neutral-500",
};
const IMPACT_LABEL: Record<ImpactLevel, string> = {
  critical: "🔥 Critical",
  moderate: "🔸 Moderate",
  normal: "· Normal",
};

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SystemDoctorPage() {
  const [ui, setUi] = useState<UIState>("idle");
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [killing, setKilling] = useState<KillingState>({});
  const [cleanSteps, setCleanSteps] = useState<
    { message: string; detail: string; status: "active" | "done" }[]
  >([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [agentOffline, setAgentOffline] = useState(false);

  // ── Scan ────────────────────────────────────────────────────────────────────
  const handleScan = useCallback(async () => {
    setUi("scanning");
    setAgentOffline(false);
    try {
      const res = await fetch(`${API}/api/system-doctor/scan`);
      const data = await res.json();
      if (data.error) {
        setErrorMsg(data.message);
        setUi("error");
        return;
      }
      setScan(data);
      setKilling({});
      setUi("scanned");
    } catch {
      setAgentOffline(true);
      setUi("idle");
    }
  }, []);

  // ── Kill process ────────────────────────────────────────────────────────────
  const handleKill = useCallback(async (proc: Process) => {
    setKilling((prev) => ({ ...prev, [proc.pid]: "killing" }));
    try {
      const res = await fetch(`${API}/api/system-doctor/kill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ process_name: proc.name }),
      });
      const data = await res.json();
      setKilling((prev) => ({
        ...prev,
        [proc.pid]: data.success ? "done" : "error",
      }));
    } catch {
      setKilling((prev) => ({ ...prev, [proc.pid]: "error" }));
    }
  }, []);

  // ── Cleanup ─────────────────────────────────────────────────────────────────
  const handleCleanup = useCallback(async () => {
    setCleanSteps([
      {
        message: "Cleanup approved",
        detail: "Starting junk removal",
        status: "done",
      },
      {
        message: "Clearing temp files...",
        detail: "Windows Temp & User Temp",
        status: "active",
      },
    ]);
    setUi("cleaning");

    try {
      const res = await fetch(`${API}/api/system-doctor/cleanup`, {
        method: "POST",
      });
      const reader = res.body!.getReader();
      const dec = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of dec.decode(value).split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const payload = JSON.parse(line.slice(6));
          if (payload.type === "step") {
            setCleanSteps((prev) => {
              const next = [...prev];
              if (next[payload.index])
                next[payload.index] = {
                  ...next[payload.index],
                  status: payload.status,
                  message: payload.message,
                  detail: payload.detail,
                };
              return next;
            });
          }
          if (payload.type === "done") {
            // Refresh scan data after cleanup
            setTimeout(async () => {
              const r = await fetch(`${API}/api/system-doctor/scan`);
              const d = await r.json();
              if (!d.error) setScan(d);
              setUi("scanned");
            }, 1200);
          }
          if (payload.type === "error") {
            setErrorMsg(payload.detail);
            setUi("error");
          }
        }
      }
    } catch {
      setErrorMsg("Could not connect to ALOA agent.");
      setUi("error");
    }
  }, []);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <Navbar variant="dark" />

      <div className="max-w-2xl mx-auto px-6 py-12 pb-24">
        {/* Back */}
        <Link
          href="/get-started"
          className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-white transition-colors mb-8"
        >
          <span>←</span>
          <span>Back to modules</span>
        </Link>

        {/* Meta */}
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs font-mono text-neutral-500">02 / 10</span>
          <span className="text-xs text-neutral-400 bg-white/[0.04] border border-white/10 px-2.5 py-0.5 rounded-full">
            System
          </span>
        </div>

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-sky-400/10 border border-sky-400/20 flex items-center justify-center text-2xl shrink-0">
            🩺
          </div>
          <div>
            <h1 className="text-3xl font-light tracking-tight">
              System Insights
            </h1>
            <p className="text-neutral-500 text-sm mt-0.5">
              Diagnoses your PC health and tells you exactly what to fix
            </p>
          </div>
        </div>

        {/* Agent offline banner */}
        {agentOffline && (
          <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/20">
            <span className="text-red-400 text-lg shrink-0">⚠</span>
            <div>
              <p className="text-sm text-white font-medium">
                ALOA Agent is not running
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                Start the agent:{" "}
                <code className="text-sky-400 bg-white/[0.04] px-1.5 py-0.5 rounded">
                  uvicorn backend.server:app --port 8000
                </code>
              </p>
            </div>
          </div>
        )}

        {/* ── IDLE ── */}
        {ui === "idle" && (
          <div className="text-center py-16">
            <div className="text-5xl mb-6 opacity-40">🩺</div>
            <p className="text-neutral-400 text-base mb-2">
              Your system hasn&apos;t been scanned yet
            </p>
            <p className="text-neutral-600 text-sm mb-10 max-w-sm mx-auto leading-relaxed">
              ALOA will read your CPU, RAM, disk usage, top processes and junk
              files in real time.
            </p>
            <button
              onClick={handleScan}
              className="bg-white text-black font-medium text-sm rounded-2xl px-10 py-4 hover:bg-neutral-100 transition-colors"
            >
              🔍 &nbsp; Scan My System
            </button>
          </div>
        )}

        {/* ── SCANNING ── */}
        {ui === "scanning" && (
          <div className="text-center py-20">
            <div className="w-10 h-10 border-2 border-sky-400/30 border-t-sky-400 rounded-full animate-spin mx-auto mb-6" />
            <p className="text-white text-sm">Scanning your system...</p>
            <p className="text-neutral-600 text-xs mt-1">
              Reading CPU, RAM, disk and processes
            </p>
          </div>
        )}

        {/* ── SCANNED ── */}
        {(ui === "scanned" || ui === "confirming") && scan && (
          <>
            {/* Vitals */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                {
                  label: "CPU",
                  value: scan.cpu,
                  unit: "%",
                  status: scan.cpu_status,
                },
                {
                  label: "RAM",
                  value: scan.ram,
                  unit: "%",
                  status: scan.ram_status,
                },
                {
                  label: "Disk",
                  value: scan.disk,
                  unit: "%",
                  status: scan.disk_status,
                  sub: `${scan.disk_free} free`,
                },
              ].map((v) => (
                <div
                  key={v.label}
                  className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5"
                >
                  <p className="text-[10px] tracking-widest uppercase text-neutral-500 mb-3">
                    {v.label}
                  </p>
                  <p className="text-3xl font-light leading-none">
                    {v.value}
                    <span className="text-sm text-neutral-500 ml-0.5">
                      {v.unit}
                    </span>
                  </p>
                  <div className="h-[3px] bg-white/[0.06] rounded-full mt-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${STATUS_BAR[v.status]}`}
                      style={{ width: `${v.value}%` }}
                    />
                  </div>
                  <p className={`text-[11px] mt-2 ${STATUS_COLOR[v.status]}`}>
                    {STATUS_LABEL[v.status]}
                    {v.sub ? ` · ${v.sub}` : ""}
                  </p>
                </div>
              ))}
            </div>

            {/* AI Insight */}
            <div className="bg-sky-400/[0.04] border border-sky-400/15 rounded-2xl p-5 mb-4 flex gap-4 items-start">
              <span className="text-lg shrink-0 mt-0.5">💡</span>
              <div>
                <p className="text-[10px] tracking-widest uppercase text-sky-400 mb-1.5">
                  AI Insight
                </p>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  {scan.insight}
                </p>
              </div>
            </div>

            {/* Top Processes */}
            <p className="text-[10px] tracking-widest uppercase text-neutral-600 mb-3 px-1">
              Top Resource Consumers
            </p>
            <div className="flex flex-col gap-1.5 mb-4">
              {scan.processes.map((proc) => {
                const kState = killing[proc.pid] ?? "idle";
                return (
                  <div
                    key={proc.pid}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors
                      ${
                        kState === "done"
                          ? "bg-white/[0.01] border-white/[0.04] opacity-40"
                          : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]"
                      }`}
                  >
                    <span className="text-[11px] text-neutral-600 w-4 text-center shrink-0">
                      {proc.rank}
                    </span>
                    <span className="flex-1 text-sm text-neutral-200">
                      {proc.name}
                    </span>
                    <span className="text-xs text-neutral-500 min-w-[56px] text-right">
                      {proc.mem_label}
                    </span>
                    <span
                      className={`text-[11px] min-w-[76px] text-right ${IMPACT_COLOR[proc.impact]}`}
                    >
                      {IMPACT_LABEL[proc.impact]}
                    </span>
                    {kState === "idle" && (
                      <button
                        onClick={() => handleKill(proc)}
                        className="text-[11px] text-neutral-500 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1 hover:text-red-400 hover:border-red-400/30 hover:bg-red-400/[0.05] transition-colors shrink-0"
                      >
                        End
                      </button>
                    )}
                    {kState === "killing" && (
                      <div className="w-4 h-4 border border-neutral-600 border-t-white rounded-full animate-spin shrink-0" />
                    )}
                    {kState === "done" && (
                      <span className="text-[11px] text-neutral-600 shrink-0">
                        Ended
                      </span>
                    )}
                    {kState === "error" && (
                      <span className="text-[11px] text-red-400 shrink-0">
                        Failed
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Junk Files */}
            <p className="text-[10px] tracking-widest uppercase text-neutral-600 mb-3 px-1">
              Junk Files
            </p>
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 flex items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <span className="text-2xl">🗑️</span>
                <div>
                  <p className="text-sm font-medium">Temp &amp; Cache Files</p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Windows Temp · User Temp · Prefetch
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <span className="text-xl font-light text-amber-400">
                  {scan.junk_label}
                </span>
                <button
                  onClick={() => setUi("confirming")}
                  className="text-sm text-red-400 bg-red-400/[0.08] border border-red-400/20 rounded-xl px-4 py-2 hover:bg-red-400/15 transition-colors"
                >
                  Clean Up →
                </button>
              </div>
            </div>

            {/* Rescan */}
            <div className="text-center">
              <button
                onClick={handleScan}
                className="text-xs text-neutral-600 hover:text-white border border-white/[0.06] hover:border-white/15 rounded-full px-5 py-2 transition-colors"
              >
                ↺ Rescan
              </button>
            </div>

            {/* ── CONFIRM CLEANUP OVERLAY ── */}
            {ui === "confirming" && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-50">
                <div className="bg-[#111] border border-red-400/20 rounded-2xl p-6 w-full max-w-sm">
                  <p className="text-base font-medium mb-2">
                    🗑️ &nbsp;Clean up {scan.junk_label} of junk?
                  </p>
                  <p className="text-sm text-neutral-400 leading-relaxed mb-6">
                    ALOA will delete temp files from Windows Temp, User Temp and
                    Prefetch.
                    <br />
                    <span className="text-neutral-300">
                      Your documents, photos and apps are{" "}
                      <strong>not touched</strong>.
                    </span>
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={handleCleanup}
                      className="flex-1 bg-red-400 text-black font-semibold text-sm rounded-xl py-3 hover:bg-red-300 transition-colors"
                    >
                      Yes, free up {scan.junk_label}
                    </button>
                    <button
                      onClick={() => setUi("scanned")}
                      className="flex-1 border border-white/10 text-neutral-400 hover:text-white text-sm rounded-xl py-3 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── CLEANING ── */}
        {ui === "cleaning" && (
          <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-sky-400 animate-pulse shrink-0" />
              <span className="text-sm text-neutral-400">Cleaning...</span>
            </div>
            <div className="px-5 py-5 space-y-4">
              {cleanSteps.map((step, i) => (
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
                  </div>
                  <div>
                    <p className="text-sm text-white">{step.message}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {step.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ERROR ── */}
        {ui === "error" && (
          <div className="border border-red-500/20 rounded-2xl p-6 bg-red-500/[0.03]">
            <div className="flex items-start gap-3 mb-4">
              <span className="text-red-400 text-xl shrink-0">⚠</span>
              <div>
                <p className="text-white font-medium">Something went wrong</p>
                <p className="text-sm text-neutral-400 mt-1">{errorMsg}</p>
              </div>
            </div>
            <button
              onClick={() => setUi("idle")}
              className="w-full border border-white/10 text-neutral-400 hover:text-white text-sm rounded-xl py-3 transition-colors"
            >
              Try again
            </button>
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}
