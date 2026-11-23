# THE ALOA V3 — WINDOWS COMPANION AGENT GUIDE

The **ALOA Windows Companion Agent** (`aloa-agent.exe`) is a lightweight background companion that bridges the public web platform at [aloav3.com](https://aloav3.com) with the user's personal Windows laptop.

---

## 1. WHY A COMPANION AGENT IS NEEDED

When a user visits `https://aloav3.com` and asks ALOA to:
- Install software via Winget (e.g. VS Code, Spotify)
- Diagnose real-time CPU, RAM, and Disk health
- Launch local applications
- Select project directories for Code Healing
- Clean temporary junk files

These actions **must execute on the user's physical computer**, not on Render's cloud servers. The Windows Companion Agent makes this possible securely without exposing any local ports or requiring router configuration.

---

## 2. HOW IT WORKS: OUTBOUND WEBSOCKET ARCHITECTURE

```
[aloav3.com Web Browser]
          │
          │ 1. User enters 6-character code
          ▼
[api.aloav3.com Cloud Backend]
          ▲
          │ 2. Outbound WSS Tunnel (Port 443)
          │    Bypasses firewalls & NAT automatically
          │
[User Laptop: aloa-agent.exe]
          │
          │ 3. Displays Security Prompt on Desktop
          ▼
[User Clicks "Allow"] ──► Executes Winget / Subprocess locally
```

1. **Outbound Connection:** When launched, `aloa-agent.exe` opens an outbound, TLS-encrypted WebSocket connection to `wss://api.aloav3.com/ws/agent`.
2. **Dynamic Pairing Code:** The cloud server issues a fresh 6-character pairing code (e.g. `A7B2X9`), valid for 5 minutes.
3. **One-Time Binding:** The user enters the code on `aloav3.com`. The browser session is instantly linked to their laptop.
4. **Mandatory Local Consent:** Before any system-changing action (software install, process kill, cleanup), a native Windows confirmation dialog appears:
   > *"Security Approval Needed: ALOA Web requested to Install Visual Studio Code via Winget. Allow this operation? [Yes] [No]"*
5. **Safe Execution:** Commands are executed strictly using parameterized argument arrays (`shell=False`). No arbitrary shell commands can be executed.

---

## 3. HOW TO RUN THE COMPANION AGENT

### Method A: Standalone Executable (For End Users — No Python Required)
1. Download `aloa-agent.exe` from the website or GitHub Releases.
2. Double-click `aloa-agent.exe`.
3. The companion window opens, displaying:
   - 🟢 Status: **Connected to api.aloav3.com**
   - 🔑 Pairing Code: **`A 7 B 2 X 9`**
4. Copy the code and paste it into the **"Connect Laptop"** dialog on [aloav3.com](https://aloav3.com).

### Method B: From Source (For Developers)
```bash
# Clone the repository
git clone https://github.com/thepeeyushyadav/THE-ALOA.git
cd THE-ALOA

# Install agent dependencies
pip install -r requirements.txt

# Run the companion agent
python -m aloa_agent.main --server wss://api.aloav3.com/ws/agent
```
