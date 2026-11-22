/**
 * /frontend/lib/module-simulations.ts
 *
 * Rich, module-specific technical specifications and interactive simulation data
 * for all 10 autonomous modules in ALOA V3.
 */

export interface LogEntry {
  tag: string;
  text: string;
  color: "cyan" | "emerald" | "amber" | "violet" | "rose" | "blue";
}

export interface ModuleSimulation {
  slug: string;
  cliCommand: string;
  specs: {
    model: string;
    latency: string;
    engine: string;
    privacy: string;
  };
  terminalLogs: LogEntry[];
  summaryMetric: string;
}

export const MODULE_SIMULATIONS: Record<string, ModuleSimulation> = {
  "app-manager": {
    slug: "app-manager",
    cliCommand: 'aloa app install "Cursor IDE" --open',
    specs: {
      model: "Groq Llama 3.3 70B",
      latency: "140ms",
      engine: "Winget / PowerShell",
      privacy: "100% Local Machine",
    },
    terminalLogs: [
      {
        tag: "INTENT",
        text: "Action: INSTALL_AND_LAUNCH | Target: Cursor IDE",
        color: "cyan",
      },
      {
        tag: "RESOLVER",
        text: "Mapped to Microsoft Winget manifest ID: Anysphere.Cursor (v0.42.3)",
        color: "blue",
      },
      {
        tag: "DOUBLE-LOCK",
        text: "Safety gate: Awaiting human confirmation to install package... [CONFIRMED]",
        color: "amber",
      },
      {
        tag: "WINGET",
        text: "winget.exe install Anysphere.Cursor --silent --accept-package-agreements",
        color: "violet",
      },
      {
        tag: "EXECUTE",
        text: "PowerShell process spawned PID 18420. Launching Cursor IDE...",
        color: "emerald",
      },
      {
        tag: "COMPLETE",
        text: "Package verified and running. Total execution time: 2.84s",
        color: "emerald",
      },
    ],
    summaryMetric: "10,000+ Winget Packages Supported",
  },
  "system-doctor": {
    slug: "system-doctor",
    cliCommand: "aloa doctor --scan --clean-junk --top 10",
    specs: {
      model: "Groq Llama 3.3 70B",
      latency: "110ms",
      engine: "psutil / Windows Kernel",
      privacy: "Zero Telemetry Upload",
    },
    terminalLogs: [
      {
        tag: "HARDWARE",
        text: "CPU: 18.2% | RAM: 11.4/16 GB (71%) | NVMe: 64% used (312 GB free)",
        color: "cyan",
      },
      {
        tag: "PROCS",
        text: "Ranked top resource consumers: node.exe (2.4 GB RAM), chrome.exe (1.8 GB RAM)",
        color: "blue",
      },
      {
        tag: "JUNK-SCAN",
        text: "Scanned %TEMP%, Windows Temp & Prefetch: 4.82 GB reclaimable cache",
        color: "amber",
      },
      {
        tag: "SAFETY",
        text: "Size preview verified. Confirm deletion of 4.82 GB junk? [CONFIRMED]",
        color: "violet",
      },
      {
        tag: "PURGE",
        text: "shutil.rmtree() executed with non-destructive error handling",
        color: "emerald",
      },
      {
        tag: "STATUS",
        text: "Freed 4.82 GB storage. Thermal & RAM pressure restored to OPTIMAL",
        color: "emerald",
      },
    ],
    summaryMetric: "Avg. 3.2 GB Freed Per Scan",
  },
  "attendance-automator": {
    slug: "attendance-automator",
    cliCommand: 'aloa attendance --sheet "CS301_Nov2026.xlsx" --date "2026-11-21"',
    specs: {
      model: "Groq Llama 3.3 70B",
      latency: "190ms",
      engine: "openpyxl / pandas",
      privacy: "Atomic Local File Lock",
    },
    terminalLogs: [
      {
        tag: "PARSER",
        text: "Workbook parsed: 64 student records identified across active sheet",
        color: "cyan",
      },
      {
        tag: "DATE-MAP",
        text: "Target column resolved: Col 'V' (Header: '21-Nov-2026')",
        color: "blue",
      },
      {
        tag: "FUZZY-NLP",
        text: "Tolerant name matching: 58 Present, 4 Absent, 2 Leave mapped with 100% confidence",
        color: "amber",
      },
      {
        tag: "FILE-LOCK",
        text: "Acquired safe Windows file lock on CS301_Nov2026.xlsx",
        color: "violet",
      },
      {
        tag: "WRITE",
        text: "Writing P/A/L markers with original cell styling preserved",
        color: "emerald",
      },
      {
        tag: "SUCCESS",
        text: "Committed 64 rows in 1.28s. Zero workbook corruption risk",
        color: "emerald",
      },
    ],
    summaryMetric: "60+ Students Marked in <2s",
  },
  "youtube-notes": {
    slug: "youtube-notes",
    cliCommand: 'aloa notes "https://youtube.com/watch?v=k8v9_fL32" --format pdf',
    specs: {
      model: "Groq Llama 3.3 + Gemini",
      latency: "480ms",
      engine: "youtube-transcript-api / LaTeX",
      privacy: "Offline Local PDF Compile",
    },
    terminalLogs: [
      {
        tag: "INGEST",
        text: 'Video ID extracted: k8v9_fL32 ("Distributed Systems & Raft Consensus")',
        color: "cyan",
      },
      {
        tag: "CAPTION",
        text: "Extracted 44 min timestamped transcript (11,280 tokens)",
        color: "blue",
      },
      {
        tag: "SYNTHESIS",
        text: "Structuring executive summary, core formulas, key takeaways & study quiz",
        color: "amber",
      },
      {
        tag: "FORMAT",
        text: "Compiling Markdown to print-ready PDF layout with KaTeX math rendering",
        color: "violet",
      },
      {
        tag: "RENDER",
        text: "Exported: ./notes/Raft_Consensus_Lecture.pdf (1.4 MB)",
        color: "emerald",
      },
      {
        tag: "READY",
        text: "Study notes compiled & launched in default PDF viewer",
        color: "emerald",
      },
    ],
    summaryMetric: "1-Click Structured PDF Export",
  },
  "exam-pilot": {
    slug: "exam-pilot",
    cliCommand: 'aloa exam --region "450,120,800,600" --explain',
    specs: {
      model: "Groq Vision / Gemini 1.5",
      latency: "280ms",
      engine: "OpenCV / mss / OCR",
      privacy: "In-Memory Buffer (No Disk Save)",
    },
    terminalLogs: [
      {
        tag: "SCREEN",
        text: "Captured active bounding region (450, 120, 800, 600) via mss framebuffer",
        color: "cyan",
      },
      {
        tag: "OCR-CV",
        text: 'Text extracted: "Find eigenvalues and eigenvectors of matrix A = [[2, 1], [1, 2]]"',
        color: "blue",
      },
      {
        tag: "REASONING",
        text: "Det(A - λI) = (2-λ)² - 1 = 0 -> λ₁ = 3, λ₂ = 1",
        color: "amber",
      },
      {
        tag: "VERIFY",
        text: "Eigenvector calculation: v₁ = [1, 1]ᵀ for λ=3; v₂ = [1, -1]ᵀ for λ=1",
        color: "violet",
      },
      {
        tag: "HUD-OVERLAY",
        text: "Rendered step-by-step breakdown on non-intrusive floating HUD widget",
        color: "emerald",
      },
      {
        tag: "DISMISS",
        text: "HUD hotkey [Ctrl+Alt+H] active for instant toggle",
        color: "emerald",
      },
    ],
    summaryMetric: "<300ms OCR & Math Resolution",
  },
  "code-healer": {
    slug: "code-healer",
    cliCommand: 'aloa heal ./backend/server.py --run "pytest tests/"',
    specs: {
      model: "Groq Llama 3.3 70B (Code)",
      latency: "360ms",
      engine: "Python AST / pytest / diff",
      privacy: "Local Workspace Diff Only",
    },
    terminalLogs: [
      {
        tag: "WATCHER",
        text: "Subprocess monitoring: ./backend/server.py started with PID 20491",
        color: "cyan",
      },
      {
        tag: "CRASH-CATCH",
        text: "Caught unhandled TypeError at server.py:142: 'NoneType' object has no attribute 'listen'",
        color: "rose",
      },
      {
        tag: "AST-TRACE",
        text: "Analyzing abstract syntax tree: missing null check on optional Redis adapter",
        color: "amber",
      },
      {
        tag: "DIFF-GEN",
        text: "Patch generated: + if not self.adapter: self.adapter = FallbackAdapter()",
        color: "blue",
      },
      {
        tag: "TEST-RUN",
        text: "Executing pytest tests/test_server.py: 18 passed, 0 failed in 0.42s",
        color: "violet",
      },
      {
        tag: "CONFIRM",
        text: "Zero regression verified. Patch preview ready for one-click commit",
        color: "emerald",
      },
    ],
    summaryMetric: "Autonomous Crash-to-Fix Loop",
  },
  "cloud-healer": {
    slug: "cloud-healer",
    cliCommand: 'aloa cloud diagnose --repo "org/app-backend" --run-id 894120',
    specs: {
      model: "Groq Llama 3.3 + OpenRouter",
      latency: "410ms",
      engine: "GitHub REST API / Docker CLI",
      privacy: "Zero Token Storage",
    },
    terminalLogs: [
      {
        tag: "API-FETCH",
        text: "Fetched workflow telemetry for run #894120 (branch: staging)",
        color: "cyan",
      },
      {
        tag: "LOG-ANALYSIS",
        text: "Isolated step 4 'Docker Build' failure: error: corepack not enabled",
        color: "amber",
      },
      {
        tag: "DOCKER-AUDIT",
        text: "Detected Node.js 20 base image requiring explicit corepack pnpm activation",
        color: "blue",
      },
      {
        tag: "PATCH-FILE",
        text: "Updated Dockerfile: inserted 'RUN corepack enable && corepack prepare pnpm@latest'",
        color: "violet",
      },
      {
        tag: "LOCAL-BUILD",
        text: "Simulated build via local Docker engine: image build succeeded (exit 0)",
        color: "emerald",
      },
      {
        tag: "PULL-REQUEST",
        text: "Created draft PR #42 with verified CI build fix and root cause summary",
        color: "emerald",
      },
    ],
    summaryMetric: "Automated GitHub CI/CD Healing",
  },
  "presentation-pilot": {
    slug: "presentation-pilot",
    cliCommand: 'aloa slides "AI Multi-Agent System Architecture" --slides 8',
    specs: {
      model: "Groq Llama 3.3 70B",
      latency: "520ms",
      engine: "python-pptx / PIL",
      privacy: "100% Offline PPTX Build",
    },
    terminalLogs: [
      {
        tag: "OUTLINE",
        text: "Generated narrative structure: 8 slides with logical executive progression",
        color: "cyan",
      },
      {
        tag: "THEME",
        text: "Applied modern high-contrast aesthetic: Dark Obsidian (#0B0F19) + Lilac accents",
        color: "blue",
      },
      {
        tag: "LAYOUT",
        text: "Constructed metric KPI stat callouts, comparison cards & architecture flow",
        color: "amber",
      },
      {
        tag: "PPTX-ENGINE",
        text: "Assembling slides with native shapes, formatted typography & bullet hierarchy",
        color: "violet",
      },
      {
        tag: "RENDER",
        text: "Saved output: ./output/AI_Multi_Agent_Architecture.pptx (2.1 MB)",
        color: "emerald",
      },
      {
        tag: "COMPLETE",
        text: "Ready for presentation in PowerPoint, Keynote, or Google Slides",
        color: "emerald",
      },
    ],
    summaryMetric: "8-12 Slide Decks Built in <5s",
  },
  "resume-engine": {
    slug: "resume-engine",
    cliCommand: 'aloa resume match --resume "cv.pdf" --job "stripe_staff_ai.txt"',
    specs: {
      model: "Groq Llama 3.3 (Career Specialist)",
      latency: "340ms",
      engine: "PyMuPDF / pdfplumber / ATS",
      privacy: "100% Private Offline Processing",
    },
    terminalLogs: [
      {
        tag: "PDF-INGEST",
        text: "Extracted 2-page resume: 4 work experiences, 14 verified technical skills",
        color: "cyan",
      },
      {
        tag: "JD-ANALYZE",
        text: "Target role: Staff AI Engineer at Stripe (Key criteria: Distributed Training, CUDA)",
        color: "blue",
      },
      {
        tag: "ATS-SCORE",
        text: "Baseline match: 68% -> 4 critical skill keyword gaps detected",
        color: "amber",
      },
      {
        tag: "BULLET-BOOST",
        text: "Refactored 5 experience bullets with quantified STAR impact metrics",
        color: "violet",
      },
      {
        tag: "SCORE-BOOST",
        text: "ATS Match Score improved to 96% | Recruiter readability: 9.8/10",
        color: "emerald",
      },
      {
        tag: "EXPORT",
        text: "Generated tailored resume: ./resumes/Stripe_Staff_AI_Tailored.pdf",
        color: "emerald",
      },
    ],
    summaryMetric: "ATS Score Boost from 68% to 96%",
  },
  "aloa-radar": {
    slug: "aloa-radar",
    cliCommand: 'aloa radar brief --category "AI Agents & Autonomous Systems"',
    specs: {
      model: "Groq Llama 3.3 70B",
      latency: "680ms",
      engine: "Feedparser / arXiv / SQLite",
      privacy: "Local SQLite Knowledge Index",
    },
    terminalLogs: [
      {
        tag: "FETCH",
        text: "Queried arXiv AI feeds, GitHub Trending & HackerNews: 142 items retrieved",
        color: "cyan",
      },
      {
        tag: "DEDUP",
        text: "Semantic cosine filter removed 38 duplicate/low-signal announcements",
        color: "blue",
      },
      {
        tag: "CLUSTER",
        text: "Trending cluster: 'Self-Healing Test Suites in Autonomous Coding Agents'",
        color: "amber",
      },
      {
        tag: "SYNTHESIZE",
        text: "AI Professor synthesizing 3-minute actionable executive briefing",
        color: "violet",
      },
      {
        tag: "STORE",
        text: "Indexed 8 key papers with direct PDF links in local SQLite database",
        color: "emerald",
      },
      {
        tag: "DIGEST",
        text: "Daily briefing saved: ./radar/brief_2026-11-21.md. Morning audio ready.",
        color: "emerald",
      },
    ],
    summaryMetric: "140+ Sources Filtered Daily",
  },
};
