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

interface ScanResult {
  session_id: string;
  project_type: string;
  file_count: number;
  run_command: string;
  entry_point: string;
  file_tree: FileNode[];
}

interface DiffLine {
  type: "hunk" | "removed" | "added" | "ctx";
  text: string;
  orig: number | null;
  fix: number | null;
}

// ── Chat message types ────────────────────────────────────────────────────────
type MsgKind =
  | { kind: "text"; text: string }
  | { kind: "terminal"; lines: string[]; cmd: string }
  | { kind: "error_card"; errorType: string; file: string; message: string; trace: string; raw: string }
  | { kind: "diff"; fixFile: string; explanation: string; diff: DiffLine[]; applied?: boolean; rejected?: boolean }
  | { kind: "success"; title: string; detail: string }
  | { kind: "action_row"; actions: { label: string; id: string; variant: "sky" | "ghost" | "green" | "red" }[] };

interface ChatMessage {
  role: "ai" | "user";
  parts: MsgKind[];
  id: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
let msgId = 0;
function makeMsg(role: "ai" | "user", ...parts: MsgKind[]): ChatMessage {
  return { role, parts, id: ++msgId };
}

function extColor(ext: string): string {
  if ([".py"].includes(ext)) return "#60a5fa";
  if ([".js", ".jsx"].includes(ext)) return "#fbbf24";
  if ([".ts", ".tsx"].includes(ext)) return "#818cf8";
  if ([".html", ".htm"].includes(ext)) return "#fb923c";
  if ([".json"].includes(ext)) return "#34d399";
  return "rgba(255,255,255,0.4)";
}

// ── Diff renderer ─────────────────────────────────────────────────────────────
function DiffView({ diff, fixFile, onAccept, onReject, applied, rejected }: {
  diff: DiffLine[]; fixFile: string;
  onAccept: () => void; onReject: () => void;
  applied?: boolean; rejected?: boolean;
}) {
  const added   = diff.filter(d => d.type === "added").length;
  const removed = diff.filter(d => d.type === "removed").length;

  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, overflow: "hidden", marginTop: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 14px", background: "#111", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <span style={{ fontFamily: "monospace", fontSize: "0.74rem", color: "rgba(255,255,255,0.4)" }}>{fixFile}</span>
        <span style={{ display: "flex", gap: 8, fontSize: "0.72rem" }}>
          <span style={{ color: "#10b981" }}>+{added}</span>
          <span style={{ color: "#f43f5e" }}>−{removed}</span>
        </span>
      </div>
      <div style={{ fontFamily: "monospace", fontSize: "0.76rem", lineHeight: "1.9", maxHeight: 280, overflowY: "auto" }}>
        {diff.map((line, i) => {
          if (line.type === "hunk") return (
            <div key={i} style={{ padding: "2px 14px", background: "rgba(139,92,246,0.05)", color: "rgba(139,92,246,0.5)", fontSize: "0.68rem" }}>
              {line.text}
            </div>
          );
          const bg    = line.type === "removed" ? "rgba(244,63,94,0.07)"  : line.type === "added" ? "rgba(16,185,129,0.07)"  : "transparent";
          const mark  = line.type === "removed" ? "−" : line.type === "added" ? "+" : " ";
          const mCol  = line.type === "removed" ? "#f43f5e" : line.type === "added" ? "#10b981" : "rgba(255,255,255,0.1)";
          const tCol  = line.type === "removed" ? "#fda4af" : line.type === "added" ? "#6ee7b7" : "rgba(255,255,255,0.35)";
          return (
            <div key={i} style={{ display: "flex", background: bg }}>
              <div style={{ width: 36, padding: "0 8px", textAlign: "right", color: "rgba(255,255,255,0.15)", fontSize: "0.68rem", flexShrink: 0, borderRight: "1px solid rgba(255,255,255,0.05)", userSelect: "none" }}>{line.orig ?? ""}</div>
              <div style={{ width: 36, padding: "0 8px", textAlign: "right", color: "rgba(255,255,255,0.15)", fontSize: "0.68rem", flexShrink: 0, borderRight: "1px solid rgba(255,255,255,0.05)", userSelect: "none" }}>{line.fix ?? ""}</div>
              <div style={{ width: 16, textAlign: "center", flexShrink: 0, color: mCol }}>{mark}</div>
              <div style={{ padding: "0 10px", flex: 1, whiteSpace: "pre", color: tCol }}>{line.text}</div>
            </div>
          );
        })}
      </div>
      {/* Accept / reject */}
      {!applied && !rejected ? (
        <div style={{ display: "flex", gap: 8, padding: "12px 14px", borderTop: "1px solid rgba(255,255,255,0.06)", background: "#0a0a0a", alignItems: "center" }}>
          <button onClick={onAccept} style={{ padding: "7px 16px", borderRadius: 7, border: "1px solid rgba(16,185,129,0.25)", background: "rgba(16,185,129,0.1)", color: "#10b981", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" }}>✓ Apply fix</button>
          <button onClick={onReject} style={{ padding: "7px 16px", borderRadius: 7, border: "1px solid rgba(244,63,94,0.2)", background: "rgba(244,63,94,0.08)", color: "#f43f5e", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" }}>✕ Reject</button>
          <span style={{ marginLeft: "auto", fontSize: "0.68rem", color: "rgba(255,255,255,0.18)" }}>backup → {fixFile}.bak</span>
        </div>
      ) : applied ? (
        <div style={{ padding: "10px 14px", borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(16,185,129,0.05)", color: "#4ade80", fontSize: "0.76rem", fontWeight: 600 }}>✓ Applied</div>
      ) : (
        <div style={{ padding: "10px 14px", borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(244,63,94,0.04)", color: "#f43f5e", fontSize: "0.76rem" }}>✕ Rejected</div>
      )}
    </div>
  );
}

// ── Terminal block ────────────────────────────────────────────────────────────
function TermBlock({ lines, cmd }: { lines: string[]; cmd: string }) {
  return (
    <div style={{ background: "#050505", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, overflow: "hidden", marginTop: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "#0e0e0e" }}>
        {["#ff5f56","#febc2e","#27c93f"].map(c => <div key={c} style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />)}
        <span style={{ marginLeft: 4, fontSize: "0.68rem", color: "rgba(255,255,255,0.2)", fontFamily: "monospace" }}>{cmd}</span>
      </div>
      <div style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: "0.76rem", lineHeight: 1.9, maxHeight: 200, overflowY: "auto" }}>
        {lines.map((line, i) => {
          const isErr = /error|traceback|exception|failed|cannot/i.test(line);
          const isOk  = /running|serving|ready|compiled|success/i.test(line);
          return (
            <div key={i} style={{
              color: isErr ? "#fb7185" : isOk ? "#34d399" : "rgba(255,255,255,0.5)",
              background: isErr ? "rgba(244,63,94,0.06)" : "transparent",
              borderLeft: isErr ? "2px solid #f43f5e" : "none",
              paddingLeft: isErr ? 8 : 0,
              display: "block",
            }}>{line}</div>
          );
        })}
      </div>
    </div>
  );
}

// ── Error card ────────────────────────────────────────────────────────────────
function ErrorCard({ errorType, file, message, trace, onFix }: {
  errorType: string; file: string; message: string; trace: string;
  onFix: () => void;
}) {
  return (
    <div style={{ background: "rgba(244,63,94,0.05)", border: "1px solid rgba(244,63,94,0.18)", borderRadius: 10, padding: "14px 16px", marginTop: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#f43f5e" }}>{errorType || "Error"}</span>
        {file && <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", fontFamily: "monospace", marginLeft: "auto" }}>{file}</span>}
      </div>
      <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#fff", marginBottom: 6, lineHeight: 1.3 }}>{message}</div>
      {trace && <div style={{ fontFamily: "monospace", fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", whiteSpace: "pre-wrap", maxHeight: 80, overflow: "hidden" }}>{trace.slice(0, 300)}</div>}
      <div style={{ marginTop: 12 }}>
        <button onClick={onFix} style={{ padding: "8px 18px", borderRadius: 7, border: "none", background: "#38bdf8", color: "#000", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" }}>
          🔧 Fix this
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CodeHealerPage() {
  const [loaded, setLoaded] = useState(false);
  const [folderPath, setFolderPath] = useState("");
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [runCmd, setRunCmd] = useState("");
  const [editingCmd, setEditingCmd] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputVal, setInputVal] = useState("");
  const [busy, setBusy] = useState(false);
  const [pageError, setPageError] = useState("");

  // diff pending apply tracking
  const [, setPendingDiffMsgId] = useState<number | null>(null);
  const [appliedMsgIds, setAppliedMsgIds] = useState<Set<number>>(new Set());
  const [rejectedMsgIds, setRejectedMsgIds] = useState<Set<number>>(new Set());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addMsg = useCallback((msg: ChatMessage) => {
    setMessages(prev => [...prev, msg]);
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const appendAIPart = useCallback((part: MsgKind) => {
    setMessages(prev => {
      const last = prev[prev.length - 1];
      if (last && last.role === "ai") {
        return [...prev.slice(0, -1), { ...last, parts: [...last.parts, part] }];
      }
      return [...prev, makeMsg("ai", part)];
    });
  }, []);

  // ── Browse folder ────────────────────────────────────────────────────────────
  const browseFolder = async () => {
    setPageError("");
    try {
      const res = await fetch(`${API}/api/code-healer/browse-folder`);
      if (!res.ok) {
        setPageError("Could not open folder picker — make sure backend is running on port 8000.");
        return;
      }
      const data = await res.json();
      if (data.path) {
        setFolderPath(data.path);
      }
      // if cancelled (empty path), just do nothing silently
    } catch {
      setPageError("Backend not reachable. Start it with: uvicorn backend.server:app --port 8000");
    }
  };

  // ── Scan + load project ──────────────────────────────────────────────────────
  const loadProject = async () => {
    if (!folderPath.trim()) return;
    setScanning(true);
    setPageError("");
    try {
      const res = await fetch(`${API}/api/code-healer/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: folderPath }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.detail || "Scan failed");
      }
      const data: ScanResult = await res.json();
      setScanResult(data);
      setRunCmd(data.run_command);
      setLoaded(true);
      setMessages([
        makeMsg("ai",
          { kind: "text", text: `I've loaded **${folderPath.split(/[\\/]/).pop()}** — **${data.file_count} source files** detected as a **${data.project_type}** project.${data.run_command ? `\n\nRun command: \`${data.run_command}\`` : ""}` },
          { kind: "text", text: "What would you like to do? You can run the project, describe a bug, ask about the code, or paste an error." }
        ),
      ]);
    } catch (e: unknown) {
      setPageError(e instanceof Error ? e.message : "Scan failed");
    } finally {
      setScanning(false);
    }
  };

  // ── Run project ──────────────────────────────────────────────────────────────
  const runProject = useCallback(async (session: ScanResult, cmd: string) => {
    if (busy) return;
    setBusy(true);
    addMsg(makeMsg("user", { kind: "text", text: `Run the project` }));

    const termLines: string[] = [`▸ ${cmd}`];
    const termMsg = makeMsg("ai", { kind: "terminal", lines: [...termLines], cmd });
    addMsg(termMsg);

    try {
      const res = await fetch(`${API}/api/code-healer/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: folderPath, run_command: cmd, session_id: session.session_id }),
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let errorText = "";
      let success = false;
      const outputLines: string[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() || "";
        for (const part of parts) {
          if (!part.startsWith("data:")) continue;
          const ev = JSON.parse(part.slice(5).trim());
          if (ev.type === "step") {
            outputLines.push(`▸ ${ev.message}`);
          } else if (ev.type === "success") {
            outputLines.push(...(ev.output || "").split("\n").filter(Boolean));
            success = true;
          } else if (ev.type === "error_found") {
            outputLines.push(...(ev.output || "").split("\n").filter(Boolean));
            errorText = ev.error_text || ev.output || "";
          }
        }
      }

      // Update the terminal message with real lines
      setMessages(prev => prev.map(m =>
        m.id === termMsg.id
          ? { ...m, parts: [{ kind: "terminal" as const, lines: outputLines, cmd }] }
          : m
      ));

      if (errorText) {
        // Parse error
        const errMatch = errorText.match(/(\w*Error|\w*Exception)/);
        const fileMatch = errorText.match(/File ["']?([^"'\n,]+\.(?:py|js|ts|rb|php))["']?,?\s*line\s*(\d+)/i);
        const msgLine = errorText.split("\n").find(l => /error:|exception:/i.test(l))?.trim()
          || errorText.split("\n").filter(Boolean).pop()?.trim()
          || "An error occurred";

        const errPart: MsgKind = {
          kind: "error_card",
          errorType: errMatch?.[0] || "Error",
          file: fileMatch ? `${fileMatch[1]} : ${fileMatch[2]}` : "",
          message: msgLine.replace(/.*(?:Error|Exception):\s*/i, "").slice(0, 120),
          trace: errorText,
          raw: errorText,
        };
        addMsg(makeMsg("ai", errPart));
      } else if (success) {
        addMsg(makeMsg("ai",
          { kind: "success", title: "No errors detected", detail: "Project ran cleanly. Anything else to fix?" }
        ));
      }
    } catch {
      addMsg(makeMsg("ai", { kind: "text", text: "Failed to run project. Check that the backend is running." }));
    } finally {
      setBusy(false);
    }
  }, [busy, folderPath, addMsg]);

  // ── Ask AI to fix ─────────────────────────────────────────────────────────────
  const askFix = useCallback(async (errorText: string) => {
    if (!scanResult || busy) return;
    setBusy(true);
    addMsg(makeMsg("ai", { kind: "text", text: "Analyzing the error and generating a fix…" }));

    try {
      const res = await fetch(`${API}/api/code-healer/fix`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: folderPath, error_text: errorText, session_id: scanResult.session_id }),
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() || "";
        for (const part of parts) {
          if (!part.startsWith("data:")) continue;
          const ev = JSON.parse(part.slice(5).trim());
          if (ev.type === "fix_ready") {
            const newMsg = makeMsg("ai",
              { kind: "text", text: ev.explanation?.slice(0, 400) || "Found the issue — here's the fix:" },
              { kind: "diff", fixFile: ev.fix_file, explanation: ev.explanation, diff: ev.diff }
            );
            addMsg(newMsg);
            setPendingDiffMsgId(newMsg.id);
          } else if (ev.type === "no_fix") {
            addMsg(makeMsg("ai", { kind: "text", text: ev.message + "\n\n" + (ev.explanation || "") }));
          } else if (ev.type === "error") {
            addMsg(makeMsg("ai", { kind: "text", text: `Sorry — ${ev.message}` }));
          }
        }
      }
    } catch {
      addMsg(makeMsg("ai", { kind: "text", text: "Failed to generate fix. Try again." }));
    } finally {
      setBusy(false);
    }
  }, [scanResult, busy, folderPath, addMsg]);

  // ── Apply fix ─────────────────────────────────────────────────────────────────
  const applyFix = useCallback(async (msgId: number) => {
    if (!scanResult) return;
    try {
      const res = await fetch(`${API}/api/code-healer/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: scanResult.session_id }),
      });
      if (!res.ok) throw new Error((await res.json()).detail);
      const data = await res.json();
      setAppliedMsgIds(prev => { const s = new Set(prev); s.add(msgId); return s; });
      addMsg(makeMsg("ai",
        { kind: "success", title: "Fix applied", detail: data.message },
        { kind: "text", text: "Want me to run the project again to confirm it's fixed?" }
      ));
      setPendingDiffMsgId(null);
    } catch (e: unknown) {
      addMsg(makeMsg("ai", { kind: "text", text: `Couldn't apply: ${e instanceof Error ? e.message : "unknown error"}` }));
    }
  }, [scanResult, addMsg]);

  const rejectFix = useCallback((msgId: number) => {
    setRejectedMsgIds(prev => { const s = new Set(prev); s.add(msgId); return s; });
    addMsg(makeMsg("ai", { kind: "text", text: "Fix rejected. Tell me what's wrong with it, or describe the problem differently and I'll try again." }));
    setPendingDiffMsgId(null);
  }, [addMsg]);

  // ── Chat / free-form input ────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    if (!inputVal.trim() || !scanResult || busy) return;
    const text = inputVal.trim();
    setInputVal("");
    addMsg(makeMsg("user", { kind: "text", text }));

    // Detect intent
    const lower = text.toLowerCase();
    if (/^run(\s+it|s)?$|run.*project|start/i.test(lower)) {
      await runProject(scanResult, runCmd);
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`${API}/api/code-healer/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: scanResult.session_id, message: text }),
      });
      const data = await res.json();
      const reply: string = data.reply || "";

      // Check if AI returned a fix in the chat reply
      if (reply.includes("FIX_FILE:") && reply.includes("FIXED_CODE:")) {
        await askFix(text);
      } else {
        addMsg(makeMsg("ai", { kind: "text", text: reply }));
      }
    } catch {
      addMsg(makeMsg("ai", { kind: "text", text: "Sorry, something went wrong." }));
    } finally {
      setBusy(false);
    }
  }, [inputVal, scanResult, busy, addMsg, runProject, runCmd, askFix]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // ── Render a message part ─────────────────────────────────────────────────────
  const renderPart = (part: MsgKind, msgId: number, idx: number) => {
    switch (part.kind) {
      case "text":
        return (
          <div key={idx} style={{ fontSize: "0.88rem", lineHeight: 1.75, color: "rgba(255,255,255,0.78)", whiteSpace: "pre-wrap" }}>
            {part.text
              .replace(/\*\*(.+?)\*\*/g, "〈b〉$1〈/b〉")
              .replace(/`(.+?)`/g, "〈c〉$1〈/c〉")
              .split(/(〈b〉.*?〈\/b〉|〈c〉.*?〈\/c〉)/g)
              .map((seg, si) => {
                if (seg.startsWith("〈b〉")) return <strong key={si} style={{ color: "#fff" }}>{seg.slice(3, -4)}</strong>;
                if (seg.startsWith("〈c〉")) return <code key={si} style={{ fontFamily: "monospace", fontSize: "0.8rem", background: "rgba(56,189,248,0.08)", color: "#a5f3fc", padding: "1px 5px", borderRadius: 4 }}>{seg.slice(3, -4)}</code>;
                return seg;
              })}
          </div>
        );
      case "terminal":
        return <TermBlock key={idx} lines={part.lines} cmd={part.cmd} />;
      case "error_card":
        return (
          <ErrorCard key={idx}
            errorType={part.errorType} file={part.file}
            message={part.message} trace={part.trace}
            onFix={() => askFix(part.raw)} />
        );
      case "diff":
        return (
          <DiffView key={idx}
            diff={part.diff} fixFile={part.fixFile}
            onAccept={() => applyFix(msgId)}
            onReject={() => rejectFix(msgId)}
            applied={appliedMsgIds.has(msgId)}
            rejected={rejectedMsgIds.has(msgId)} />
        );
      case "success":
        return (
          <div key={idx} style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.18)", borderRadius: 10, padding: "12px 16px", marginTop: 10 }}>
            <span style={{ fontSize: "1.1rem" }}>✦</span>
            <div>
              <div style={{ fontWeight: 600, color: "#4ade80", fontSize: "0.88rem" }}>{part.title}</div>
              <div style={{ fontSize: "0.76rem", color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{part.detail}</div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // ── HERO (before load) ────────────────────────────────────────────────────────
  if (!loaded) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#080808" }}>
        <Navbar />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", textAlign: "center" }}>

          {/* Badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(56,189,248,0.07)", border: "1px solid rgba(56,189,248,0.15)", color: "#38bdf8", fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", padding: "5px 14px", borderRadius: 999, marginBottom: 28 }}>
            🩺 Code Healer · Feature 06
          </div>

          {/* Headline */}
          <h1 style={{ fontSize: "2.6rem", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-1.5px", color: "#fff", marginBottom: 12, maxWidth: 560 }}>
            Your AI<br />
            <span style={{ color: "#38bdf8" }}>pair programmer</span><br />
            for broken code
          </h1>
          <p style={{ fontSize: "1rem", color: "rgba(255,255,255,0.4)", maxWidth: 440, lineHeight: 1.7, marginBottom: 48 }}>
            Load your project. Describe the problem or just run it.<br />
            Healer finds the bug, writes the fix, shows you the diff.
          </p>

          {/* Load card */}
          <div style={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "28px 32px", width: "100%", maxWidth: 560, textAlign: "left", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent,rgba(56,189,248,0.3),transparent)" }} />
            <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", marginBottom: 10, letterSpacing: "0.05em" }}>Select your project folder</div>

            {/* Browse button row */}
            <div style={{ display: "flex", gap: 10, alignItems: "stretch", marginBottom: 10 }}>
              <button onClick={browseFolder}
                style={{ flex: 1, padding: "14px 20px", borderRadius: 10, border: "1px solid rgba(56,189,248,0.2)", background: "rgba(56,189,248,0.07)", color: "#38bdf8", fontSize: "0.88rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: "1.2rem" }}>📁</span>
                <div style={{ textAlign: "left" }}>
                  <div>Browse Folder</div>
                  <div style={{ fontSize: "0.68rem", color: "rgba(56,189,248,0.5)", fontWeight: 400, marginTop: 1 }}>Opens file explorer</div>
                </div>
              </button>
            </div>

            {/* OR divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
              <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em" }}>OR PASTE PATH</span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
            </div>

            {/* Manual path input */}
            <input
              type="text"
              value={folderPath}
              onChange={e => setFolderPath(e.target.value)}
              placeholder="e.g. C:\Users\you\Projects\my-app"
              style={{
                width: "100%", boxSizing: "border-box",
                background: "#1a1a1a", border: `1px solid ${folderPath ? "rgba(56,189,248,0.3)" : "rgba(255,255,255,0.08)"}`,
                borderRadius: 10, padding: "12px 16px", fontSize: "0.84rem",
                fontFamily: "monospace", color: folderPath ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.3)",
                outline: "none", marginBottom: 16, transition: "border 0.2s",
              }}
            />

            {pageError && (
              <div style={{ color: "#f43f5e", fontSize: "0.78rem", marginBottom: 12, padding: "8px 12px", background: "rgba(244,63,94,0.06)", borderRadius: 7, border: "1px solid rgba(244,63,94,0.15)" }}>{pageError}</div>
            )}

            <button onClick={loadProject} disabled={!folderPath.trim() || scanning}
              style={{ width: "100%", padding: 15, borderRadius: 10, border: "none", cursor: folderPath.trim() && !scanning ? "pointer" : "not-allowed", background: folderPath.trim() && !scanning ? "#38bdf8" : "rgba(56,189,248,0.3)", color: "#000", fontSize: "0.9rem", fontWeight: 800, letterSpacing: "-0.3px" }}>
              {scanning ? "⏳ Scanning project…" : "Heal my code →"}
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ── MAIN APP (chat layout) ────────────────────────────────────────────────────
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#080808", overflow: "hidden" }}>
      {/* Top bar */}
      <div style={{ height: 52, background: "#0a0a0a", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", padding: "0 24px", gap: 14, flexShrink: 0 }}>
        <span style={{ fontSize: "0.82rem", fontWeight: 800, letterSpacing: "-0.3px", color: "#fff" }}>
          ALOA <span style={{ color: "#38bdf8" }}>·</span> healer
        </span>
        <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.06)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 7, background: "#141414", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6, padding: "4px 10px", fontSize: "0.74rem", color: "rgba(255,255,255,0.4)" }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981" }} />
          <strong style={{ color: "rgba(255,255,255,0.8)" }}>{folderPath.split(/[\\/]/).pop()}</strong>
          <span style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{folderPath}</span>
        </div>
        <button onClick={() => { setLoaded(false); setScanResult(null); setMessages([]); setFolderPath(""); }}
          style={{ marginLeft: "auto", padding: "5px 12px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "rgba(255,255,255,0.4)", fontSize: "0.74rem", cursor: "pointer" }}>
          ↩ Change project
        </button>
      </div>

      {/* Body: left + right */}
      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", flex: 1, overflow: "hidden" }}>

        {/* ── LEFT PANEL ── */}
        <div style={{ background: "#0a0a0a", borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Project info */}
          <div style={{ padding: "18px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#fff", marginBottom: 2 }}>{folderPath.split(/[\\/]/).pop()}</div>
            <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", fontFamily: "monospace", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{folderPath}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 6, padding: "3px 9px", fontSize: "0.7rem", color: "rgba(255,255,255,0.5)" }}>
                <strong style={{ color: "rgba(255,255,255,0.8)" }}>{scanResult?.project_type}</strong>
              </div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 6, padding: "3px 9px", fontSize: "0.7rem", color: "rgba(255,255,255,0.5)" }}>
                <strong style={{ color: "rgba(255,255,255,0.8)" }}>{scanResult?.file_count}</strong> files
              </div>
            </div>
          </div>

          {/* File tree */}
          <div style={{ padding: "12px 16px 6px", fontSize: "0.63rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.2)" }}>Files</div>
          <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 12px" }}>
            {scanResult?.file_tree.map((node, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "4px 8px", paddingLeft: 8 + node.depth * 12,
                borderRadius: 6, fontSize: "0.75rem",
                color: "rgba(255,255,255,0.4)",
              }}>
                <span style={{ opacity: 0.5, width: 12, textAlign: "center", fontSize: "0.7rem" }}>
                  {node.type === "dir" ? "▾" : "≋"}
                </span>
                <span style={{ color: node.ext ? extColor(node.ext) : "rgba(255,255,255,0.4)" }}>{node.name}</span>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div style={{ padding: 12, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: 8 }}>
            {/* Run command display + edit */}
            <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "8px 10px" }}>
              <div style={{ fontSize: "0.63rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.2)", marginBottom: 4 }}>Run command</div>
              {editingCmd ? (
                <div style={{ display: "flex", gap: 6 }}>
                  <input value={runCmd} onChange={e => setRunCmd(e.target.value)}
                    style={{ flex: 1, background: "#1a1a1a", border: "1px solid rgba(56,189,248,0.3)", borderRadius: 5, padding: "4px 8px", fontSize: "0.74rem", fontFamily: "monospace", color: "#10b981", outline: "none" }} />
                  <button onClick={() => setEditingCmd(false)} style={{ padding: "4px 8px", borderRadius: 5, border: "none", background: "#38bdf8", color: "#000", fontSize: "0.7rem", fontWeight: 700, cursor: "pointer" }}>OK</button>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "#10b981" }}>{runCmd || "not detected"}</span>
                  <button onClick={() => setEditingCmd(true)} style={{ padding: "2px 7px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "rgba(255,255,255,0.3)", fontSize: "0.65rem", cursor: "pointer" }}>edit</button>
                </div>
              )}
            </div>

            <button onClick={() => scanResult && runProject(scanResult, runCmd)} disabled={busy}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.07)", background: "#0f0f0f", cursor: "pointer", color: "rgba(255,255,255,0.65)", fontSize: "0.78rem", fontWeight: 600, transition: "all 0.15s" }}>
              <span>▶</span>
              <div style={{ textAlign: "left" }}>
                <div>Run &amp; watch</div>
                <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.3)", marginTop: 1 }}>Auto-detect errors</div>
              </div>
            </button>
          </div>
        </div>

        {/* ── RIGHT: CHAT ── */}
        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Chat topbar */}
          <div style={{ padding: "14px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 12, flexShrink: 0, background: "#0a0a0a" }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 0 3px rgba(16,185,129,0.15)" }} />
            <div>
              <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "#fff" }}>Code Healer</div>
              <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.3)" }}>
                {folderPath.split(/[\\/]/).pop()} · {scanResult?.project_type} · {scanResult?.file_count} files
              </div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: 20 }}>
            {messages.map(msg => (
              <div key={msg.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, flexDirection: msg.role === "user" ? "row-reverse" : "row" }}>
                {/* Avatar */}
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: msg.role === "ai" ? "0.85rem" : "0.75rem", fontWeight: 700,
                  background: msg.role === "ai"
                    ? "linear-gradient(135deg,rgba(56,189,248,0.2),rgba(139,92,246,0.2))"
                    : "rgba(56,189,248,0.1)",
                  border: `1px solid ${msg.role === "ai" ? "rgba(56,189,248,0.2)" : "rgba(56,189,248,0.15)"}`,
                  color: msg.role === "ai" ? "#38bdf8" : "#38bdf8",
                }}>
                  {msg.role === "ai" ? "∿" : "U"}
                </div>

                {/* Bubble */}
                <div style={{
                  background: msg.role === "ai" ? "#0f0f0f" : "rgba(56,189,248,0.07)",
                  border: `1px solid ${msg.role === "ai" ? "rgba(255,255,255,0.07)" : "rgba(56,189,248,0.12)"}`,
                  borderRadius: msg.role === "ai" ? "4px 12px 12px 12px" : "12px 4px 12px 12px",
                  padding: "14px 18px",
                  maxWidth: 680,
                  display: "flex", flexDirection: "column", gap: 8,
                }}>
                  {msg.parts.map((part, idx) => renderPart(part, msg.id, idx))}
                </div>
              </div>
            ))}

            {busy && (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,rgba(56,189,248,0.2),rgba(139,92,246,0.2))", border: "1px solid rgba(56,189,248,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#38bdf8", fontWeight: 700 }}>∿</div>
                <div style={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "4px 12px 12px 12px", padding: "12px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 14, height: 14, border: "2px solid rgba(56,189,248,0.2)", borderTopColor: "#38bdf8", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  <span style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.4)" }}>thinking…</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,0.06)", background: "#0a0a0a", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 10, background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "10px 10px 10px 16px" }}>
              <textarea
                ref={inputRef}
                rows={1}
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={handleKey}
                disabled={busy}
                placeholder="Ask anything, describe a bug, or say 'run it'…"
                style={{ flex: 1, background: "transparent", border: "none", outline: "none", resize: "none", fontSize: "0.9rem", color: "rgba(255,255,255,0.8)", lineHeight: 1.5, fontFamily: "inherit", minHeight: 22, maxHeight: 120 }}
              />
              <button onClick={handleSend} disabled={busy || !inputVal.trim()}
                style={{ width: 36, height: 36, borderRadius: 8, border: "none", background: busy || !inputVal.trim() ? "rgba(56,189,248,0.3)" : "#38bdf8", color: "#000", fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, flexShrink: 0 }}>
                ↑
              </button>
            </div>
            {/* Hint chips */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
              {["▶ Run project", "🔍 Find bugs", "📖 Explain this file", "🧹 Fix all errors"].map(chip => (
                <button key={chip} onClick={() => { setInputVal(chip.replace(/^[^\s]+\s/, "")); inputRef.current?.focus(); }}
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 5, padding: "3px 9px", cursor: "pointer", color: "rgba(255,255,255,0.3)", fontSize: "0.72rem", transition: "all 0.15s" }}>
                  {chip}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
