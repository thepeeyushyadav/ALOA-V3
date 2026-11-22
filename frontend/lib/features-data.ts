/**
 * /frontend/lib/features-data.ts
 *
 * Single source of truth for all 10 ALOA V3 modules.
 */

export interface FeatureStep {
  title: string;
  body: string;
}

export interface FeatureCapability {
  title: string;
  body: string;
}

export interface Feature {
  slug: string;
  index: string;
  shortName: string;
  fullName: string;
  category: "System" | "Productivity" | "Debugging" | "Deployment" | "Career" | "Intelligence";
  icon: string;
  tagline: string;
  summary: string;
  highlights: [string, string, string];
  overview: string;
  steps: FeatureStep[];
  capabilities: FeatureCapability[];
  provide: string[];
  safety: string;
  tech: string[];
  available: boolean;
}

export const FEATURES: Feature[] = [
  {
    slug: "app-manager",
    index: "01",
    shortName: "App Manager",
    fullName: "App Manager",
    category: "System",
    icon: "AppWindow",
    tagline: "Install, open, and manage apps with natural language",
    summary:
      "Tell ALOA which application you want. It works out the rest and runs the right Windows command for you.",
    highlights: [
      "Install apps through Winget",
      "Open or close any installed app",
      "Silent uninstall with confirmation",
    ],
    overview:
      'App Manager turns plain-language requests into real system actions. Describe what you want, like "install Cursor", "open Chrome" or "remove Spotify", and ALOA\'s AI backbone resolves the intent, picks the action and executes it on your machine.',
    steps: [
      {
        title: "Describe the app",
        body: "Plain language, no package names needed.",
      },
      {
        title: "Intent is resolved",
        body: "The DualModelChain interprets the request, Groq first with automatic fallback to OpenRouter.",
      },
      {
        title: "You confirm",
        body: "Before any install or uninstall, ALOA shows what it will do and waits.",
      },
      {
        title: "ALOA executes",
        body: "Winget installs or removes silently, apps launch via PowerShell, running apps close by process name; failures are explained in plain language.",
      },
    ],
    capabilities: [
      {
        title: "Install",
        body: "Finds the package in Winget and installs silently.",
      },
      {
        title: "Open",
        body: "Launches installed apps by name.",
      },
      {
        title: "Uninstall",
        body: "Removes apps cleanly with an exact-match safeguard.",
      },
      {
        title: "Close",
        body: "Force-closes a running app by process name.",
      },
    ],
    provide: [
      "A plain-language request",
      "Your confirmation before anything is installed or removed",
    ],
    safety:
      "Installs, uninstalls and force-closes always ask for your confirmation first.",
    tech: ["Winget", "PowerShell", "subprocess", "Groq", "OpenRouter"],
    available: true,
  },
  {
    slug: "system-doctor",
    index: "02",
    shortName: "System Insights",
    fullName: "System Insights",
    category: "System",
    icon: "Activity",
    tagline: "Diagnoses your PC health and tells you exactly what to fix",
    summary:
      "A live health check for CPU, memory and disk, with AI-written findings, junk cleanup and a heavy-process killer.",
    highlights: [
      "Live CPU, RAM and disk vitals",
      "Junk cleanup with a size preview",
      "Top resource consumers, ranked",
    ],
    overview:
      "System Insights reads real-time hardware metrics, asks the AI to interpret them and points to the exact processes or files causing trouble. Nothing is deleted or terminated without your say-so.",
    steps: [
      {
        title: "Scan the system",
        body: "psutil reads CPU, memory, disk and the heaviest processes.",
      },
      {
        title: "AI interprets",
        body: "Metrics are summarised and anomalies flagged in plain language.",
      },
      {
        title: "Review the findings",
        body: "A health dashboard plus a ranked list of top consumers.",
      },
      {
        title: "Fix on approval",
        body: "Clear temp files after seeing the size to be freed, or terminate a process you select.",
      },
    ],
    capabilities: [
      {
        title: "Health check",
        body: "CPU, RAM and disk at a glance.",
      },
      {
        title: "Junk cleanup",
        body: "Scans temp, Windows temp and prefetch and reports size before deleting.",
      },
      {
        title: "Process control",
        body: "Lists the top 10 processes by CPU and ends the one you pick.",
      },
      {
        title: "AI insight",
        body: "Short written intel on what is slowing your machine.",
      },
    ],
    provide: [
      "Nothing to start, just run a health check",
      "Your approval before files are cleared or a process is stopped",
    ],
    safety:
      "Cleanup shows the size to be freed and asks first; a process is only terminated when you select it.",
    tech: ["psutil", "shutil", "Groq", "OpenRouter"],
    available: true,
  },
  {
    slug: "attendance-automator",
    index: "03",
    shortName: "Attendance",
    fullName: "Attendance Automator",
    category: "Productivity",
    icon: "ClipboardCheck",
    tagline: "Marks attendance for an entire class in seconds via Excel",
    summary:
      "Point it at your sheet, give the date and who was present, and ALOA fills the right cells and saves the file.",
    highlights: [
      "Works directly on your Excel sheet",
      "Flexible date formats",
      "Writes P / A / L to the right cell",
    ],
    overview:
      "Attendance Automator removes the repetitive cell-by-cell entry. Choose your workbook, pick the date and status columns, and ALOA matches student names and marks the sheet without touching anything else.",
    steps: [
      {
        title: "Choose your sheet",
        body: "Native file dialog, with a preview of the first rows.",
      },
      {
        title: "Map the columns",
        body: "Which holds the date, which holds the status.",
      },
      {
        title: "Give the date and names",
        body: "Any common date format; who was present, absent or on leave.",
      },
      {
        title: "ALOA marks and saves",
        body: "P, A or L written to the right cell, then a file-safe save.",
      },
    ],
    capabilities: [
      {
        title: "Smart date parsing",
        body: "Understands arbitrary date formats and header structures.",
      },
      {
        title: "Name matching across every row",
        body: "Tolerant matching that handles slight typos and formatting differences.",
      },
      {
        title: "Safe save with a file lock",
        body: "Ensures no workbook corruption through atomic file locks.",
      },
      {
        title: "Bulk marking",
        body: "Marks approximately 60 students in under 30 seconds.",
      },
    ],
    provide: [
      "Your Excel attendance sheet (.xlsx)",
      "The date column and the status column",
      "The date to mark and each student's status",
    ],
    safety: "Only the attendance cells for the chosen date are changed.",
    tech: ["pandas", "openpyxl", "tkinter"],
    available: false,
  },
  {
    slug: "youtube-notes",
    index: "04",
    shortName: "YouTube Notes",
    fullName: "YouTube Note Generator",
    category: "Productivity",
    icon: "Video",
    tagline: "Turns any YouTube video into structured PDF notes",
    summary:
      "Paste a lecture link. ALOA reads the transcript, writes structured study notes and hands you a clean PDF.",
    highlights: [
      "Reads the transcript automatically",
      "Structured Markdown notes",
      "Formatted PDF export",
    ],
    overview:
      'Built for lectures and tutorials. It fetches the captions, condenses them into well-organised notes with an AI "professor", and exports both a Markdown file and a ready-to-share PDF.',
    steps: [
      {
        title: "Paste the link",
        body: "The video ID is detected automatically.",
      },
      {
        title: "Transcript is fetched",
        body: "Captions are joined; a clear message appears if none exist.",
      },
      {
        title: "AI writes the notes",
        body: "The transcript is chunked and summarised by Gemini, rotating API keys on rate limits.",
      },
      {
        title: "Get your files",
        body: "A formatted PDF with a title page, plus a Markdown copy.",
      },
    ],
    capabilities: [
      {
        title: "Transcript extraction",
        body: "Fetches official or auto-generated captions cleanly.",
      },
      {
        title: "Chunked summarising",
        body: "Handles multi-hour lectures without context window limits.",
      },
      {
        title: "Dual format output",
        body: "Generates formatted PDF and readable Markdown files.",
      },
      {
        title: "Automatic API key rotation",
        body: "Cycles across keys to avoid quota and rate limitations.",
      },
    ],
    provide: ["A YouTube video link", "A video that has captions"],
    safety:
      "Only reads the video's captions and writes new files; nothing existing is changed.",
    tech: ["youtube-transcript-api", "Gemini", "fpdf2"],
    available: true,
  },
  {
    slug: "exam-pilot",
    index: "05",
    shortName: "Exam Pilot",
    fullName: "Exam Pilot",
    category: "Productivity",
    icon: "ScanText",
    tagline: "Reads a quiz off your screen and answers it",
    summary:
      "Select a region of your screen. ALOA reads the question with OCR, works out the answer and marks it for you.",
    highlights: [
      "On-screen OCR with image clean-up",
      "AI answers multiple-choice questions",
      "Hotkey driven, semi-automatic",
    ],
    overview:
      "Exam Pilot watches a screen region you choose, extracts the text with OCR and asks the AI for the correct option. It is semi-automatic: ALOA selects the answer and you stay in control of moving to the next question.",
    steps: [
      {
        title: "Set the capture region",
        body: "Define the exact rectangle on screen where the quiz appears.",
      },
      {
        title: "Start the timer",
        body: "A short countdown lets you switch to the quiz.",
      },
      {
        title: "The question is read",
        body: "The region is captured, converted to high-contrast greyscale and run through Tesseract OCR.",
      },
      {
        title: "The answer is produced",
        body: "Gemini returns A, B, C or D, rotating keys on rate limits; ALOA selects it and waits for you.",
      },
    ],
    capabilities: [
      {
        title: "Fast region capture",
        body: "Sub-50ms screen region grabber.",
      },
      {
        title: "Adaptive image pre-processing",
        body: "Greyscale and thresholding optimization for OCR clarity.",
      },
      {
        title: "Spam filter",
        body: "Skips captures with too little text automatically.",
      },
      {
        title: "Automatic key rotation",
        body: "Failover protection across multi-model keys.",
      },
    ],
    provide: [
      "The screen region where questions appear",
      "Tesseract-OCR installed",
    ],
    safety:
      "Capture only runs while Exam Pilot is active and can be stopped with the stop hotkey.",
    tech: ["mss", "OpenCV", "pytesseract", "Gemini"],
    available: false,
  },
  {
    slug: "code-healer",
    index: "06",
    shortName: "Code Healer",
    fullName: "Code Healer",
    category: "Debugging",
    icon: "Bug",
    tagline: "Diagnoses and fixes local code autonomously",
    summary:
      "Point it at a project folder. ALOA runs it, catches the crash, writes a patch and applies it after your approval.",
    highlights: [
      "Runs your dev server and captures errors",
      "Three-tier patch matching",
      "Validated before anything is written",
    ],
    overview:
      'Code Healer closes the loop between "it crashed" and "it\'s fixed". It reads your project, starts the dev server in the background, captures the error output, asks the AI for a precise patch and applies it to the right file, only after validating it and getting your approval.',
    steps: [
      {
        title: "Select your project",
        body: "ALOA scans the tree and detects Node.js, Python or Java.",
      },
      {
        title: "Run and capture",
        body: "The dev server starts in the background and is watched for errors.",
      },
      {
        title: "AI proposes a patch",
        body: "File tree, error and stack trace go to Gemini, with OpenRouter fallback.",
      },
      {
        title: "Validate and apply",
        body: "The patch is matched in three tiers: exact, whitespace-tolerant, then fuzzy, and checked before writing.",
      },
      {
        title: "Review and push",
        body: "Accept or deny each change, optionally push to GitHub.",
      },
    ],
    capabilities: [
      {
        title: "Framework detection",
        body: "Identifies project type from signature lockfiles and manifests.",
      },
      {
        title: "Live error capture",
        body: "Streams stdio in background to trap crash traces.",
      },
      {
        title: "Three-tier patching",
        body: "Exact, stripped, and difflib fuzzy algorithms.",
      },
      {
        title: "Syntax validation",
        body: "AST parsing prevents generating broken syntax.",
      },
    ],
    provide: ["A project folder", "Your approval for each change"],
    safety:
      "Every change is shown as a diff and applied only after you accept; invalid patches are rejected.",
    tech: ["subprocess", "ast", "difflib", "Gemini", "OpenRouter", "Git"],
    available: true,
  },
  {
    slug: "cloud-healer",
    index: "07",
    shortName: "Cloud Healer",
    fullName: "Cloud Healer",
    category: "Debugging",
    icon: "CloudCog",
    tagline: "Clones a GitHub repo, patches the bug, and pushes it back",
    summary:
      "Give it a repository and describe the bug or paste the deployment error, and ALOA fixes it and commits to GitHub.",
    highlights: [
      "Works straight from a repo URL",
      "Paste logs or describe the issue in plain English",
      "Commits the fix back to GitHub",
    ],
    overview:
      "Cloud Healer debugs code that isn't on your machine. It clones the repository into a secure workspace, loads the source as context, takes your description or deployment logs, generates a patch, validates it and pushes the commit.",
    steps: [
      {
        title: "Connect a repository",
        body: "URL plus your GitHub token; the last repo is remembered.",
      },
      {
        title: "Clone and learn the project",
        body: "Isolated workspace, source files loaded as context.",
      },
      {
        title: "Describe the problem",
        body: "Paste error logs, describe a change, or ask about the code.",
      },
      {
        title: "Patch, validate, review",
        body: "Same three-tier matching and syntax validation, shown as a diff.",
      },
      {
        title: "Push the fix",
        body: "On approval ALOA commits and pushes so your CI/CD can redeploy.",
      },
    ],
    capabilities: [
      {
        title: "Clean workspace sandbox",
        body: "Isolates clones so host environment is never affected.",
      },
      {
        title: "Conversational debugging",
        body: "Interact naturally with repository context.",
      },
      {
        title: "Safe patching",
        body: "Rejects ambiguous or contradictory code modifications.",
      },
      {
        title: "One-step commit and push",
        body: "Automatic branch and pull-request creation.",
      },
    ],
    provide: [
      "A GitHub repository URL",
      "A GitHub personal access token",
      "An error log or a description of the change",
    ],
    safety:
      "Your token stays on your machine; changes are pushed only after you accept the diff.",
    tech: ["GitHub REST API", "Git", "AWS Bedrock", "ast", "difflib"],
    available: true,
  },
  {
    slug: "auto-deployer",
    index: "08",
    shortName: "Auto-Deployer",
    fullName: "Auto-Deployer",
    category: "Deployment",
    icon: "Rocket",
    tagline: "Detects your framework and deploys to production in one command",
    summary:
      "Select a project. ALOA detects the stack, prepares a plan, pushes to GitHub and ships it to Vercel or Render.",
    highlights: [
      "Automatic framework detection",
      "GitHub repo creation and push",
      "Live URL when the build succeeds",
    ],
    overview:
      "Auto-Deployer handles the whole path from local folder to live URL. It identifies what you're building, drafts a deployment plan for you to approve, creates the repository, pushes the code and triggers the deployment, then watches the build and gives you the link.",
    steps: [
      {
        title: "Set up credentials once",
        body: "GitHub, Vercel or Render tokens, stored encrypted and shown masked.",
      },
      {
        title: "Choose your project",
        body: "Signature files identify Next.js, Django, Flask, Spring Boot or Node.js.",
      },
      {
        title: "Review the plan",
        body: "Platform, build command, start command and env vars to confirm.",
      },
      {
        title: "Push and deploy",
        body: "The GitHub repo is created, code pushed, deployment triggered.",
      },
      {
        title: "Go live",
        body: "Build status is tracked and the live URL shown; if a build fails, an AI advisor suggests fixes.",
      },
    ],
    capabilities: [
      {
        title: "Framework detection",
        body: "Recognizes Next.js, Python frameworks, Java Spring, and Go.",
      },
      {
        title: "GitHub automation",
        body: "Repository creation, remote configuration, and clean push.",
      },
      {
        title: "Multi-platform deploys",
        body: "Native integration with Vercel and Render APIs.",
      },
      {
        title: "AI failure advisor",
        body: "Real-time build diagnosis if deployment logs return non-zero.",
      },
    ],
    provide: [
      "Your project folder",
      "A GitHub personal access token",
      "A Vercel or Render token",
    ],
    safety:
      "Nothing is deployed until you approve the plan; credentials are stored encrypted and displayed masked.",
    tech: [
      "GitHub REST API",
      "Vercel API",
      "Render API",
      "Git",
      "Hugging Face",
      "OpenRouter",
    ],
    available: false,
  },
  {
    slug: "resume-engine",
    index: "09",
    shortName: "Resume Engine",
    fullName: "Resume Engine",
    category: "Career",
    icon: "FileUser",
    tagline: "Builds and scores your resume against any job description",
    summary:
      "Turn raw career notes, a LinkedIn PDF or manual entries into a polished, ATS-friendly resume, and see how it scores against a job description.",
    highlights: [
      "Four ways to build your profile",
      "Three professional templates",
      "ATS score with missing keywords",
    ],
    overview:
      "Resume Engine keeps your career data in one structured profile and renders it into HTML and PDF resumes. Paste a job description and it tells you how well you match, which keywords are missing and what to improve.",
    steps: [
      {
        title: "Create your profile",
        body: "Brain dump, manual entry, LinkedIn PDF import, or load a saved profile.",
      },
      {
        title: "AI structures it",
        body: "Gemini parses text into personal info, summary, skills, experience, projects, education, certifications, achievements.",
      },
      {
        title: "Edit section by section",
        body: "An interactive editor for all eight sections.",
      },
      {
        title: "Generate or analyse",
        body: "Pick ATS Classic, Modern Professional or Creative Two-Column for a PDF, or paste a job description for an ATS analysis.",
      },
    ],
    capabilities: [
      {
        title: "Multi-source import",
        body: "Parses notes, LinkedIn PDFs, or interactive forms.",
      },
      {
        title: "Three templates",
        body: "ATS Classic, Modern Professional, and Creative Two-Column.",
      },
      {
        title: "ATS deep analysis",
        body: "Overall score, keyword match %, missing keywords, and action suggestions.",
      },
      {
        title: "Clean PDF export",
        body: "Pixel-accurate print-ready document rendering.",
      },
    ],
    provide: [
      "Raw notes, a LinkedIn PDF, or manual entries",
      "Optional: a job description",
    ],
    safety: "Profiles are saved locally on your machine as JSON.",
    tech: ["Gemini", "PyPDF2", "WeasyPrint", "pdfkit"],
    available: false,
  },
  {
    slug: "aloa-radar",
    index: "10",
    shortName: "ALOA Radar",
    fullName: "ALOA Radar",
    category: "Intelligence",
    icon: "Radar",
    tagline: "Delivers a synthesized daily tech intelligence briefing",
    summary:
      "A personalised morning brief built from the sources you care about, summarised into five clear sections.",
    highlights: [
      "Six live sources, one brief",
      "Personalised to your tech stack",
      "Cached daily for instant reopening",
    ],
    overview:
      "ALOA Radar reads your watchlist (tech stack, keywords, companies, subreddits, packages), pulls fresh data from across the web in parallel and asks the AI to write a concise five-section briefing. The result is cached so reopening it is instant.",
    steps: [
      {
        title: "Set up your watchlist",
        body: "Optionally starting from your resume.",
      },
      {
        title: "Sources are fetched",
        body: "Hacker News, Dev.to, GitHub Trending, Reddit, Google News, PyPI, in parallel.",
      },
      {
        title: "AI writes the brief",
        body: "Groq summarises into Current Affairs, Tech News, Trending Tech, General Knowledge, Suggestions.",
      },
      {
        title: "Read and refresh",
        body: "Today's brief opens instantly from cache, or force a refresh.",
      },
    ],
    capabilities: [
      {
        title: "Six live sources",
        body: "Streams intelligence across the developer ecosystem.",
      },
      {
        title: "Personalised filtering",
        body: "Removes noise by matching against your stack.",
      },
      {
        title: "Daily cache",
        body: "Instant reopening with background freshness validation.",
      },
      {
        title: "Editable watchlist",
        body: "Customize keywords, companies, and subreddits anytime.",
      },
    ],
    provide: [
      "Your tech stack and keywords",
      "Optional: companies, subreddits, PyPI packages",
    ],
    safety:
      "Only public sources are read, and your watchlist is stored locally.",
    tech: [
      "Groq",
      "BeautifulSoup",
      "Hacker News API",
      "Dev.to API",
      "Reddit JSON",
      "PyPI JSON",
    ],
    available: false,
  },
];
