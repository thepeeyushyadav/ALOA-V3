# THE ALOA V3 — APPLICATION SECURITY & DEFENSIVE ARCHITECTURE

This document outlines the security controls, threat models, and architectural safeguards implemented in **THE ALOA V3**.

---

## 1. THREAT MODEL & MITIGATIONS

### Threat 1: Arbitrary Remote Code Execution (RCE) via Web API
- **Vulnerability Analyzed:** Previous backend implementations accepted a raw `command` string in JSON payloads and executed `subprocess.run(command, shell=True)`.
- **Fix Implemented:**
  - `command` parameter has been completely decoupled from execution.
  - The API only accepts structured, regex-validated parameters: `app_id` (matched against `^[A-Za-z0-9_\.\-]{2,100}$`) and `action`.
  - Commands are synthesized server-side/agent-side into fixed argument arrays executed with `shell=False`.
  - No user or AI-generated string is ever passed to `cmd.exe` or `bash`.

### Threat 2: Cloud-to-Desktop Lateral Movement / Unauthorized Actions
- **Defense in Depth:**
  - Even if a request arrives at the local companion agent, the agent intercepts all system-changing operations (`APP_INSTALL`, `KILL_PROCESS`, `SYSTEM_CLEANUP`).
  - A modal confirmation dialog is displayed on the physical desktop using the native Windows UI.
  - If the user clicks **"No"** or ignores the prompt, the agent sends an explicit cancellation response back to the cloud.

### Threat 3: Cross-User Device Impersonation
- **Ephemeral Zero-Database Pairing:**
  - When the desktop agent connects, the server generates a cryptographically random 6-character code (`secrets.choice(CODE_ALPHABET)`).
  - Code TTL is strictly enforced (5 minutes).
  - Rate limiting protects each browser session (maximum 5 attempts per minute).
  - One-time use: as soon as a pairing code is submitted, it is burned and removed from memory.
  - Commands from Browser Session A can only be dispatched to Laptop A bound to that session.

### Threat 4: Cross-Origin Resource Sharing (CORS) Abuse
- **Lockdown:**
  - Wildcard `allow_origins=["*"]` has been replaced with strict environment-configured allowlists:
    `https://aloav3.com`, `https://www.aloav3.com`, `http://localhost:3000`.
  - Malicious external websites cannot issue background requests to control the user's ALOA API.

### Threat 5: Path Traversal & Arbitrary File Overwrites
- **Containment:**
  - Code Healer operations enforce canonical path validation (`os.path.realpath`).
  - Files cannot be read or overwritten outside the user's designated project workspace root.

---

## 2. CREDENTIAL MANAGEMENT

1. **No Embedded Secrets:** `aloa-agent.exe` contains zero API keys or external credentials.
2. **Environment Variables:** All cloud AI keys (`GROQ_API_KEY`, `GEMINI_API_KEY_1/2`, etc.) are managed strictly through Render environment variables.
3. **PAT Sanitization:** Personal Access Tokens in Cloud Healer are masked from application logs and ephemeral workspaces are purged after deployment.
