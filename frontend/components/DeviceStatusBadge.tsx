"use client";

import { useState, useEffect, useCallback } from "react";
import { Laptop, CheckCircle2, AlertCircle, X, Download } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

export interface DeviceStatusBadgeProps {
  variant?: "light" | "dark";
}

export default function DeviceStatusBadge({ variant = "dark" }: DeviceStatusBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPaired, setIsPaired] = useState(false);
  const [hostname, setHostname] = useState<string>("");
  const [pairingCode, setPairingCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Initialize or retrieve browser session ID
  const getSessionId = () => {
    if (typeof window === "undefined") return "";
    let sid = localStorage.getItem("aloa_session_id");
    if (!sid) {
      sid = "sess_" + Math.random().toString(36).substring(2, 12);
      localStorage.setItem("aloa_session_id", sid);
    }
    return sid;
  };

  // Poll device connection status
  const checkStatus = useCallback(async () => {
    const sid = getSessionId();
    if (!sid) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/device/status?session_id=${sid}`);
      if (res.ok) {
        const data = await res.json();
        if (data.online) {
          setIsPaired(true);
          setHostname(data.hostname || "Windows PC");
        } else {
          setIsPaired(false);
        }
      }
    } catch {
      // offline / unreachable
    }
  }, []);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  const handlePair = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pairingCode.trim()) return;
    setError(null);
    setLoading(true);

    const sid = getSessionId();
    try {
      const res = await fetch(`${API_BASE_URL}/api/device/pair`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sid, code: pairingCode.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setIsPaired(true);
        setHostname(data.hostname || "Windows PC");
        setIsOpen(false);
        setPairingCode("");
      } else {
        setError(data.error || "Invalid or expired pairing code.");
      }
    } catch {
      setError("Failed to connect to backend server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem("aloa_session_id");
    setIsPaired(false);
    setHostname("");
    setIsOpen(false);
  };

  return (
    <>
      {/* Navbar Pill */}
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
          isPaired
            ? variant === "light"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100"
              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
            : variant === "light"
              ? "bg-neutral-100 text-neutral-700 border border-neutral-300 hover:bg-neutral-200 hover:text-neutral-900"
              : "bg-white/[0.05] text-neutral-300 border border-white/10 hover:border-white/20"
        }`}
        title="ALOA Windows Companion Connection Status"
      >
        <span
          className={`h-2 w-2 rounded-full ${
            isPaired
              ? "bg-emerald-500 animate-pulse"
              : variant === "light"
                ? "bg-neutral-400"
                : "bg-neutral-500"
          }`}
        />
        <Laptop size={14} />
        <span>{isPaired ? hostname : "Connect Laptop"}</span>
      </button>

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#0F172A] border border-slate-700 rounded-2xl shadow-2xl p-6 text-slate-100">
            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`p-2.5 rounded-xl ${
                  isPaired ? "bg-emerald-500/20 text-emerald-400" : "bg-sky-500/20 text-sky-400"
                }`}
              >
                <Laptop size={24} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">
                  {isPaired ? "Connected Windows Laptop" : "Connect Your Laptop"}
                </h3>
                <p className="text-xs text-slate-400">
                  {isPaired
                    ? "Your computer is ready for local operations"
                    : "Link your PC to execute local features"}
                </p>
              </div>
            </div>

            {isPaired ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                    <CheckCircle2 size={16} />
                    <span>Active Connection Verified</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Device: <strong className="text-white">{hostname}</strong>
                  </p>
                  <p className="text-xs text-slate-400">
                    Operating system actions like App Manager, System Doctor, and Local Code Healing will execute safely on this machine.
                  </p>
                </div>

                <button
                  onClick={handleDisconnect}
                  className="w-full py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-semibold transition-colors"
                >
                  Disconnect Laptop
                </button>
              </div>
            ) : (
              <form onSubmit={handlePair} className="space-y-4">
                <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700 text-xs text-slate-300 space-y-1.5">
                  <p className="font-semibold text-white flex items-center gap-1.5">
                    How it works:
                  </p>
                  <ol className="list-decimal pl-4 space-y-1 text-slate-300">
                    <li>Launch <strong>ALOA Companion Agent</strong> on your Windows laptop.</li>
                    <li>Copy the 6-character pairing code shown on screen.</li>
                    <li>Enter the code below to securely link this browser session.</li>
                  </ol>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    6-Character Pairing Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="e.g. A7B2X9"
                    value={pairingCode}
                    onChange={(e) => setPairingCode(e.target.value.toUpperCase())}
                    className="w-full text-center tracking-widest text-lg font-mono py-2.5 px-4 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-colors uppercase"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || pairingCode.length < 4}
                  className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 disabled:pointer-events-none text-slate-950 font-semibold text-xs transition-all shadow-md shadow-sky-500/20"
                >
                  {loading ? "Verifying..." : "Pair Laptop"}
                </button>

                <div className="text-center pt-2">
                  <a
                    href="https://github.com/thepeeyushyadav/THE-ALOA/releases"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 hover:underline"
                  >
                    <Download size={13} />
                    <span>Download ALOA Companion Agent (.exe)</span>
                  </a>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
