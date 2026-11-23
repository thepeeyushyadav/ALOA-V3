"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import { API_BASE_URL } from "@/lib/api";

const API = API_BASE_URL;

// ── Types ─────────────────────────────────────────────────────────────────────
interface FileNode {
  name: string;
  type: "file" | "dir";
  depth: number;
  path: string;
  ext?: string;
}

interface DiffLine {
  type: "hunk" | "removed" | "added" | "ctx";
  text: string;
  orig: number | null;
  fix: number | null;
}

// ── Chat Message Types ────────────────────────────────────────────────────────
type MsgKind =
  | { kind: "text"; text: string }
  | { kind: "reading"; files: string[] }
  | {
      kind: "diff";
      fixFile: string;
      diff: DiffLine[];
      explanation: string;
      applied?: boolean;
      rejected?: boolean;
    }
  | { kind: "applied"; file: string; message: string }
  | { kind: "pushed"; repoUrl: string; branch: string }
  | { kind: "error"; text: string };

interface ChatMessage {
  role: "ai" | "user";
  parts: MsgKind[];
  id: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
let _msgId = 0;
function makeMsg(role: "ai" | "user", ...parts: MsgKind[]): ChatMessage {
  return { role, parts, id: ++_msgId };
}

function extColor(ext = ""): string {
  if ([".py"].includes(ext)) return "#60a5fa";
  if ([".js", ".jsx"].includes(ext)) return "#fbbf24";
  if ([".ts", ".tsx"].includes(ext)) return "#818cf8";
  if ([".html", ".htm"].includes(ext)) return "#fb923c";
  if ([".json"].includes(ext)) return "#34d399";
  if ([".css", ".scss"].includes(ext)) return "#f472b6";
  return "rgba(255,255,255,0.4)";
}

function extractExplanation(raw: string): string {
  let cleaned = raw.replace(/```[\s\S]*?```/g, "");
  cleaned = cleaned.replace(
    /(FILE|FIX_FILE|SEARCH|REPLACE|FULL_REWRITE|READ_FILE):.*/gi,
    ""
  );
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n").trim();
  return cleaned || "Changes ready.";
}

function extractReadFiles(raw: string): string[] {
  const matches = raw.match(/READ_FILE:\s*(.+?)(?:\n|$)/gi);
  if (!matches) return [];
  return matches.map((m) =>
    m.replace(/READ_FILE:\s*/i, "").trim().replace(/[`*]/g, "")
  );
}

// ── DiffView Component ───────────────────────────────────────────────────────
function DiffView({
  diff,
  fixFile,
  onAccept,
  onReject,
  applied,
  rejected,
}: {
  diff: DiffLine[];
  fixFile: string;
  onAccept: () => void;
  onReject: () => void;
  applied?: boolean;
  rejected?: boolean;
}) {
  const added = diff.filter((d) => d.type === "added").length;
  const removed = diff.filter((d) => d.type === "removed").length;

  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 10,
        overflow: "hidden",
        marginTop: 10,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "9px 14px",
          background: "#111",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <span
          style={{
            fontFamily: "monospace",
            fontSize: "0.74rem",
            color: "rgba(255,255,255,0.4)",
          }}
        >
          {fixFile}
        </span>
        <span style={{ display: "flex", gap: 8, fontSize: "0.72rem" }}>
          <span style={{ color: "#10b981" }}>+{added}</span>
          <span style={{ color: "#f43f5e" }}>−{removed}</span>
        </span>
      </div>

      {/* Diff Lines */}
      <div
        className="no-scrollbar"
        style={{
          fontFamily: "monospace",
          fontSize: "0.74rem",
          lineHeight: "1.85",
          maxHeight: 300,
          overflowY: "auto",
        }}
      >
        {diff.slice(0, 200).map((line, i) => {
          if (line.type === "hunk")
            return (
              <div
                key={i}
                style={{
                  padding: "2px 14px",
                  background: "rgba(56,189,248,0.05)",
                  color: "rgba(56,189,248,0.5)",
                  fontSize: "0.68rem",
                }}
              >
                {line.text}
              </div>
            );
          const bg =
            line.type === "removed"
              ? "rgba(244,63,94,0.07)"
              : line.type === "added"
              ? "rgba(16,185,129,0.07)"
              : "transparent";
          const mark =
            line.type === "removed" ? "−" : line.type === "added" ? "+" : " ";
          const mCol =
            line.type === "removed"
              ? "#f43f5e"
              : line.type === "added"
              ? "#10b981"
              : "rgba(255,255,255,0.1)";
          const tCol =
            line.type === "removed"
              ? "#fda4af"
              : line.type === "added"
              ? "#6ee7b7"
              : "rgba(255,255,255,0.35)";
          return (
            <div key={i} style={{ display: "flex", background: bg }}>
              <div
                style={{
                  width: 34,
                  padding: "0 6px",
                  textAlign: "right",
                  color: "rgba(255,255,255,0.15)",
                  fontSize: "0.66rem",
                  flexShrink: 0,
                  borderRight: "1px solid rgba(255,255,255,0.05)",
                  userSelect: "none",
                }}
              >
                {line.orig ?? ""}
              </div>
              <div
                style={{
                  width: 34,
                  padding: "0 6px",
                  textAlign: "right",
                  color: "rgba(255,255,255,0.15)",
                  fontSize: "0.66rem",
                  flexShrink: 0,
                  borderRight: "1px solid rgba(255,255,255,0.05)",
                  userSelect: "none",
                }}
              >
                {line.fix ?? ""}
              </div>
              <div
                style={{
                  width: 16,
                  textAlign: "center",
                  flexShrink: 0,
                  color: mCol,
                }}
              >
                {mark}
              </div>
              <div
                className="no-scrollbar"
                style={{
                  padding: "0 10px",
                  flex: 1,
                  whiteSpace: "pre",
                  color: tCol,
                  overflowX: "auto",
                }}
              >
                {line.text}
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Bar */}
      {!applied && !rejected && (
        <div
          style={{
            display: "flex",
            gap: 8,
            padding: "10px 14px",
            background: "#111",
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <button
            onClick={onAccept}
            style={{
              flex: 1,
              padding: "8px 0",
              borderRadius: 7,
              border: "none",
              background: "#10b981",
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.8rem",
              cursor: "pointer",
            }}
          >
            ✓ Accept Fix
          </button>
          <button
            onClick={onReject}
            style={{
              flex: 1,
              padding: "8px 0",
              borderRadius: 7,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "transparent",
              color: "rgba(255,255,255,0.5)",
              fontWeight: 600,
              fontSize: "0.8rem",
              cursor: "pointer",
            }}
          >
            ✕ Deny
          </button>
        </div>
      )}
      {applied && (
        <div
          style={{
            padding: "9px 14px",
            background: "rgba(16,185,129,0.08)",
            borderTop: "1px solid rgba(16,185,129,0.15)",
            color: "#10b981",
            fontWeight: 600,
            fontSize: "0.78rem",
          }}
        >
          ✓ Fix Applied Successfully
        </div>
      )}
      {rejected && (
        <div
          style={{
            padding: "9px 14px",
            background: "rgba(244,63,94,0.06)",
            borderTop: "1px solid rgba(244,63,94,0.12)",
            color: "#f43f5e",
            fontWeight: 600,
            fontSize: "0.78rem",
          }}
        >
          ✕ Changes Denied
        </div>
      )}
    </div>
  );
}

// ── File Tree ─────────────────────────────────────────────────────────────────
function FileTree({ files }: { files: FileNode[] }) {
  return (
    <div
      className="no-scrollbar"
      style={{ overflowY: "auto", maxHeight: "calc(100vh - 200px)" }}
    >
      {files.map((f, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "3px 8px",
            paddingLeft: 8 + f.depth * 14,
            borderRadius: 4,
          }}
        >
          {f.type === "dir" ? (
            <span style={{ fontSize: "0.72rem" }}>📂</span>
          ) : (
            <span
              style={{
                fontSize: "0.66rem",
                fontWeight: 700,
                color: extColor(f.ext),
                fontFamily: "monospace",
                minWidth: 26,
              }}
            >
              {f.ext?.replace(".", "").toUpperCase() || "—"}
            </span>
          )}
          <span
            style={{
              fontSize: "0.73rem",
              color:
                f.type === "dir"
                  ? "rgba(255,255,255,0.6)"
                  : "rgba(255,255,255,0.75)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {f.name}
          </span>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function CloudHealerPage() {
  // ── State ──
  const [connected, setConnected] = useState(false);
  const [repoUrl, setRepoUrl] = useState("");
  const [pat, setPat] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState("");

  const [sessionId, setSessionId] = useState("");
  const [repoName, setRepoName] = useState("");
  const [branch, setBranch] = useState("");
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [fileCount, setFileCount] = useState(0);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  // Track which diff messages have been acted on
  const [appliedDiffs, setAppliedDiffs] = useState<Set<number>>(new Set());
  const [rejectedDiffs, setRejectedDiffs] = useState<Set<number>>(new Set());

  // Push state
  const [canPush, setCanPush] = useState(false);
  const [showPushModal, setShowPushModal] = useState(false);
  const [commitMsg, setCommitMsg] = useState("");
  const [pushing, setPushing] = useState(false);
  const [pushError, setPushError] = useState("");
  const [showGuide, setShowGuide] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-focus input
  useEffect(() => {
    if (connected && !sending) inputRef.current?.focus();
  }, [connected, sending]);

  // ── Connect ─────────────────────────────────────────────────────────────
  const handleConnect = useCallback(async () => {
    if (!repoUrl.trim() || !pat.trim()) return;
    setConnecting(true);
    setConnectError("");
    try {
      const res = await fetch(`${API}/api/cloud-healer/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo_url: repoUrl.trim(), pat: pat.trim() }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.detail || "Connection failed.");
      }
      const data = await res.json();
      setSessionId(data.session_id);
      setRepoName(data.repo_name);
      setBranch(data.branch);
      setFileTree(data.file_tree || []);
      setFileCount(data.file_count || 0);
      setCommitMsg(`fix: [ALOA V3] Auto-healed bug in ${data.repo_name}`);
      setConnected(true);
      setMessages([
        makeMsg(
          "ai",
          {
            kind: "text",
            text: `🤖 Cloud Healer Agent Ready!\n\nRepository "${data.repo_name}" cloned — ${data.file_count} source files detected on branch "${data.branch}".\n\nYou can:\n• Paste error logs from your deployment\n• Describe what's broken in plain English\n• Ask questions about your code\n• Request any code changes you need\n\nLet's fix it!`,
          }
        ),
      ]);
    } catch (err: unknown) {
      setConnectError(err instanceof Error ? err.message : "Connection failed.");
    } finally {
      setConnecting(false);
    }
  }, [repoUrl, pat]);

  // ── Send Message ────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || !sessionId || sending) return;

    // Add user message
    setMessages((prev) => [...prev, makeMsg("user", { kind: "text", text })]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch(`${API}/api/cloud-healer/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, message: text }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.detail || "AI request failed.");
      }
      const data = await res.json();

      const parts: MsgKind[] = [];

      // Extract reading info from raw response
      const readFiles = extractReadFiles(data.reply || "");
      if (readFiles.length > 0) {
        parts.push({ kind: "reading", files: readFiles });
      }

      if (data.has_fix && data.diff && data.diff.length > 0) {
        // AI found a fix — show explanation + diff
        const explanation = extractExplanation(data.reply || "");
        parts.push({
          kind: "diff",
          fixFile: data.fix_file || "unknown",
          diff: data.diff,
          explanation,
        });
      } else {
        // No fix — just show the AI's response text
        const explanation = extractExplanation(data.reply || "");
        parts.push({ kind: "text", text: explanation || data.reply || "No response from AI." });
      }

      setMessages((prev) => [...prev, makeMsg("ai", ...parts)]);
    } catch (err: unknown) {
      setMessages((prev) => [
        ...prev,
        makeMsg("ai", {
          kind: "error",
          text: err instanceof Error ? err.message : "Something went wrong.",
        }),
      ]);
    } finally {
      setSending(false);
    }
  }, [input, sessionId, sending]);

  // ── Accept Fix ──────────────────────────────────────────────────────────
  const handleAccept = useCallback(
    async (msgId: number) => {
      try {
        const res = await fetch(`${API}/api/cloud-healer/apply`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId }),
        });
        if (!res.ok) {
          const e = await res.json();

          // If syntax error — auto retry
          if (e.detail && e.detail.toLowerCase().includes("syntax error")) {
            setMessages((prev) => [
              ...prev,
              makeMsg("ai", {
                kind: "text",
                text: `⚠️ ${e.detail}\n\n🔄 Asking AI to fix the syntax error...`,
              }),
            ]);
            // Send retry
            const retryRes = await fetch(`${API}/api/cloud-healer/chat`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                session_id: sessionId,
                message: `[SYSTEM] Your previous fix could not be applied. Here is the error:\n\n${e.detail}\n\nPlease carefully re-read the file, fix your mistake, and provide the corrected SEARCH/REPLACE or FULL_REWRITE block.\nRemember: SEARCH blocks must match the file content EXACTLY.`,
              }),
            });
            if (retryRes.ok) {
              const retryData = await retryRes.json();
              const parts: MsgKind[] = [];
              if (retryData.has_fix && retryData.diff?.length > 0) {
                parts.push({
                  kind: "diff",
                  fixFile: retryData.fix_file || "unknown",
                  diff: retryData.diff,
                  explanation: extractExplanation(retryData.reply || ""),
                });
              } else {
                parts.push({
                  kind: "text",
                  text:
                    extractExplanation(retryData.reply || "") ||
                    "Could not produce a valid fix on retry.",
                });
              }
              setMessages((prev) => [...prev, makeMsg("ai", ...parts)]);
            }
            return;
          }

          throw new Error(e.detail || "Apply failed.");
        }

        const data = await res.json();
        setAppliedDiffs((prev) => new Set(prev).add(msgId));
        setCanPush(true);
        setMessages((prev) => [
          ...prev,
          makeMsg("ai", {
            kind: "applied",
            file: data.message || "Fix applied.",
            message: "Ready to push to GitHub! Click the ⬆ Push button above, or type 'push'.",
          }),
        ]);
      } catch (err: unknown) {
        setMessages((prev) => [
          ...prev,
          makeMsg("ai", {
            kind: "error",
            text: err instanceof Error ? err.message : "Apply failed.",
          }),
        ]);
      }
    },
    [sessionId]
  );

  // ── Deny Fix ────────────────────────────────────────────────────────────
  const handleDeny = useCallback((msgId: number) => {
    setRejectedDiffs((prev) => new Set(prev).add(msgId));
    setMessages((prev) => [
      ...prev,
      makeMsg("ai", {
        kind: "text",
        text: "Changes denied. No files were modified. Tell me what else you'd like me to try.",
      }),
    ]);
  }, []);

  // ── Push ────────────────────────────────────────────────────────────────
  const handlePush = useCallback(async () => {
    if (!commitMsg.trim()) return;
    setPushing(true);
    setPushError("");
    try {
      const res = await fetch(`${API}/api/cloud-healer/push`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          commit_message: commitMsg.trim(),
        }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.detail || "Push failed.");
      }
      const data = await res.json();
      setShowPushModal(false);
      setCanPush(false);
      setMessages((prev) => [
        ...prev,
        makeMsg("ai", {
          kind: "pushed",
          repoUrl: data.repo_url || repoUrl,
          branch: data.branch || branch,
        }),
      ]);
    } catch (err: unknown) {
      setPushError(err instanceof Error ? err.message : "Push failed.");
    } finally {
      setPushing(false);
    }
  }, [sessionId, commitMsg, repoUrl, branch]);

  // ── Disconnect ──────────────────────────────────────────────────────────
  const handleDisconnect = useCallback(() => {
    if (sessionId) {
      fetch(`${API}/api/cloud-healer/session/${sessionId}`, {
        method: "DELETE",
      }).catch(() => {});
    }
    setConnected(false);
    setSessionId("");
    setMessages([]);
    setRepoName("");
    setBranch("");
    setFileTree([]);
    setCanPush(false);
    setAppliedDiffs(new Set());
    setRejectedDiffs(new Set());
  }, [sessionId]);

  // ── Handle Enter key (Shift+Enter = newline) ───────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      // Check for push command
      if (input.trim().toLowerCase() === "push" && canPush) {
        setShowPushModal(true);
        setInput("");
      } else {
        handleSend();
      }
    }
  };

  // ══════════════════════════════════════════════════════════════════════
  // RENDER — CONNECT SCREEN
  // ══════════════════════════════════════════════════════════════════════
  if (!connected) {
    return (
      <div style={{ minHeight: "100vh", background: "#0A0A0A", color: "#fff" }}>
        <Navbar />
        <div
          style={{
            maxWidth: 580,
            margin: "0 auto",
            padding: "80px 24px 60px",
          }}
        >
          {/* Badge */}
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <span
              style={{
                display: "inline-block",
                padding: "5px 16px",
                borderRadius: 20,
                border: "1px solid rgba(56,189,248,0.3)",
                background: "rgba(56,189,248,0.07)",
                color: "#38bdf8",
                fontSize: "0.75rem",
                fontWeight: 600,
                letterSpacing: "0.08em",
                marginBottom: 20,
              }}
            >
              ☁️ CLOUD HEALER
            </span>
            <h1
              style={{
                fontSize: "clamp(1.6rem,4vw,2.2rem)",
                fontWeight: 800,
                marginBottom: 10,
              }}
            >
              Fix Your Deployed App
            </h1>
            <p
              style={{
                color: "rgba(255,255,255,0.45)",
                fontSize: "0.9rem",
                lineHeight: 1.6,
                maxWidth: 400,
                margin: "0 auto",
              }}
            >
              Connect your GitHub repo. Chat with the AI agent. It reads your
              code, fixes the bugs, and pushes the fix — all from here.
            </p>
          </div>

          {/* Form */}
          <div
            style={{
              background: "#111",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 14,
              padding: "28px 24px",
            }}
          >
            <div style={{ marginBottom: 18 }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.45)",
                  marginBottom: 7,
                  letterSpacing: "0.06em",
                }}
              >
                GITHUB REPO URL
              </label>
              <input
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/username/repo"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "#0A0A0A",
                  color: "#fff",
                  fontSize: "0.85rem",
                  outline: "none",
                  boxSizing: "border-box",
                }}
                onKeyDown={(e) => e.key === "Enter" && handleConnect()}
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 7,
                }}
              >
                <label
                  style={{
                    display: "block",
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    color: "rgba(255,255,255,0.45)",
                    letterSpacing: "0.06em",
                  }}
                >
                  PERSONAL ACCESS TOKEN
                </label>
                <button
                  type="button"
                  onClick={() => setShowGuide(!showGuide)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#38bdf8",
                    fontSize: "0.72rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: 0,
                    fontWeight: 600,
                  }}
                >
                  <span>{showGuide ? "✕ Close Guide" : "❓ How to get a Token?"}</span>
                </button>
              </div>

              <input
                value={pat}
                onChange={(e) => setPat(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                type="password"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "#0A0A0A",
                  color: "#fff",
                  fontSize: "0.85rem",
                  outline: "none",
                  boxSizing: "border-box",
                }}
                onKeyDown={(e) => e.key === "Enter" && handleConnect()}
              />

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 6,
                }}
              >
                <span
                  style={{
                    fontSize: "0.68rem",
                    color: "rgba(255,255,255,0.35)",
                  }}
                >
                  Requires <strong style={{ color: "rgba(255,255,255,0.6)" }}>repo</strong> (Read &amp; Write) permission to clone and push code.
                </span>
                {!showGuide && (
                  <button
                    type="button"
                    onClick={() => setShowGuide(true)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#38bdf8",
                      fontSize: "0.68rem",
                      cursor: "pointer",
                      textDecoration: "underline",
                      padding: 0,
                    }}
                  >
                    View steps
                  </button>
                )}
              </div>

              {/* ── Professional Step-by-Step PAT Guide ── */}
              {showGuide && (
                <div
                  style={{
                    marginTop: 14,
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid rgba(56, 189, 248, 0.25)",
                    borderRadius: 10,
                    padding: "16px 18px",
                    fontSize: "0.8rem",
                    lineHeight: 1.6,
                    color: "rgba(255,255,255,0.85)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderBottom: "1px solid rgba(255,255,255,0.08)",
                      paddingBottom: 10,
                      marginBottom: 12,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: "1rem" }}>🔑</span>
                      <div>
                        <span style={{ fontWeight: 700, color: "#fff", fontSize: "0.82rem" }}>
                          How to generate your GitHub PAT
                        </span>
                        <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.4)" }}>
                          Takes less than 1 minute
                        </div>
                      </div>
                    </div>
                    <a
                      href="https://github.com/settings/tokens/new?scopes=repo&description=ALOA%20Cloud%20Healer"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: "5px 12px",
                        background: "#38bdf8",
                        color: "#000",
                        borderRadius: 6,
                        fontWeight: 700,
                        fontSize: "0.72rem",
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      ⚡ 1-Click Setup ↗
                    </a>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <span
                        style={{
                          background: "rgba(56,189,248,0.15)",
                          color: "#38bdf8",
                          borderRadius: "50%",
                          width: 18,
                          height: 18,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          flexShrink: 0,
                          marginTop: 2,
                        }}
                      >
                        1
                      </span>
                      <div style={{ fontSize: "0.76rem" }}>
                        In GitHub, click your <strong>Profile photo (top right)</strong> → select{" "}
                        <strong style={{ color: "#fff" }}>Settings</strong>.
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <span
                        style={{
                          background: "rgba(56,189,248,0.15)",
                          color: "#38bdf8",
                          borderRadius: "50%",
                          width: 18,
                          height: 18,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          flexShrink: 0,
                          marginTop: 2,
                        }}
                      >
                        2
                      </span>
                      <div style={{ fontSize: "0.76rem" }}>
                        Scroll down the left sidebar to the very bottom → click{" "}
                        <strong style={{ color: "#38bdf8" }}>Developer settings</strong>.
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <span
                        style={{
                          background: "rgba(56,189,248,0.15)",
                          color: "#38bdf8",
                          borderRadius: "50%",
                          width: 18,
                          height: 18,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          flexShrink: 0,
                          marginTop: 2,
                        }}
                      >
                        3
                      </span>
                      <div style={{ fontSize: "0.76rem" }}>
                        Click <strong>Personal access tokens</strong> → <strong>Tokens (classic)</strong> →{" "}
                        <strong>Generate new token</strong> → <strong>Generate new token (classic)</strong>.
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <span
                        style={{
                          background: "rgba(56,189,248,0.15)",
                          color: "#38bdf8",
                          borderRadius: "50%",
                          width: 18,
                          height: 18,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          flexShrink: 0,
                          marginTop: 2,
                        }}
                      >
                        4
                      </span>
                      <div style={{ fontSize: "0.76rem" }}>
                        Set Note to <code style={{ color: "#38bdf8", background: "rgba(255,255,255,0.06)", padding: "1px 5px", borderRadius: 4 }}>ALOA Cloud Healer</code> and under <strong>Select scopes</strong>, check:
                        <div
                          style={{
                            marginTop: 5,
                            background: "rgba(16,185,129,0.08)",
                            border: "1px solid rgba(16,185,129,0.2)",
                            borderRadius: 6,
                            padding: "6px 10px",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            color: "#10b981",
                            fontWeight: 600,
                          }}
                        >
                          <span>✅</span>
                          <span>repo (Full control of private repositories)</span>
                        </div>
                        <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
                          This gives the agent permission to clone code and commit verified fixes back to your repo.
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <span
                        style={{
                          background: "rgba(56,189,248,0.15)",
                          color: "#38bdf8",
                          borderRadius: "50%",
                          width: 18,
                          height: 18,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          flexShrink: 0,
                          marginTop: 2,
                        }}
                      >
                        5
                      </span>
                      <div style={{ fontSize: "0.76rem" }}>
                        Click <strong style={{ color: "#10b981" }}>Generate token</strong> at the bottom. Copy the token (starts with <code style={{ color: "#fbbf24" }}>ghp_...</code>) and paste it into the field above.
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: 12,
                      paddingTop: 10,
                      borderTop: "1px solid rgba(255,255,255,0.06)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: "0.68rem",
                      color: "rgba(255,255,255,0.35)",
                    }}
                  >
                    <span>🛡️ Using Fine-grained tokens? Set <strong>Contents: Read and write</strong>.</span>
                    <button
                      type="button"
                      onClick={() => setShowGuide(false)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "rgba(255,255,255,0.5)",
                        cursor: "pointer",
                        textDecoration: "underline",
                        fontSize: "0.68rem",
                      }}
                    >
                      Got it, close
                    </button>
                  </div>
                </div>
              )}
            </div>

            {connectError && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: "rgba(244,63,94,0.1)",
                  border: "1px solid rgba(244,63,94,0.2)",
                  color: "#f43f5e",
                  fontSize: "0.8rem",
                  marginBottom: 16,
                }}
              >
                {connectError}
              </div>
            )}

            <button
              onClick={handleConnect}
              disabled={connecting || !repoUrl.trim() || !pat.trim()}
              style={{
                width: "100%",
                padding: "12px 0",
                borderRadius: 9,
                border: "none",
                background:
                  connecting || !repoUrl.trim() || !pat.trim()
                    ? "rgba(56,189,248,0.25)"
                    : "#38bdf8",
                color:
                  connecting || !repoUrl.trim() || !pat.trim()
                    ? "rgba(255,255,255,0.4)"
                    : "#000",
                fontWeight: 800,
                fontSize: "0.9rem",
                cursor:
                  connecting || !repoUrl.trim() || !pat.trim()
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {connecting ? "Cloning Repository…" : "Clone & Connect →"}
            </button>
          </div>

          {/* Trust */}
          <div
            style={{
              display: "flex",
              gap: 20,
              justifyContent: "center",
              marginTop: 22,
              flexWrap: "wrap",
            }}
          >
            {[
              "🔒 Token Not Stored",
              "🧹 Auto-Cleaned After",
              "⚡ AI-Powered Agent",
            ].map((t) => (
              <span
                key={t}
                style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)" }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // RENDER — CHAT SCREEN
  // ══════════════════════════════════════════════════════════════════════
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0A0A0A",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Navbar />

      {/* Top Bar */}
      <div
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          padding: "10px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#0d0d0d",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: "0.85rem" }}>☁️</span>
          <span
            style={{
              fontSize: "0.78rem",
              fontWeight: 700,
              color: "#38bdf8",
              background: "rgba(56,189,248,0.1)",
              border: "1px solid rgba(56,189,248,0.2)",
              borderRadius: 6,
              padding: "3px 10px",
            }}
          >
            {repoName}
          </span>
          <span
            style={{
              fontSize: "0.72rem",
              color: "rgba(255,255,255,0.35)",
              fontFamily: "monospace",
            }}
          >
            {branch} · {fileCount} files
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            disabled={!canPush}
            onClick={() => setShowPushModal(true)}
            style={{
              padding: "6px 14px",
              borderRadius: 7,
              border: "none",
              background: canPush
                ? "#38bdf8"
                : "rgba(56,189,248,0.15)",
              color: canPush ? "#000" : "rgba(255,255,255,0.3)",
              fontWeight: 700,
              fontSize: "0.76rem",
              cursor: canPush ? "pointer" : "not-allowed",
            }}
          >
            ⬆ Push to GitHub
          </button>
          <button
            onClick={handleDisconnect}
            style={{
              padding: "6px 12px",
              borderRadius: 7,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "transparent",
              color: "rgba(255,255,255,0.4)",
              fontSize: "0.74rem",
              cursor: "pointer",
            }}
          >
            Disconnect
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar */}
        <div
          className="no-scrollbar"
          style={{
            width: 210,
            borderRight: "1px solid rgba(255,255,255,0.06)",
            background: "#0d0d0d",
            padding: "14px 0",
            flexShrink: 0,
            overflowY: "auto",
          }}
        >
          <div
            style={{
              fontSize: "0.63rem",
              fontWeight: 700,
              color: "rgba(255,255,255,0.3)",
              letterSpacing: "0.1em",
              padding: "0 12px 10px",
            }}
          >
            PROJECT FILES
          </div>
          <FileTree files={fileTree} />
        </div>

        {/* Chat Area */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Messages */}
          <div
            className="no-scrollbar"
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "20px 28px",
            }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  justifyContent:
                    msg.role === "user" ? "flex-end" : "flex-start",
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    maxWidth: msg.role === "user" ? "65%" : "85%",
                    minWidth: 50,
                  }}
                >
                  {/* Role label */}
                  <div
                    style={{
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      color:
                        msg.role === "user"
                          ? "rgba(255,255,255,0.3)"
                          : "#38bdf8",
                      marginBottom: 5,
                      letterSpacing: "0.06em",
                      textAlign: msg.role === "user" ? "right" : "left",
                    }}
                  >
                    {msg.role === "user" ? "YOU" : "CLOUD HEALER"}
                  </div>

                  {/* Parts */}
                  {msg.parts.map((part, pi) => {
                    if (part.kind === "text") {
                      return (
                        <div
                          key={pi}
                          style={{
                            padding: "12px 16px",
                            borderRadius: 10,
                            background:
                              msg.role === "user"
                                ? "rgba(56,189,248,0.12)"
                                : "#111",
                            border: `1px solid ${
                              msg.role === "user"
                                ? "rgba(56,189,248,0.2)"
                                : "rgba(255,255,255,0.08)"
                            }`,
                            fontSize: "0.84rem",
                            lineHeight: 1.7,
                            color: "rgba(255,255,255,0.8)",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                          }}
                        >
                          {part.text}
                        </div>
                      );
                    }

                    if (part.kind === "reading") {
                      return (
                        <div
                          key={pi}
                          style={{
                            padding: "8px 14px",
                            borderRadius: 8,
                            background: "rgba(56,189,248,0.06)",
                            border: "1px solid rgba(56,189,248,0.12)",
                            fontSize: "0.76rem",
                            color: "rgba(56,189,248,0.7)",
                            marginBottom: 8,
                          }}
                        >
                          📖 Read:{" "}
                          {part.files.map((f, fi) => (
                            <code
                              key={fi}
                              style={{
                                background: "rgba(56,189,248,0.1)",
                                padding: "1px 6px",
                                borderRadius: 4,
                                marginLeft: 4,
                                fontSize: "0.72rem",
                              }}
                            >
                              {f}
                            </code>
                          ))}
                        </div>
                      );
                    }

                    if (part.kind === "diff") {
                      const isApplied = appliedDiffs.has(msg.id);
                      const isRejected = rejectedDiffs.has(msg.id);
                      return (
                        <div key={pi}>
                          {part.explanation && (
                            <div
                              style={{
                                padding: "12px 16px",
                                borderRadius: 10,
                                background: "#111",
                                border:
                                  "1px solid rgba(255,255,255,0.08)",
                                fontSize: "0.84rem",
                                lineHeight: 1.7,
                                color: "rgba(255,255,255,0.8)",
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word",
                                marginBottom: 6,
                              }}
                            >
                              {part.explanation.length > 600
                                ? part.explanation.slice(0, 600) + "…"
                                : part.explanation}
                            </div>
                          )}
                          <DiffView
                            diff={part.diff}
                            fixFile={part.fixFile}
                            onAccept={() => handleAccept(msg.id)}
                            onReject={() => handleDeny(msg.id)}
                            applied={isApplied}
                            rejected={isRejected}
                          />
                        </div>
                      );
                    }

                    if (part.kind === "applied") {
                      return (
                        <div
                          key={pi}
                          style={{
                            padding: "14px 18px",
                            borderRadius: 10,
                            background: "rgba(16,185,129,0.08)",
                            border: "1px solid rgba(16,185,129,0.2)",
                            fontSize: "0.84rem",
                            lineHeight: 1.6,
                            color: "#10b981",
                          }}
                        >
                          <div style={{ fontWeight: 700, marginBottom: 4, fontSize: "0.9rem" }}>
                            ✅ {part.file}
                          </div>
                          <div
                            style={{
                              color: "rgba(255,255,255,0.7)",
                              fontSize: "0.78rem",
                              marginBottom: 10,
                            }}
                          >
                            Changes are applied locally! Click below to commit &amp; push live to GitHub:
                          </div>
                          <button
                            onClick={() => setShowPushModal(true)}
                            style={{
                              padding: "8px 18px",
                              borderRadius: 7,
                              border: "none",
                              background: "#38bdf8",
                              color: "#000",
                              fontWeight: 800,
                              fontSize: "0.82rem",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              boxShadow: "0 2px 8px rgba(56,189,248,0.25)",
                            }}
                          >
                            ⬆ Push to GitHub Now →
                          </button>
                        </div>
                      );
                    }

                    if (part.kind === "pushed") {
                      return (
                        <div
                          key={pi}
                          style={{
                            padding: "14px 16px",
                            borderRadius: 10,
                            background: "rgba(56,189,248,0.08)",
                            border: "1px solid rgba(56,189,248,0.15)",
                            fontSize: "0.84rem",
                            lineHeight: 1.6,
                          }}
                        >
                          <div
                            style={{
                              fontWeight: 700,
                              color: "#38bdf8",
                              marginBottom: 4,
                            }}
                          >
                            🚀 Pushed to GitHub!
                          </div>
                          <div
                            style={{
                              color: "rgba(255,255,255,0.5)",
                              fontSize: "0.78rem",
                            }}
                          >
                            Changes are live on{" "}
                            <strong>{part.branch}</strong>. Check your
                            CI/CD for redeployment.
                          </div>
                          <a
                            href={part.repoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: "inline-block",
                              marginTop: 8,
                              padding: "5px 12px",
                              borderRadius: 6,
                              background: "#38bdf8",
                              color: "#000",
                              fontSize: "0.76rem",
                              fontWeight: 700,
                              textDecoration: "none",
                            }}
                          >
                            View on GitHub ↗
                          </a>
                        </div>
                      );
                    }

                    if (part.kind === "error") {
                      return (
                        <div
                          key={pi}
                          style={{
                            padding: "12px 16px",
                            borderRadius: 10,
                            background: "rgba(244,63,94,0.08)",
                            border: "1px solid rgba(244,63,94,0.15)",
                            color: "#f43f5e",
                            fontSize: "0.82rem",
                          }}
                        >
                          ⚠️ {part.text}
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>
              </div>
            ))}

            {/* Thinking indicator */}
            {sending && (
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    color: "#38bdf8",
                    marginBottom: 5,
                    letterSpacing: "0.06em",
                  }}
                >
                  CLOUD HEALER
                </div>
                <div
                  style={{
                    padding: "14px 16px",
                    borderRadius: 10,
                    background: "#111",
                    border: "1px solid rgba(255,255,255,0.08)",
                    fontSize: "0.84rem",
                    color: "rgba(255,255,255,0.4)",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      animation: "spin 1s linear infinite",
                    }}
                  >
                    ⟳
                  </span>
                  Agent is reading your code and thinking…
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input Bar */}
          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.07)",
              padding: "14px 28px",
              background: "#0d0d0d",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "flex-end",
              }}
            >
              <textarea
                ref={inputRef}
                className="no-scrollbar"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Paste error logs, describe what's broken, or ask anything about your code..."
                rows={2}
                disabled={sending}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "#111",
                  color: "#fff",
                  fontSize: "0.84rem",
                  resize: "none",
                  outline: "none",
                  lineHeight: 1.6,
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
              />
              <button
                onClick={handleSend}
                disabled={sending || !input.trim()}
                style={{
                  padding: "10px 20px",
                  borderRadius: 10,
                  border: "none",
                  background:
                    sending || !input.trim()
                      ? "rgba(56,189,248,0.2)"
                      : "#38bdf8",
                  color:
                    sending || !input.trim()
                      ? "rgba(255,255,255,0.3)"
                      : "#000",
                  fontWeight: 700,
                  fontSize: "0.84rem",
                  cursor:
                    sending || !input.trim() ? "not-allowed" : "pointer",
                  flexShrink: 0,
                  height: 42,
                }}
              >
                Send
              </button>
            </div>
            <div
              style={{
                fontSize: "0.66rem",
                color: "rgba(255,255,255,0.2)",
                marginTop: 6,
                display: "flex",
                gap: 16,
              }}
            >
              <span>Enter to send · Shift+Enter for new line</span>
              {canPush && (
                <span style={{ color: "rgba(56,189,248,0.5)" }}>
                  Type &quot;push&quot; to push changes
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Push Modal */}
      {showPushModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "#111",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 14,
              padding: "28px 24px",
              width: 420,
              maxWidth: "90vw",
            }}
          >
            <h3
              style={{
                marginBottom: 14,
                fontWeight: 700,
                fontSize: "1rem",
              }}
            >
              📤 Push to GitHub
            </h3>

            {/* Author info strip */}
            <div
              style={{
                marginBottom: 14,
                padding: "8px 12px",
                background: "rgba(56,189,248,0.06)",
                border: "1px solid rgba(56,189,248,0.15)",
                borderRadius: 8,
                fontSize: "0.72rem",
                color: "rgba(255,255,255,0.7)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 3,
                }}
              >
                <span style={{ color: "rgba(255,255,255,0.4)" }}>Author:</span>
                <span style={{ fontWeight: 600, color: "#38bdf8" }}>
                  ALOA Development Team
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ color: "rgba(255,255,255,0.4)" }}>Email:</span>
                <span style={{ fontFamily: "monospace", color: "#e2e8f0" }}>
                  hello.aloav3@gmail.com
                </span>
              </div>
            </div>

            <label
              style={{
                fontSize: "0.72rem",
                color: "rgba(255,255,255,0.4)",
                display: "block",
                marginBottom: 6,
              }}
            >
              COMMIT TITLE
            </label>
            <input
              value={commitMsg}
              onChange={(e) => setCommitMsg(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handlePush()}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "#0A0A0A",
                color: "#fff",
                fontSize: "0.84rem",
                outline: "none",
                marginBottom: 8,
                boxSizing: "border-box",
              }}
            />
            <div
              style={{
                fontSize: "0.68rem",
                color: "rgba(255,255,255,0.35)",
                marginBottom: 16,
              }}
            >
              ✨ Full ALOA V3 AST verification details will be attached to the commit description automatically.
            </div>
            {pushError && (
              <div
                style={{
                  color: "#f43f5e",
                  fontSize: "0.78rem",
                  marginBottom: 14,
                  padding: "8px 12px",
                  background: "rgba(244,63,94,0.08)",
                  borderRadius: 6,
                }}
              >
                {pushError}
              </div>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={handlePush}
                disabled={pushing || !commitMsg.trim()}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: 8,
                  border: "none",
                  background: "#38bdf8",
                  color: "#000",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                }}
              >
                {pushing ? "Pushing…" : "Push Now"}
              </button>
              <button
                onClick={() => {
                  setShowPushModal(false);
                  setPushError("");
                }}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "transparent",
                  color: "rgba(255,255,255,0.5)",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .no-scrollbar::-webkit-scrollbar,
        textarea::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        .no-scrollbar,
        textarea {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
      `}</style>
    </div>
  );
}
