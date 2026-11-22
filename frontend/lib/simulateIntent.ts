/**
 * /frontend/lib/simulateIntent.ts
 *
 * Frontend-side simulated intent parser for ALOA's App Manager.
 * Extracts intent and app name dynamically from user input text
 * so the terminal console reflects real user input rather than hardcoded text.
 *
 * TODO Phase 4: Wire to real WebSocket backend agent (DualModelChain).
 */

export type AppAction =
  | "install"
  | "uninstall"
  | "update"
  | "launch"
  | "search"
  | "list"
  | "unknown";

export interface ParsedCommand {
  action: AppAction;
  appName: string;
  originalInput: string;
  commandSnippet: string;
  requiresConfirmation: boolean;
}

export interface TerminalLogStep {
  text: string;
  type: "info" | "success" | "warning" | "error" | "command" | "agent";
  delayMs?: number;
}

// Known app name canonical formatting
const KNOWN_APPS: Record<string, string> = {
  cursor: "Cursor",
  "vs code": "Visual Studio Code",
  vscode: "Visual Studio Code",
  "visual studio code": "Visual Studio Code",
  spotify: "Spotify",
  chrome: "Google Chrome",
  "google chrome": "Google Chrome",
  firefox: "Mozilla Firefox",
  brave: "Brave Browser",
  discord: "Discord",
  slack: "Slack",
  docker: "Docker Desktop",
  "docker desktop": "Docker Desktop",
  vlc: "VLC Media Player",
  git: "Git for Windows",
  postman: "Postman",
  notion: "Notion",
  obs: "OBS Studio",
  figma: "Figma",
  steam: "Steam",
  telegram: "Telegram Desktop",
  whatsapp: "WhatsApp",
  zoom: "Zoom",
  node: "Node.js (LTS)",
  nodejs: "Node.js (LTS)",
  python: "Python 3.12",
};

/**
 * Parses user input to extract action and target application.
 */
export function parseAppCommand(rawInput: string): ParsedCommand {
  const originalInput = rawInput.trim();
  const lower = originalInput.toLowerCase();

  let action: AppAction = "unknown";

  // Action detection
  if (/\b(install|download|get|add|setup)\b/.test(lower)) {
    action = "install";
  } else if (/\b(uninstall|remove|delete|purge)\b/.test(lower)) {
    action = "uninstall";
  } else if (/\b(update|upgrade|refresh)\b/.test(lower)) {
    action = "update";
  } else if (/\b(launch|open|start|run|exec)\b/.test(lower)) {
    action = "launch";
  } else if (/\b(search|find|lookup|locate)\b/.test(lower)) {
    action = "search";
  } else if (/\b(list|show installed|installed apps|all apps)\b/.test(lower)) {
    action = "list";
  }

  // Extract application name by stripping trigger & filler words
  let cleaned = lower;
  const stripKeywords = [
    "can you",
    "please",
    "could you",
    "i want to",
    "i need to",
    "how to",
    "install",
    "download",
    "uninstall",
    "remove",
    "update",
    "upgrade",
    "launch",
    "open",
    "start",
    "search for",
    "search",
    "find",
    "lookup",
    "the app",
    "application",
    "app",
    "on my laptop",
    "on my machine",
    "on my computer",
    "for me",
    "using winget",
    "with winget",
  ];

  for (const kw of stripKeywords) {
    cleaned = cleaned.replace(new RegExp(`\\b${kw}\\b`, "gi"), " ");
  }

  cleaned = cleaned.replace(/[^\w\s\-\+\.]/g, "").trim();

  // Match known canonical formatting or capitalize words
  let appName = "";
  if (action === "list") {
    appName = "Installed Applications";
  } else if (cleaned.length > 0) {
    if (KNOWN_APPS[cleaned]) {
      appName = KNOWN_APPS[cleaned];
    } else {
      appName = cleaned
        .split(/\s+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    }
  } else {
    appName = action === "search" ? "Popular Applications" : "Requested Application";
  }

  // Generate appropriate Windows PowerShell / Winget command snippet
  let commandSnippet = "";
  let requiresConfirmation = false;

  switch (action) {
    case "install":
      commandSnippet = `winget install --id "${appName}" -e --silent --accept-package-agreements`;
      requiresConfirmation = true;
      break;
    case "uninstall":
      commandSnippet = `winget uninstall --id "${appName}" --silent`;
      requiresConfirmation = true;
      break;
    case "update":
      commandSnippet = `winget upgrade --id "${appName}"`;
      requiresConfirmation = true;
      break;
    case "launch":
      commandSnippet = `Start-Process "${appName}"`;
      requiresConfirmation = false;
      break;
    case "search":
      commandSnippet = `winget search "${appName}"`;
      requiresConfirmation = false;
      break;
    case "list":
      commandSnippet = `winget list`;
      requiresConfirmation = false;
      break;
    default:
      commandSnippet = `# Intent unrecognized: "${originalInput}"`;
      requiresConfirmation = false;
  }

  return {
    action,
    appName,
    originalInput,
    commandSnippet,
    requiresConfirmation,
  };
}

/**
 * Returns a list of sequential terminal steps to animate based on parsed intent.
 */
export function generateSimulationSteps(parsed: ParsedCommand): TerminalLogStep[] {
  const { action, appName, commandSnippet } = parsed;

  switch (action) {
    case "install":
      return [
        { text: `[Agent] Analyzing input intent... (DualModelChain: Groq Llama-3.3-70b)`, type: "agent", delayMs: 300 },
        { text: `[Intent] Action: INSTALL | Target: "${appName}"`, type: "info", delayMs: 400 },
        { text: `[Winget] Querying Windows Package Manager catalog for "${appName}"...`, type: "info", delayMs: 600 },
        { text: `[Winget] Package resolved: ${appName}.Official (Publisher Verified)`, type: "info", delayMs: 500 },
        { text: `[Security] SHA-256 Hash verification: OK (Valid Microsoft Certificate)`, type: "success", delayMs: 400 },
        { text: `[Executing] ${commandSnippet}`, type: "command", delayMs: 800 },
        { text: `[Download] Fetching installer payload (142.8 MB)... [████████████████] 100%`, type: "info", delayMs: 700 },
        { text: `[Install] Running silent setup routines...`, type: "info", delayMs: 600 },
        { text: `✔ Successfully installed ${appName}! Shortcuts registered in Windows Start Menu.`, type: "success", delayMs: 400 },
      ];

    case "uninstall":
      return [
        { text: `[Agent] Analyzing input intent... (DualModelChain: Groq Llama-3.3-70b)`, type: "agent", delayMs: 300 },
        { text: `[Intent] Action: UNINSTALL | Target: "${appName}"`, type: "warning", delayMs: 400 },
        { text: `[Registry] Scanning HKCU & HKLM uninstall keys for "${appName}"...`, type: "info", delayMs: 500 },
        { text: `[Executing] ${commandSnippet}`, type: "command", delayMs: 700 },
        { text: `[Winget] Invoking package removal daemon...`, type: "info", delayMs: 600 },
        { text: `✔ ${appName} was successfully uninstalled and system registry cleaned.`, type: "success", delayMs: 400 },
      ];

    case "update":
      return [
        { text: `[Agent] Analyzing input intent... (DualModelChain: Groq Llama-3.3-70b)`, type: "agent", delayMs: 300 },
        { text: `[Intent] Action: UPDATE | Target: "${appName}"`, type: "info", delayMs: 400 },
        { text: `[Winget] Checking upstream repository version for "${appName}"...`, type: "info", delayMs: 500 },
        { text: `[Update] Found newer release: v1.94.2 (Installed: v1.92.0)`, type: "info", delayMs: 400 },
        { text: `[Executing] ${commandSnippet}`, type: "command", delayMs: 700 },
        { text: `[Patch] Applying delta update packages...`, type: "info", delayMs: 600 },
        { text: `✔ ${appName} has been updated to the latest stable release.`, type: "success", delayMs: 400 },
      ];

    case "launch":
      return [
        { text: `[Agent] Analyzing input intent... (DualModelChain: Groq Llama-3.3-70b)`, type: "agent", delayMs: 300 },
        { text: `[Intent] Action: LAUNCH | Target: "${appName}"`, type: "info", delayMs: 400 },
        { text: `[Path] Locating executable via App Paths and Windows Registry...`, type: "info", delayMs: 400 },
        { text: `[Executing] ${commandSnippet}`, type: "command", delayMs: 500 },
        { text: `✔ Process launched. PID: ${Math.floor(1000 + Math.random() * 9000)} (${appName})`, type: "success", delayMs: 300 },
      ];

    case "search":
      return [
        { text: `[Agent] Analyzing input intent... (DualModelChain: Groq Llama-3.3-70b)`, type: "agent", delayMs: 300 },
        { text: `[Intent] Action: SEARCH | Query: "${appName}"`, type: "info", delayMs: 400 },
        { text: `[Executing] ${commandSnippet}`, type: "command", delayMs: 600 },
        { text: `[Results] Found 3 matching packages:`, type: "info", delayMs: 300 },
        { text: `  1. ${appName} (Official) — [id: ${appName.replace(/\s+/g, '')}.Official]`, type: "info", delayMs: 200 },
        { text: `  2. ${appName}-Nightly — [id: ${appName.replace(/\s+/g, '')}.Nightly]`, type: "info", delayMs: 200 },
        { text: `  3. ${appName}-CLI — [id: ${appName.replace(/\s+/g, '')}.Tools]`, type: "info", delayMs: 200 },
        { text: `✔ Query completed. Ready for "install ${appName}".`, type: "success", delayMs: 300 },
      ];

    case "list":
      return [
        { text: `[Agent] Analyzing input intent... (DualModelChain: Groq Llama-3.3-70b)`, type: "agent", delayMs: 300 },
        { text: `[Executing] ${commandSnippet}`, type: "command", delayMs: 600 },
        { text: `[Inventory] Active Windows packages (sample):`, type: "info", delayMs: 300 },
        { text: `  • Visual Studio Code [Microsoft.VisualStudioCode] v1.94.0`, type: "info", delayMs: 150 },
        { text: `  • Git for Windows [Git.Git] v2.46.2`, type: "info", delayMs: 150 },
        { text: `  • Google Chrome [Google.Chrome] v130.0.6723.70`, type: "info", delayMs: 150 },
        { text: `  • Spotify Music [Spotify.Spotify] v1.2.49`, type: "info", delayMs: 150 },
        { text: `✔ Displayed 4 of 68 installed packages.`, type: "success", delayMs: 300 },
      ];

    default:
      return [
        { text: `[Agent] Analyzing input intent... (DualModelChain: Groq Llama-3.3-70b)`, type: "agent", delayMs: 300 },
        { text: `[Warning] Unable to map intent from: "${parsed.originalInput}"`, type: "warning", delayMs: 400 },
        { text: `[Hint] Try phrases like:`, type: "info", delayMs: 200 },
        { text: `  • "install cursor"`, type: "info", delayMs: 150 },
        { text: `  • "launch spotify"`, type: "info", delayMs: 150 },
        { text: `  • "update vs code"`, type: "info", delayMs: 150 },
        { text: `  • "uninstall skype"`, type: "info", delayMs: 150 },
        { text: `  • "search docker"`, type: "info", delayMs: 150 },
      ];
  }
}
