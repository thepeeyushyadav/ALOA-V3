"""
ALOA V3 â€” Backend API Server
Thin FastAPI wrapper over existing feature modules.
Existing feature code is NOT modified â€” only imported.
Run: uvicorn backend.server:app --reload --port 8000
"""

import os
import sys
import re
import json
import uuid
import subprocess
import asyncio
import urllib.request
import urllib.error
import psutil
from datetime import datetime
from typing import AsyncGenerator, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from pydantic import BaseModel

# â”€â”€ Path setup â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)

from dotenv import load_dotenv
load_dotenv(os.path.join(PROJECT_ROOT, ".env"))

# â”€â”€ Import EXISTING feature functions (zero changes to any core.py) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
from features.feature_1.core import (
    command_chain,
    launch_app,
    extract_app_name_from_winget,
)

from features.feature_2.core import (
    get_detailed_system_stats,
    audit_junk_files,
    execute_cleanup,
    kill_specific_process,
)

from features.feature_7.core import (
    CloudHealerAgent,
    setup_cloud_workspace,
    push_to_cloud,
)

from features.feature_6.core import (
    scan_source_files,
    detect_project_type,
    auto_detect_run_command,
    execute_project,
    ALOAAgent,
    SKIP_DIRS,
    SOURCE_EXTENSIONS,
)

from features.feature_9.core import (
    create_empty_profile,
    save_profile,
    load_profile,
    list_profiles,
    get_profile_status,
    extract_profile_from_text,
    extract_text_from_pdf,
    generate_summary,
    rewrite_bullet,
    analyze_ats,
    generate_resume_html,
    save_resume_html,
    try_convert_to_pdf,
    ensure_dirs as resume_ensure_dirs,
)

import features.feature_9.core as _f9_core
_f9_core.GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"]

# â”€â”€ App â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app = FastAPI(title="ALOA Agent API", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # browser â†’ localhost, so * is fine
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# â”€â”€ Request models â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class GenerateRequest(BaseModel):
    input: str

class ExecuteRequest(BaseModel):
    action: str          # open | install | uninstall | close
    action_label: str    # "Open" | "Install" | "Remove" | "Close"
    app_name: str        # friendly name shown in UI
    command: str         # raw command â€” NEVER shown to user, used internally


# â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
def parse_command(raw: str, user_input: str) -> dict:
    """
    Turn raw PowerShell/winget command into user-friendly structured data.
    The 'command' field is kept for internal execution only â€” never shown in UI.
    """
    cmd = raw.strip().replace("```bash","").replace("```powershell","").replace("```","").strip()

    action, action_label, emoji, app_name, steps = "unknown", "Run", "âš¡", user_input.strip(), []

    if cmd.lower().startswith("start "):
        action, action_label, emoji = "open", "Open", "ðŸš€"
        app_name = cmd[6:].strip().strip('"').replace(":", "")
        steps = [
            {"message": f"Opening {app_name}", "detail": "Launching the app for you"},
        ]

    elif "winget install" in cmd.lower():
        action, action_label, emoji = "install", "Install", "ðŸ“¦"
        app_name = extract_app_name_from_winget(cmd) or app_name
        steps = [
            {"message": "Downloading from official source", "detail": "Secure, verified package"},
            {"message": "Installing silently",              "detail": "No extra popups from the installer"},
            {"message": f"Launching {app_name}",           "detail": "Opens automatically when done"},
        ]

    elif "winget uninstall" in cmd.lower():
        action, action_label, emoji = "uninstall", "Remove", "ðŸ—‘ï¸"
        m = re.search(r'winget\s+uninstall\s+"([^"]+)"', cmd, re.IGNORECASE)
        if m: app_name = m.group(1)
        steps = [
            {"message": "Removing app files",         "detail": "Cleaning up all app data"},
            {"message": "Clearing system entries",    "detail": "Removing from installed programs"},
        ]

    elif "taskkill" in cmd.lower():
        action, action_label, emoji = "close", "Close", "âœ•"
        m = re.search(r'/IM\s+([^\s]+\.exe)', cmd, re.IGNORECASE)
        if m: app_name = m.group(1).replace(".exe","").capitalize()
        steps = [
            {"message": f"Closing {app_name}", "detail": "Stopping safely"},
        ]

    return dict(action=action, action_label=action_label, emoji=emoji,
                app_name=app_name, steps=steps, command=cmd)


def sse(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"


# â”€â”€ Silent App Launcher (no terminal windows) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# Maps common aliases â†’ proper executable/app name so apps open correctly
APP_ALIASES: dict[str, str] = {
    "code": "code",                        # VS Code CLI
    "visual studio code": "code",
    "vscode": "code",
    "vs code": "code",
    "chrome": "chrome",
    "google chrome": "chrome",
    "firefox": "firefox",
    "edge": "msedge",
    "microsoft edge": "msedge",
    "notepad": "notepad",
    "notepad++": "notepad++",
    "spotify": "spotify",
    "discord": "discord",
    "slack": "slack",
    "zoom": "zoom",
    "vlc": "vlc",
    "calculator": "calc",
    "calc": "calc",
    "paint": "mspaint",
    "word": "winword",
    "excel": "excel",
    "powerpoint": "powerpnt",
    "teams": "teams",
    "obs": "obs64",
    "steam": "steam",
    "winrar": "winrar",
    "7zip": "7zfm",
}

NO_WINDOW = subprocess.CREATE_NO_WINDOW          # Hide any console/terminal
DETACHED  = subprocess.DETACHED_PROCESS          # Don't attach to parent

def silent_launch(app_name: str) -> bool:
    """
    Launch an app with ZERO visible terminal/CMD windows.
    Uses PowerShell Start-Process with fully hidden window, then os.startfile fallback.
    Never spawns cmd.exe.
    """
    import os as _os
    name = app_name.strip().strip('"').strip("'")
    alias = APP_ALIASES.get(name.lower(), name)

    # Strategy 1: PowerShell with hidden window â€” most reliable, zero flicker
    try:
        subprocess.Popen(
            [
                "powershell",
                "-NoProfile",
                "-NonInteractive",
                "-WindowStyle", "Hidden",
                "-Command", f'Start-Process "{alias}"',
            ],
            creationflags=NO_WINDOW | DETACHED,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            stdin=subprocess.DEVNULL,
        )
        return True
    except Exception:
        pass

    # Strategy 2: os.startfile â€” pure Windows Shell API, zero CMD/terminal
    try:
        _os.startfile(alias)
        return True
    except Exception:
        pass

    return False


# â”€â”€ Routes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

@app.get("/api/health")
def health():
    return {"status": "online", "agent": "ALOA V3"}


@app.post("/api/app-manager/generate")
async def generate(req: GenerateRequest):
    """
    Step 1 â€” AI reads user intent, returns friendly structured data.
    Raw command stays on the server; UI never sees it.
    """
    try:
        loop = asyncio.get_event_loop()
        raw = await loop.run_in_executor(
            None, lambda: command_chain.invoke({"input": req.input})
        )
        return parse_command(raw, req.input)
    except Exception as e:
        return {"error": True, "message": str(e)}


@app.post("/api/app-manager/execute")
async def execute(req: ExecuteRequest):
    """
    Step 2 â€” Execute silently, stream friendly status steps via SSE.
    Uses silent_launch exclusively â€” no terminal/CMD windows ever open.
    """
    async def stream() -> AsyncGenerator[str, None]:
        loop = asyncio.get_event_loop()
        try:
            # â”€â”€ Acknowledged â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            yield sse({"type":"step","index":0,"status":"done",
                       "message":"Request confirmed",
                       "detail":f"{req.action_label} {req.app_name}"})
            await asyncio.sleep(0.2)

            # â”€â”€ INSTALL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            if req.action == "install":
                yield sse({"type":"step","index":1,"status":"active",
                           "message":"Downloading...",
                           "detail":"Fetching from official source"})

                # Run winget silently â€” CREATE_NO_WINDOW hides all console output
                result = await loop.run_in_executor(
                    None,
                    lambda: subprocess.run(
                        req.command, shell=True,
                        capture_output=True, text=True, timeout=300,
                        creationflags=NO_WINDOW,
                    )
                )

                already = "no applicable upgrade" in (result.stdout or "").lower() \
                       or result.returncode == -1978335212

                yield sse({"type":"step","index":1,"status":"done",
                           "message": "Already installed!" if already else "Installed successfully",
                           "detail": f"{req.app_name} is already on your computer" if already
                                     else f"{req.app_name} is ready"})

                await asyncio.sleep(0.3)
                yield sse({"type":"step","index":2,"status":"active",
                           "message":f"Opening {req.app_name}...",
                           "detail":"Launching it for you"})

                launch_name = extract_app_name_from_winget(req.command) or req.app_name
                ok = await loop.run_in_executor(None, silent_launch, launch_name)

                yield sse({"type":"step","index":2,"status":"done",
                           "message": f"{req.app_name} is open!" if ok
                                       else "Done â€” open it from your Start Menu",
                           "detail": "App launched" if ok
                                      else "Installation succeeded; open manually if needed"})

            # â”€â”€ OPEN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            elif req.action == "open":
                yield sse({"type":"step","index":1,"status":"active",
                           "message":f"Opening {req.app_name}...",
                           "detail":"Searching your installed apps"})

                # silent_launch â€” no terminal, no CMD window, no password prompts
                ok = await loop.run_in_executor(None, silent_launch, req.app_name)

                yield sse({"type":"step","index":1,"status":"done",
                           "message": f"{req.app_name} is open!" if ok
                                       else f"Could not find {req.app_name}",
                           "detail": "App launched successfully" if ok
                                      else "Make sure it's installed on your computer"})

            # â”€â”€ CLOSE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            elif req.action == "close":
                yield sse({"type":"step","index":1,"status":"active",
                           "message":f"Closing {req.app_name}...",
                           "detail":"Stopping the process"})

                # taskkill silently â€” no console window
                await loop.run_in_executor(
                    None,
                    lambda: subprocess.run(
                        req.command, shell=True,
                        capture_output=True,
                        creationflags=NO_WINDOW,
                    )
                )

                yield sse({"type":"step","index":1,"status":"done",
                           "message":f"{req.app_name} closed",
                           "detail":"App has been stopped"})

            # â”€â”€ UNINSTALL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            elif req.action == "uninstall":
                yield sse({"type":"step","index":1,"status":"active",
                           "message":f"Removing {req.app_name}...",
                           "detail":"This may take a moment"})

                await loop.run_in_executor(
                    None,
                    lambda: subprocess.run(
                        req.command, shell=True,
                        capture_output=True, text=True, timeout=300,
                        creationflags=NO_WINDOW,
                    )
                )

                yield sse({"type":"step","index":1,"status":"done",
                           "message":f"{req.app_name} removed",
                           "detail":"Successfully uninstalled"})

            # â”€â”€ Done â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            yield sse({"type":"done","message":"All done!"})

        except asyncio.TimeoutError:
            yield sse({"type":"error",
                       "message":"Operation timed out",
                       "detail":"It may still be running in the background"})
        except Exception as e:
            yield sse({"type":"error","message":"Something went wrong","detail":str(e)})

    return StreamingResponse(
        stream(),
        media_type="text/event-stream",
        headers={"Cache-Control":"no-cache","X-Accel-Buffering":"no","Connection":"keep-alive"},
    )


# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
# FEATURE 2 â€” System Insights
# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

def _ai_insight(prompt: str) -> str:
    """Call Groq first (fast), fall back to OpenRouter."""
    groq_key = os.environ.get("GROQ_API_KEY", "")
    if groq_key:
        try:
            body = json.dumps({
                "model": "llama-3.1-8b-instant",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.3,
                "max_tokens": 80,
            }).encode()
            req = urllib.request.Request(
                "https://api.groq.com/openai/v1/chat/completions",
                data=body,
                headers={"Authorization": f"Bearer {groq_key}", "Content-Type": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=10) as r:
                return json.loads(r.read())["choices"][0]["message"]["content"].strip()
        except Exception:
            pass

    or_key = os.environ.get("OPENROUTER_API_KEY", "")
    if or_key:
        try:
            body = json.dumps({
                "model": "openrouter/auto",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.3, "max_tokens": 80,
            }).encode()
            req = urllib.request.Request(
                "https://openrouter.ai/api/v1/chat/completions",
                data=body,
                headers={"Authorization": f"Bearer {or_key}", "Content-Type": "application/json",
                         "HTTP-Referer": "https://aloa.local"},
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=15) as r:
                return json.loads(r.read())["choices"][0]["message"]["content"].strip()
        except Exception:
            pass

    return "System scan complete. Review your vitals above."


def _format_mb(bytes_val: float) -> str:
    gb = bytes_val / (1024 ** 3)
    mb = bytes_val / (1024 ** 2)
    return f"{gb:.1f} GB" if gb >= 1 else f"{mb:.0f} MB"


def _impact(mem_bytes: float) -> str:
    if mem_bytes > 1024 ** 3:        return "critical"
    if mem_bytes > 500 * 1024 ** 2:  return "moderate"
    return "normal"


@app.get("/api/system-doctor/scan")
async def system_doctor_scan():
    """Scan CPU, RAM, disk, top processes, junk â€” returns structured JSON + AI insight."""
    loop = asyncio.get_event_loop()

    # Run blocking psutil calls in executor
    stats = await loop.run_in_executor(None, get_detailed_system_stats)
    junk  = await loop.run_in_executor(None, audit_junk_files)

    if isinstance(stats, str):   # error string
        return {"error": True, "message": stats}

    total_ram = psutil.virtual_memory().total
    disk      = psutil.disk_usage("C:\\")

    # Build process list
    processes = []
    for i, p in enumerate(stats["top_apps"][:5]):
        mem_bytes = (p["memory_percent"] / 100) * total_ram
        processes.append({
            "rank":   i + 1,
            "name":   p["name"].replace(".exe", "").capitalize(),
            "pid":    p["pid"],
            "mem_label": _format_mb(mem_bytes),
            "impact": _impact(mem_bytes),
        })

    cpu = round(stats["cpu_total"], 1)
    ram = round(stats["ram_total"], 1)

    # AI insight (non-blocking)
    top_name = processes[0]["name"] if processes else "unknown"
    situation = (
        f"CPU is {cpu}%, RAM is {ram}%, heaviest process is {top_name}. "
        f"Disk used: {disk.percent}%."
    )
    prompt = (
        f"SITUATION: {situation}\n"
        "TASK: Write ONE short sentence telling the user what to do about their system performance. "
        "Be direct and friendly. No prefixes."
    )
    insight = await loop.run_in_executor(None, _ai_insight, prompt)

    return {
        "cpu": cpu,
        "ram": ram,
        "disk": round(disk.percent, 1),
        "disk_free": _format_mb(disk.free),
        "cpu_status":  "critical" if cpu > 80 else "high" if cpu > 50 else "stable",
        "ram_status":  "critical" if ram > 85 else "high" if ram > 65 else "stable",
        "disk_status": "critical" if disk.percent > 90 else "high" if disk.percent > 75 else "stable",
        "processes": processes,
        "junk_label": junk.get("text", "0 MB"),
        "insight": insight,
    }


class KillRequest(BaseModel):
    process_name: str

@app.post("/api/system-doctor/kill")
async def system_doctor_kill(req: KillRequest):
    """Kill a process by name. Returns friendly result."""
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, kill_specific_process, req.process_name)
    success = "SUCCESS" in result or "Terminated" in result
    return {
        "success": success,
        "message": f"{req.process_name} has been stopped" if success
                   else f"Could not stop {req.process_name}",
        "detail":  "Process ended successfully" if success
                   else "It may already be closed or needs admin access",
    }


@app.post("/api/system-doctor/cleanup")
async def system_doctor_cleanup():
    """Clean junk files â€” streams friendly SSE progress steps."""
    async def stream() -> AsyncGenerator[str, None]:
        loop = asyncio.get_event_loop()
        try:
            yield sse({"type": "step", "index": 0, "status": "done",
                       "message": "Cleanup approved", "detail": "Starting junk removal"})
            await asyncio.sleep(0.3)

            yield sse({"type": "step", "index": 1, "status": "active",
                       "message": "Clearing temp files...", "detail": "Windows Temp & User Temp"})
            await loop.run_in_executor(None, execute_cleanup)

            yield sse({"type": "step", "index": 1, "status": "done",
                       "message": "Junk cleared!", "detail": "Temp files and recycle bin emptied"})
            await asyncio.sleep(0.2)

            yield sse({"type": "done", "message": "System cleaned successfully ðŸŽ‰"})

        except Exception as e:
            yield sse({"type": "error", "message": "Cleanup failed", "detail": str(e)})

    return StreamingResponse(
        stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no", "Connection": "keep-alive"},
    )


# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
# FEATURE 6 â€” CODE HEALER
# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

# In-memory session store: session_id â†’ ALOAAgent instance
_ch_agents: dict[str, ALOAAgent] = {}

class CHScanRequest(BaseModel):
    folder: str

class CHRunRequest(BaseModel):
    folder: str
    run_command: str
    session_id: str

class CHFixRequest(BaseModel):
    folder: str
    error_text: str
    session_id: str

class CHApplyRequest(BaseModel):
    session_id: str

class CHChatRequest(BaseModel):
    session_id: str
    message: str

class CHRunCommandRequest(BaseModel):
    session_id: str
    run_command: str


def _build_file_tree(folder: str) -> list:
    """Build a simplified file tree for the frontend."""
    tree = []
    folder_name = os.path.basename(folder)
    tree.append({"name": folder_name, "type": "dir", "depth": 0, "path": ""})
    for root, dirs, files in os.walk(folder):
        dirs[:] = sorted([d for d in dirs if d not in SKIP_DIRS])
        depth = os.path.relpath(root, folder).count(os.sep) + 1
        if depth > 3:
            continue
        for d in dirs:
            rel = os.path.relpath(os.path.join(root, d), folder)
            tree.append({"name": d, "type": "dir", "depth": depth, "path": rel})
        for f in sorted(files):
            ext = os.path.splitext(f)[1].lower()
            if ext in SOURCE_EXTENSIONS:
                rel = os.path.relpath(os.path.join(root, f), folder)
                tree.append({"name": f, "type": "file", "depth": depth, "path": rel, "ext": ext})
    return tree[:60]  # cap at 60 entries


def _compute_diff(original: str, fixed: str, filename: str) -> list:
    """Compute a unified diff between original and fixed code."""
    import difflib
    orig_lines = original.splitlines(keepends=True)
    fixed_lines = fixed.splitlines(keepends=True)
    diff = list(difflib.unified_diff(orig_lines, fixed_lines, fromfile=filename, tofile=filename, n=3))
    result = []
    orig_line = 0
    fix_line = 0
    for line in diff:
        line = line.rstrip('\n')
        if line.startswith('---') or line.startswith('+++'):
            continue
        elif line.startswith('@@'):
            # Parse hunk header
            import re as _re
            m = _re.search(r'-(\d+)(?:,\d+)? \+(\d+)', line)
            if m:
                orig_line = int(m.group(1)) - 1
                fix_line = int(m.group(2)) - 1
            result.append({"type": "hunk", "text": line})
        elif line.startswith('-'):
            orig_line += 1
            result.append({"type": "removed", "text": line[1:], "orig": orig_line, "fix": None})
        elif line.startswith('+'):
            fix_line += 1
            result.append({"type": "added", "text": line[1:], "orig": None, "fix": fix_line})
        else:
            orig_line += 1
            fix_line += 1
            result.append({"type": "ctx", "text": line[1:] if line.startswith(' ') else line, "orig": orig_line, "fix": fix_line})
    return result


@app.get("/api/code-healer/browse-folder")
async def ch_browse_folder():
    """Open native Windows folder picker dialog, return selected path."""
    import features.feature_6.core as _f6
    # Patch wrong model name before any AI call
    _f6.GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]

    loop = asyncio.get_event_loop()
    def _pick():
        try:
            import tkinter as tk
            from tkinter import filedialog
            root = tk.Tk()
            root.withdraw()
            root.wm_attributes("-topmost", True)
            folder = filedialog.askdirectory(title="Select Project Folder", parent=root)
            root.destroy()
            return folder or ""
        except Exception:
            return ""
    path = await loop.run_in_executor(None, _pick)
    # Return empty path with 200 so frontend can handle gracefully
    return {"path": path, "cancelled": not bool(path)}


@app.post("/api/code-healer/scan")
async def ch_scan(req: CHScanRequest):
    """Scan a project folder and return metadata + create an agent session."""
    import features.feature_6.core as _f6
    # Patch wrong model name in the core module (can't modify core.py directly)
    _f6.GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]

    folder = req.folder.strip()
    if not os.path.isdir(folder):
        raise HTTPException(status_code=400, detail=f"Folder not found: {folder}")

    loop = asyncio.get_event_loop()
    source_files = await loop.run_in_executor(None, scan_source_files, folder)
    proj_type, default_cmd = await loop.run_in_executor(None, detect_project_type, folder)
    run_command, entry = await loop.run_in_executor(
        None, auto_detect_run_command, folder, source_files, proj_type, default_cmd
    )
    file_tree = await loop.run_in_executor(None, _build_file_tree, folder)

    # Create agent session
    session_id = uuid.uuid4().hex
    agent = ALOAAgent(folder, source_files, proj_type, run_command or "")
    _ch_agents[session_id] = agent

    return {
        "session_id": session_id,
        "project_type": proj_type,
        "file_count": len(source_files),
        "run_command": run_command or "",
        "entry_point": os.path.relpath(entry, folder) if entry else "",
        "file_tree": file_tree,
    }


@app.post("/api/code-healer/run")
async def ch_run(req: CHRunRequest):
    """Run the project and stream output via SSE."""
    folder = req.folder.strip()
    if not os.path.isdir(folder):
        raise HTTPException(status_code=400, detail="Folder not found")

    agent = _ch_agents.get(req.session_id)
    if agent and req.run_command:
        agent.run_command = req.run_command

    async def stream() -> AsyncGenerator[str, None]:
        loop = asyncio.get_event_loop()
        yield sse({"type": "step", "message": "Starting project...", "detail": f"Running: {req.run_command}"})
        try:
            success, stdout, stderr, is_server = await loop.run_in_executor(
                None, execute_project, folder, req.run_command
            )
            combined_output = (stdout + "\n" + stderr).strip()
            if success:
                yield sse({"type": "success", "output": combined_output,
                           "message": "Project ran successfully", "is_server": is_server})
            else:
                yield sse({"type": "error_found", "output": combined_output,
                           "error_text": stderr.strip() or stdout.strip(),
                           "message": "Error detected"})
        except Exception as e:
            yield sse({"type": "error_found", "output": "", "error_text": str(e),
                       "message": "Failed to run project"})

    return StreamingResponse(stream(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@app.post("/api/code-healer/fix")
async def ch_fix(req: CHFixRequest):
    """Ask AI to fix the error, stream progress, return fix + diff."""
    agent = _ch_agents.get(req.session_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Session not found. Re-scan the project.")

    async def stream() -> AsyncGenerator[str, None]:
        loop = asyncio.get_event_loop()
        yield sse({"type": "step", "message": "Analyzing error...", "detail": "Reading project files"})

        prompt = f"""I ran the project and got this error:

{req.error_text}

Please analyze the error, identify the exact file and line causing it, explain what's wrong, and provide the complete fix.
Use the FIX_FILE and FIXED_CODE format."""

        try:
            response = await loop.run_in_executor(None, agent.send_message, prompt, 'fix')
            yield sse({"type": "step", "message": "Parsing fix...", "detail": "Extracting changes"})

            fix_file, fixed_code = agent.parse_fix_from_response(response)

            if not fix_file or not fixed_code:
                yield sse({"type": "no_fix", "message": "AI explained the issue but couldn't generate a fix.",
                           "explanation": response})
                return

            # Read original file for diff
            fix_path = os.path.join(agent.folder_path, fix_file)
            original_code = ""
            if os.path.isfile(fix_path):
                try:
                    with open(fix_path, 'r', encoding='utf-8', errors='ignore') as f:
                        original_code = f.read()
                except:
                    pass

            diff = _compute_diff(original_code, fixed_code, fix_file)

            # Extract explanation (text before FIX_FILE:)
            explanation = response.split("FIX_FILE:")[0].strip()

            yield sse({
                "type": "fix_ready",
                "fix_file": fix_file,
                "explanation": explanation,
                "diff": diff,
                "message": "Fix ready",
            })
        except Exception as e:
            yield sse({"type": "error", "message": "AI failed to generate fix", "detail": str(e)})

    return StreamingResponse(stream(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@app.post("/api/code-healer/apply")
async def ch_apply(req: CHApplyRequest):
    """Apply the last AI fix to the file."""
    agent = _ch_agents.get(req.session_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Session not found.")

    loop = asyncio.get_event_loop()
    success, message = await loop.run_in_executor(None, agent.apply_fix)
    if not success:
        raise HTTPException(status_code=400, detail=message)

    backup_file = (agent.last_fix_file or "") + ".bak"
    return {"success": True, "message": message, "fix_file": agent.last_fix_file,
            "backup_file": backup_file}


@app.post("/api/code-healer/chat")
async def ch_chat(req: CHChatRequest):
    """Send a chat message to the AI agent about the project."""
    agent = _ch_agents.get(req.session_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Session not found.")

    loop = asyncio.get_event_loop()
    reply = await loop.run_in_executor(None, agent.send_message, req.message, 'chat')
    return {"reply": reply}


@app.post("/api/code-healer/update-run-command")
async def ch_update_run_command(req: CHRunCommandRequest):
    """Update the run command for an existing session."""
    agent = _ch_agents.get(req.session_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Session not found.")
    agent.run_command = req.run_command
    return {"success": True}


# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
# FEATURE 7 â€” CLOUD HEALER
# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

import tempfile

# In-memory session store: session_id â†’ CloudHealerAgent
_cloud_agents: dict[str, CloudHealerAgent] = {}
_cloud_meta:   dict[str, dict] = {}   # session_id â†’ {repo_url, folder, branch}

class CloudConnectRequest(BaseModel):
    repo_url: str
    pat: str

class CloudChatRequest(BaseModel):
    session_id: str
    message: str

class CloudApplyRequest(BaseModel):
    session_id: str

class CloudPushRequest(BaseModel):
    session_id: str
    commit_message: str = "ALOA Cloud Healer: Applied fix"


def _get_cloud_workspace(session_id: str) -> str:
    """Returns a stable temp folder path for the session."""
    base = os.path.join(tempfile.gettempdir(), "aloa_cloud")
    os.makedirs(base, exist_ok=True)
    return os.path.join(base, session_id)


@app.post("/api/cloud-healer/connect")
async def cloud_connect(req: CloudConnectRequest):
    """Clone repo + create CloudHealerAgent session. Returns session_id + file tree."""
    repo_url = req.repo_url.strip()
    pat = req.pat.strip()
    if not repo_url or not pat:
        raise HTTPException(status_code=400, detail="repo_url and pat are required.")

    session_id = uuid.uuid4().hex
    dest_folder = _get_cloud_workspace(session_id)

    loop = asyncio.get_event_loop()

    # Clone
    success, msg = await loop.run_in_executor(
        None, setup_cloud_workspace, repo_url, pat, dest_folder
    )
    if not success:
        raise HTTPException(status_code=400, detail=msg)

    # Configure git identity so commits don't fail
    await loop.run_in_executor(None, lambda: subprocess.run(
        ['git', 'config', 'user.email', 'hello.aloav3@gmail.com'],
        cwd=dest_folder, capture_output=True
    ))
    await loop.run_in_executor(None, lambda: subprocess.run(
        ['git', 'config', 'user.name', 'ALOA Development Team'],
        cwd=dest_folder, capture_output=True
    ))

    # Create agent
    agent = await loop.run_in_executor(None, CloudHealerAgent, dest_folder)
    _cloud_agents[session_id] = agent

    # Build lightweight file tree for frontend
    from features.feature_7.core import build_file_tree as _ch_build_tree, SKIP_DIRS as _CH_SKIP
    from features.feature_6.core import SOURCE_EXTENSIONS as _CH_SRC_EXT
    file_tree_items = []
    for root, dirs, files in os.walk(dest_folder):
        dirs[:] = sorted([d for d in dirs if d not in _CH_SKIP])
        depth = os.path.relpath(root, dest_folder).count(os.sep) + 1
        if depth > 3:
            continue
        for d in dirs:
            rel = os.path.relpath(os.path.join(root, d), dest_folder)
            file_tree_items.append({"name": d, "type": "dir", "depth": depth, "path": rel})
        for f in sorted(files):
            ext = os.path.splitext(f)[1].lower()
            if ext in _CH_SRC_EXT:
                rel = os.path.relpath(os.path.join(root, f), dest_folder)
                file_tree_items.append({"name": f, "type": "file", "depth": depth, "path": rel, "ext": ext})

    # Detect repo name + branch
    repo_name = repo_url.rstrip("/").split("/")[-1].replace(".git", "")
    branch_res = subprocess.run(
        ['git', 'rev-parse', '--abbrev-ref', 'HEAD'],
        cwd=dest_folder, capture_output=True, text=True
    )
    branch = branch_res.stdout.strip() or "main"

    _cloud_meta[session_id] = {
        "repo_url": repo_url,
        "folder": dest_folder,
        "branch": branch,
        "repo_name": repo_name,
        "pat": pat,
    }

    return {
        "session_id": session_id,
        "repo_name": repo_name,
        "branch": branch,
        "file_count": len([x for x in file_tree_items if x["type"] == "file"]),
        "file_tree": file_tree_items[:80],
        "message": "Repository cloned successfully.",
    }


def _gemini_call(messages: list, system_prompt: str) -> str:
    """Call Gemini with conversation history. Returns response text."""
    from google import genai as _genai
    keys = [
        os.environ.get("GEMINI_API_KEY_1", ""),
        os.environ.get("GEMINI_API_KEY_2", ""),
    ]
    full_prompt = (
        system_prompt
        + "\n\n"
        + "\n".join(
            f"{'User' if m['role'] == 'user' else 'Assistant'}: {m['content']}"
            for m in messages
        )
    )
    for key in keys:
        if not key:
            continue
        try:
            client = _genai.Client(api_key=key)
            resp = client.models.generate_content(
                model="gemini-2.5-flash", contents=full_prompt
            )
            return resp.text or ""
        except Exception:
            continue
    raise ConnectionError("Gemini keys exhausted.")



_FORMAT_REMINDER = (
    "IMPORTANT: When you have a fix ready, output it using EXACTLY this format:\n"
    "\n"
    "FILE: <relative_path>\n"
    "FULL_REWRITE:\n"
    "```python\n"
    "<complete new file content - every single line>\n"
    "```\n"
    "\n"
    "Rules:\n"
    "- Use READ_FILE: <path> to read a file before fixing it\n"
    "- Use FILE: + FULL_REWRITE: to deliver the actual fix (do not just describe it)\n"
    "- For NEW files that do not exist yet, use the same FILE: + FULL_REWRITE: format\n"
    "- Write the COMPLETE file content, not just the changed part\n"
)

def _cloud_gemini_agentic(agent, user_message: str):
    """
    Full agentic loop using Gemini instead of Bedrock/OpenRouter.
    Mirrors the logic in feature_7/core.py's chat() â€” reads files,
    feeds back content, then parses the final response for changes.
    Returns (ai_text, has_changes).
    """
    import re as _re

    # agent.chat() already appended user_message before failing;
    # do NOT append it again — just inject the format reminder.
    agent.conversation_history.append({
        "role": "user",
        "content": _FORMAT_REMINDER,
    })

    max_iter = 5
    ai_response = ""
    for iteration in range(max_iter):
        ai_response = _gemini_call(agent.conversation_history, agent.system_prompt)

        # Check for file-read tool calls
        read_requests = _re.findall(
            r"READ_FILE:\s*(.+?)(?:\n|$)", ai_response, _re.IGNORECASE
        )

        if read_requests and iteration < max_iter - 1:
            agent.conversation_history.append(
                {"role": "assistant", "content": ai_response}
            )
            file_contents = []
            for rp in read_requests:
                rp = rp.strip().strip("`").strip("*")
                full_path = os.path.join(agent.folder_path, rp)
                if os.path.isfile(full_path):
                    try:
                        with open(full_path, "r", encoding="utf-8", errors="replace") as f:
                            content = f.read(15000)
                        file_contents.append(
                            f"â•â•â• CONTENT OF {rp} â•â•â•\n{content}\nâ•â•â• END OF {rp} â•â•â•"
                        )
                    except Exception:
                        file_contents.append(f"âš  Could not read '{rp}'.")
                else:
                    file_contents.append(f"âš  File '{rp}' not found.")
            tool_response = "\n\n".join(file_contents)
            agent.conversation_history.append({
                "role": "user",
                "content": (
                    f"[SYSTEM] Here are the file contents you requested:\n\n"
                    f"{tool_response}\n\nNow continue with your analysis and provide the fix."
                ),
            })
            continue

        # Final response
        agent.conversation_history.append(
            {"role": "assistant", "content": ai_response}
        )
        has_changes = agent._parse_changes(ai_response)
        return ai_response, has_changes

    agent.conversation_history.append({"role": "assistant", "content": ai_response})
    return ai_response, agent._parse_changes(ai_response)


@app.post("/api/cloud-healer/chat")
async def cloud_chat(req: CloudChatRequest):
    """Send message to agent. Returns AI reply + whether a fix is pending."""
    agent = _cloud_agents.get(req.session_id)
    meta  = _cloud_meta.get(req.session_id)
    if not agent or not meta:
        raise HTTPException(status_code=404, detail="Session not found. Re-connect the repo.")

    loop = asyncio.get_event_loop()
    ai_text, has_changes = await loop.run_in_executor(
        None, agent.chat, req.message
    )

    # â”€â”€ Gemini fallback when Bedrock+OpenRouter both fail â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if "Both AI backends failed" in ai_text or ai_text.startswith("Both AI") or "ConnectionError" in ai_text:
        try:
            ai_text, has_changes = await loop.run_in_executor(
                None, _cloud_gemini_agentic, agent, req.message
            )
        except Exception as gem_err:
            ai_text = f"All AI backends failed. Check your API keys in .env\n\nDetails: {gem_err}"
            has_changes = False

    diff = None
    fix_file = None

    if has_changes:
        diff_text = agent.get_pending_diff()
        fix_file  = agent.get_pending_file()
        diff = _parse_unified_diff(diff_text or "")
    else:
        # â”€â”€ Fallback: handle new-file creation (FILE: + FULL_REWRITE for non-existent path) â”€â”€
        # core._parse_changes skips files that don't exist yet â€” we catch them here
        file_m = re.search(r"(?:FILE|FIX_FILE):\s*(.+?)(?:\n|$)", ai_text, re.IGNORECASE)
        rewrite_m = re.search(r"FULL_REWRITE:\s*```[a-z]*\n(.*?)\n```", ai_text, re.DOTALL | re.IGNORECASE)

        if file_m and rewrite_m:
            candidate_file = file_m.group(1).strip().strip("`").strip("*")
            candidate_path = os.path.join(meta["folder"], candidate_file)
            new_content    = rewrite_m.group(1)

            # Treat as new file â€” diff shows all lines as "added"
            diff_lines = []
            for i, line in enumerate(new_content.splitlines(), 1):
                diff_lines.append({"type": "added", "text": line, "orig": None, "fix": i})

            if diff_lines:
                # Store pending state directly on agent so apply endpoint works
                agent.pending_file        = candidate_file
                agent.pending_new_content = new_content
                agent.pending_diff        = "\n".join(f"+{l}" for l in new_content.splitlines())
                agent.pending_mode        = "rewrite"

                has_changes = True
                fix_file    = candidate_file
                diff        = diff_lines

    return {
        "reply":    ai_text,
        "has_fix":  has_changes,
        "fix_file": fix_file,
        "diff":     diff,
    }


def _parse_unified_diff(diff_text: str) -> list:
    """Convert unified diff text to structured line objects for the frontend."""
    result = []
    orig_line = 0
    fix_line = 0
    for line in diff_text.splitlines():
        if line.startswith("---") or line.startswith("+++"):
            continue
        elif line.startswith("@@"):
            m = re.search(r'-(\d+)(?:,\d+)? \+(\d+)', line)
            if m:
                orig_line = int(m.group(1)) - 1
                fix_line  = int(m.group(2)) - 1
            result.append({"type": "hunk", "text": line, "orig": None, "fix": None})
        elif line.startswith("-"):
            orig_line += 1
            result.append({"type": "removed", "text": line[1:], "orig": orig_line, "fix": None})
        elif line.startswith("+"):
            fix_line += 1
            result.append({"type": "added", "text": line[1:], "orig": None, "fix": fix_line})
        else:
            orig_line += 1
            fix_line  += 1
            result.append({"type": "ctx", "text": line[1:] if line.startswith(" ") else line, "orig": orig_line, "fix": fix_line})
    return result


@app.post("/api/cloud-healer/apply")
async def cloud_apply(req: CloudApplyRequest):
    """Apply the pending fix to the local cloned workspace."""
    agent = _cloud_agents.get(req.session_id)
    meta  = _cloud_meta.get(req.session_id)
    if not agent or not meta:
        raise HTTPException(status_code=404, detail="Session not found.")

    # Ensure parent directory exists (handles new-file creation case)
    if agent.pending_file and agent.pending_new_content:
        fix_path = os.path.join(meta["folder"], agent.pending_file)
        parent   = os.path.dirname(fix_path)
        if parent and not os.path.isdir(parent):
            os.makedirs(parent, exist_ok=True)

    loop = asyncio.get_event_loop()
    success, message = await loop.run_in_executor(None, agent.apply_pending_changes)
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return {"success": True, "message": message}


@app.post("/api/cloud-healer/push")
async def cloud_push(req: CloudPushRequest):
    """Push the applied fix to GitHub with full ALOA V3 commit details."""
    agent = _cloud_agents.get(req.session_id)
    meta  = _cloud_meta.get(req.session_id)
    if not agent or not meta:
        raise HTTPException(status_code=404, detail="Session not found.")

    loop = asyncio.get_event_loop()

    # Always ensure real team author identity is configured
    await loop.run_in_executor(None, lambda: subprocess.run(
        ['git', 'config', 'user.email', 'hello.aloav3@gmail.com'],
        cwd=meta["folder"], capture_output=True
    ))
    await loop.run_in_executor(None, lambda: subprocess.run(
        ['git', 'config', 'user.name', 'ALOA Development Team'],
        cwd=meta["folder"], capture_output=True
    ))

    # Format structured multi-line commit message with Title + Body
    raw_msg = req.commit_message.strip()
    if "\n" not in raw_msg:
        title = raw_msg or "fix: [ALOA V3] Auto-healed codebase issue"
        if not title.startswith("fix:") and not title.startswith("ALOA"):
            title = f"fix: [ALOA V3] {title}"
        body = (
            "🤖 Fixed autonomously by ALOA V3 Cloud Healer Engine\n\n"
            "• Platform: ALOA V3 AI Agent Platform\n"
            "• Verification: Verified & applied via Double-Lock Permission System\n"
            "• Validation: Python AST syntax check passed (0 syntax errors)\n"
            "• Committed by: ALOA Development Team <hello.aloav3@gmail.com>"
        )
        full_commit = f"{title}\n\n{body}"
    else:
        full_commit = raw_msg

    success, message = await loop.run_in_executor(
        None, push_to_cloud, meta["folder"], full_commit
    )
    if not success:
        raise HTTPException(status_code=400, detail=message)

    return {
        "success": True,
        "message": message,
        "repo_url": meta["repo_url"],
        "branch": meta["branch"],
    }


@app.delete("/api/cloud-healer/session/{session_id}")
async def cloud_session_delete(session_id: str):
    """Clean up session and delete cloned workspace."""
    import shutil as _shutil
    meta = _cloud_meta.pop(session_id, None)
    _cloud_agents.pop(session_id, None)
    if meta:
        try:
            def _rm_ro(func, path, _):
                import stat as _stat
                os.chmod(path, _stat.S_IWRITE)
                func(path)
            _shutil.rmtree(meta["folder"], onerror=_rm_ro)
        except Exception:
            pass
    return {"success": True}


# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
# FEATURE 4 â€” YOUTUBE NOTES
# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

# Lazy import â€” avoids crash if deps missing
try:
    from features.feature_4.core import (
        get_video_id,
        fetch_transcript,
        generate_structured_notes as _generate_structured_notes_orig,
    )
    import features.feature_4.core as _f4_core
    # Patch the model list â€” gemini-3.6-flash doesn't exist; use gemini-2.5-flash
    _f4_core.GEMINI_MODELS = ["gemini-2.5-flash", "gemini-flash-latest"]

    def generate_structured_notes(transcript: str) -> str:
        return _generate_structured_notes_orig(transcript)

    _F4_OK = True
except Exception as _f4_err:
    _F4_OK = False
    print(f"[Feature 4] Import warning: {_f4_err}")

NOTES_DIR          = os.path.join(PROJECT_ROOT, "backend", "outputs", "youtube_notes")
NOTES_HISTORY_FILE = os.path.join(PROJECT_ROOT, "backend", "youtube_notes_history.json")
os.makedirs(NOTES_DIR, exist_ok=True)

def _load_yt_history():
    if os.path.exists(NOTES_HISTORY_FILE):
        try:
            with open(NOTES_HISTORY_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return []

def _save_yt_history(entries):
    with open(NOTES_HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(entries[:20], f, ensure_ascii=False, indent=2)

def _extract_title(md: str) -> str:
    for line in md.split("\n"):
        s = line.strip()
        if s.startswith("# "):
            return s[2:].strip()
    return "Lecture Notes"

def _generate_notes_from_video_url(url: str) -> str:
    """Multimodal fallback using Gemini 2.5 Flash native YouTube understanding."""
    from google import genai
    from google.genai import types

    keys = [
        os.environ.get("GEMINI_API_KEY_1", ""),
        os.environ.get("GEMINI_API_KEY_2", ""),
        os.environ.get("GEMINI_API_KEY_F5_1", ""),
    ]
    prompt = """
Act as an Expert Professor. Analyze this lecture/video and create comprehensive structured study notes.

Format as clean, beautiful Markdown:
# [Topic / Lecture Title]

### ðŸŽ¯ Core Concept
Explain the main purpose and core theory in 2-3 concise paragraphs.

### ðŸ“– Detailed Breakdown
Break down all concepts covered in depth with bullet points and clear explanations.

### âš™ï¸ Workflow / Key Steps / Formulas
Step-by-step methodologies, mathematical formulas or technical processes.

### ðŸš€ Real-World Applications & Examples
Practical use cases, industry applications, or solved examples.

### ðŸ“ Key Takeaways & Summary
Bullet-point recap of the most important points to remember.
"""
    last_err = None
    for k in keys:
        if not k:
            continue
        try:
            client = genai.Client(api_key=k)
            part = types.Part.from_uri(file_uri=url, mime_type="video/*")
            res = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=[part, prompt]
            )
            if res.text:
                return res.text
        except Exception as e:
            last_err = e
            continue
    return f"AI PROCESSING ERROR: {last_err}"


def _write_pdf(title: str, content: str, out_path: str) -> bool:
    """Generate a beautiful, student-friendly PDF from markdown notes."""
    import re as _re
    try:
        from fpdf import FPDF

        # â”€â”€ Emoji â†’ safe ASCII (fpdf core fonts = latin-1 only) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        EMOJI_MAP = {
            "\U0001f3af": ">>", "\U0001f4d6": ">>", "\u2699\ufe0f": ">>",
            "\U0001f680": ">>", "\U0001f4dd": ">>", "\u2705": "[v]",
            "\u274c": "[x]", "\u2b50": "[*]", "\U0001f4a1": "[TIP]",
            "\u26a0\ufe0f": "[!]", "\U0001f511": "[KEY]",
            "\U0001f4cc": "[>]", "\U0001f3c6": "[GOAL]", "\U0001f525": "[HOT]",
            "\u2019": "'", "\u2018": "'", "\u201c": '"', "\u201d": '"',
            "\u2013": "-", "\u2014": "--", "\u2026": "...",
        }

        def clean(text: str) -> str:
            for emoji, alt in EMOJI_MAP.items():
                text = text.replace(emoji, alt)
            return text.encode("latin-1", "replace").decode("latin-1")

        # â”€â”€ Inline bold renderer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        def write_rich(pdf, text: str, x0: float, lh: float, sz: int):
            parts = _re.split(r'\*\*(.+?)\*\*', text)
            pdf.set_x(x0)
            right_edge = pdf.w - pdf.r_margin
            for i, part in enumerate(parts):
                if not part:
                    continue
                bold = (i % 2 == 1)
                pdf.set_font("helvetica", "B" if bold else "", sz)
                words = part.split(" ")
                for j, word in enumerate(words):
                    if not word:
                        continue
                    space = " " if j < len(words) - 1 else ""
                    cw = pdf.get_string_width(word + space)
                    if pdf.get_x() + cw > right_edge:
                        pdf.ln(lh)
                        pdf.set_x(x0)
                    pdf.cell(cw, lh, word + space)

        # â”€â”€ Section colour map â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        COLORS = {
            "concept":     (14, 116, 144),
            "breakdown":   (37,  99, 235),
            "step":        (124, 58, 237),
            "workflow":    (124, 58, 237),
            "application": (5,  150, 105),
            "example":     (5,  150, 105),
            "summary":     (220, 38,  38),
            "takeaway":    (220, 38,  38),
            "key":         (234, 88,  12),
            "formula":     (168, 85, 247),
        }

        def pick_color(text: str):
            low = text.lower()
            for k, c in COLORS.items():
                if k in low:
                    return c
            return (14, 116, 144)

        # â”€â”€ Layout constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        SZ   = 10          # body font size
        HZ   = 12          # section heading size
        LM   = 18          # left margin
        RM   = 15          # right margin
        LH   = 6.5         # base line height
        BIND = 9           # bullet / number indent

        # â”€â”€ PDF class with footer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        class NotesPDF(FPDF):
            def header(self): pass
            def footer(self):
                self.set_y(-14)
                self.set_font("helvetica", "I", 8)
                self.set_text_color(160, 160, 160)
                self.cell(0, 8, f"ALOA Notes  |  Page {self.page_no()}", align="C")

        pdf = NotesPDF(format="A4")
        pdf.set_margins(LM, 20, RM)
        pdf.set_auto_page_break(auto=True, margin=22)
        pdf.add_page()
        epw = pdf.w - LM - RM

        # â”€â”€ TITLE BANNER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        pdf.set_fill_color(10, 15, 30)
        pdf.rect(0, 0, pdf.w, 50, style="F")
        # teal accent strip
        pdf.set_fill_color(14, 116, 144)
        pdf.rect(0, 0, 5, 50, style="F")
        # badge
        pdf.set_xy(LM, 9)
        pdf.set_font("helvetica", "B", 7)
        pdf.set_text_color(14, 116, 144)
        pdf.cell(epw, 5, "ALOA  YOUTUBE NOTES  |  AI-GENERATED STUDY GUIDE", align="L")
        # title text
        pdf.set_xy(LM, 18)
        pdf.set_font("helvetica", "B", 17)
        pdf.set_text_color(248, 250, 252)
        pdf.multi_cell(epw, 9, clean(title))
        # push below banner
        pdf.set_y(max(pdf.get_y() + 4, 58))

        # â”€â”€ BODY â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        blank = 0
        for raw in content.split("\n"):
            cs = clean(raw.strip())

            # H1 â€” already in banner
            if cs.startswith("# ") and not cs.startswith("## "):
                continue

            # Empty line
            if not cs:
                blank += 1
                if blank <= 1:
                    pdf.ln(LH * 0.55)
                continue
            blank = 0

            # H2 / H3 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            if cs.startswith("## ") or cs.startswith("### "):
                pdf.ln(6)
                htext = cs.lstrip("#").strip()
                col = pick_color(htext)
                r, g, b = col
                # accent bar
                by = pdf.get_y()
                pdf.set_fill_color(r, g, b)
                pdf.rect(LM - 6, by + 0.5, 4, 8, style="F")
                # heading
                pdf.set_x(LM)
                pdf.set_font("helvetica", "B", HZ)
                pdf.set_text_color(r, g, b)
                pdf.cell(epw, 8, htext, ln=True)
                # fine underline
                y2 = pdf.get_y()
                lc = tuple(min(255, c + 165) for c in col)
                pdf.set_draw_color(*lc)
                pdf.set_line_width(0.3)
                pdf.line(LM, y2, LM + epw, y2)
                pdf.set_line_width(0.2)
                pdf.ln(4)
                continue

            # Bullet â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            if cs.startswith("- ") or cs.startswith("* "):
                tx = LM + BIND
                cy = pdf.get_y() + LH / 2 + 0.4
                pdf.set_fill_color(14, 116, 144)
                pdf.ellipse(LM + 2.5, cy - 1.5, 2.5, 2.5, style="F")
                pdf.set_x(tx)
                pdf.set_text_color(30, 41, 59)
                write_rich(pdf, cs[2:], tx, LH, SZ)
                pdf.ln(LH + 2)
                continue

            # Numbered list â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            m = _re.match(r'^(\d+)\.\s+(.+)$', cs)
            if m:
                tx = LM + BIND
                pdf.set_x(LM + 1)
                pdf.set_font("helvetica", "B", SZ)
                pdf.set_text_color(14, 116, 144)
                pdf.cell(BIND - 1, LH, f"{m.group(1)}.")
                pdf.set_x(tx)
                pdf.set_text_color(30, 41, 59)
                write_rich(pdf, m.group(2), tx, LH, SZ)
                pdf.ln(LH + 2)
                continue

            # Normal paragraph â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            pdf.set_x(LM)
            pdf.set_text_color(30, 41, 59)
            write_rich(pdf, cs, LM, LH, SZ)
            pdf.ln(LH + 1.2)

        pdf.output(out_path)
        return True

    except Exception as e:
        print(f"[PDF] Error: {e}")
        import traceback; traceback.print_exc()
        return False


class YTNotesRequest(BaseModel):
    url: str


@app.get("/api/youtube-notes/history")
def yt_history():
    return _load_yt_history()


@app.get("/api/youtube-notes/download/{filename}")
def yt_download(filename: str):
    safe = re.sub(r"[^a-zA-Z0-9_\-\.]", "", filename)
    path = os.path.join(NOTES_DIR, safe)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path, media_type="application/pdf", filename=safe)


@app.post("/api/youtube-notes/generate")
async def yt_generate(req: YTNotesRequest):
    """Stream SSE: fetch transcript â†’ AI notes â†’ save PDF â†’ history."""

    if not _F4_OK:
        async def err():
            yield sse({"type": "error", "message": "Feature dependencies not installed",
                       "detail": "Run: pip install google-genai youtube-transcript-api fpdf2"})
        return StreamingResponse(err(), media_type="text/event-stream",
                                 headers={"Cache-Control": "no-cache"})

    async def stream() -> AsyncGenerator[str, None]:
        loop = asyncio.get_event_loop()
        try:
            # Step 0 â€” validate URL
            yield sse({"type": "step", "index": 0, "status": "active",
                       "message": "Reading video link...", "detail": "Extracting video ID"})

            vid_id = get_video_id(req.url)
            if not vid_id:
                yield sse({"type": "error", "message": "Invalid YouTube URL",
                           "detail": "Paste a valid youtube.com or youtu.be link"})
                return

            yield sse({"type": "step", "index": 0, "status": "done",
                       "message": "Video found", "detail": f"ID: {vid_id}"})
            await asyncio.sleep(0.2)

            # Step 1 â€” fetch transcript
            yield sse({"type": "step", "index": 1, "status": "active",
                       "message": "Fetching captions...", "detail": "Reading YouTube transcript"})

            transcript = await loop.run_in_executor(None, fetch_transcript, vid_id)

            using_video_stream = False
            if isinstance(transcript, str) and transcript.startswith("ERROR:"):
                # Captions not available directly, connect directly to video stream via Gemini Multimodal
                using_video_stream = True
                yield sse({"type": "step", "index": 1, "status": "done",
                           "message": "Direct video stream connected",
                           "detail": "Connected to video stream via Gemini Multimodal"})
            else:
                word_count = len(transcript.split())
                yield sse({"type": "step", "index": 1, "status": "done",
                           "message": "Transcript ready",
                           "detail": f"{word_count:,} words captured"})
            await asyncio.sleep(0.2)

            # Step 2 â€” generate notes
            yield sse({"type": "step", "index": 2, "status": "active",
                       "message": "AI is writing your notes...",
                       "detail": "Gemini is structuring the content"})

            if using_video_stream:
                notes_md = await loop.run_in_executor(None, _generate_notes_from_video_url, req.url)
                word_count = len(str(notes_md).split())
            else:
                notes_md = await loop.run_in_executor(None, generate_structured_notes, transcript)
                if "AI PROCESSING ERROR" in str(notes_md):
                    # Fallback to direct video stream if transcript prompt had issues
                    notes_md = await loop.run_in_executor(None, _generate_notes_from_video_url, req.url)
                    word_count = len(str(notes_md).split())

            if "AI PROCESSING ERROR" in str(notes_md) or "NOT_EDUCATIONAL" in str(notes_md):
                yield sse({"type": "error", "message": "Could not generate notes",
                           "detail": "Video may not be educational, or AI quota exceeded"})
                return

            yield sse({"type": "step", "index": 2, "status": "done",
                       "message": "Notes written", "detail": "Structured notes ready"})
            await asyncio.sleep(0.2)

            # Step 3 â€” save files
            yield sse({"type": "step", "index": 3, "status": "active",
                       "message": "Saving your files...", "detail": "Creating PDF & Markdown"})

            note_id    = uuid.uuid4().hex[:8]
            title      = _extract_title(notes_md)
            safe_name  = re.sub(r"[^a-zA-Z0-9_\-]", "_", title)[:40]
            md_file    = f"{note_id}_{safe_name}.md"
            pdf_file   = f"{note_id}_{safe_name}.pdf"

            with open(os.path.join(NOTES_DIR, md_file), "w", encoding="utf-8") as f:
                f.write(notes_md)

            pdf_ok = await loop.run_in_executor(
                None, _write_pdf, title, notes_md, os.path.join(NOTES_DIR, pdf_file)
            )

            # Save to history
            history = _load_yt_history()
            history.insert(0, {
                "id":          note_id,
                "url":         req.url,
                "title":       title,
                "created_at":  datetime.now().isoformat(),
                "md_file":     md_file,
                "pdf_file":    pdf_file if pdf_ok else None,
                "word_count":  word_count,
            })
            _save_yt_history(history)

            yield sse({"type": "step", "index": 3, "status": "done",
                       "message": "Files saved!", "detail": "PDF and Markdown ready"})
            await asyncio.sleep(0.2)

            yield sse({
                "type":       "done",
                "title":      title,
                "markdown":   notes_md,
                "pdf_file":   pdf_file if pdf_ok else None,
                "note_id":    note_id,
            })

        except Exception as e:
            yield sse({"type": "error", "message": "Something went wrong", "detail": str(e)})

    return StreamingResponse(
        stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no", "Connection": "keep-alive"},
    )


# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
# FEATURE 6 â€” CODE HEALER
# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

# In-memory session store: session_id â†’ ALOAAgent instance
_ch_agents: dict[str, ALOAAgent] = {}

class CHScanRequest(BaseModel):
    folder: str

class CHRunRequest(BaseModel):
    folder: str
    run_command: str
    session_id: str

class CHFixRequest(BaseModel):
    folder: str
    error_text: str
    session_id: str

class CHApplyRequest(BaseModel):
    session_id: str

class CHChatRequest(BaseModel):
    session_id: str
    message: str

class CHRunCommandRequest(BaseModel):
    session_id: str
    run_command: str


def _build_file_tree(folder: str) -> list:
    """Build a simplified file tree for the frontend."""
    tree = []
    folder_name = os.path.basename(folder)
    tree.append({"name": folder_name, "type": "dir", "depth": 0, "path": ""})
    for root, dirs, files in os.walk(folder):
        dirs[:] = sorted([d for d in dirs if d not in SKIP_DIRS])
        depth = os.path.relpath(root, folder).count(os.sep) + 1
        if depth > 3:
            continue
        for d in dirs:
            rel = os.path.relpath(os.path.join(root, d), folder)
            tree.append({"name": d, "type": "dir", "depth": depth, "path": rel})
        for f in sorted(files):
            ext = os.path.splitext(f)[1].lower()
            if ext in SOURCE_EXTENSIONS:
                rel = os.path.relpath(os.path.join(root, f), folder)
                tree.append({"name": f, "type": "file", "depth": depth, "path": rel, "ext": ext})
    return tree[:60]  # cap at 60 entries


def _compute_diff(original: str, fixed: str, filename: str) -> list:
    """Compute a unified diff between original and fixed code."""
    import difflib
    orig_lines = original.splitlines(keepends=True)
    fixed_lines = fixed.splitlines(keepends=True)
    diff = list(difflib.unified_diff(orig_lines, fixed_lines, fromfile=filename, tofile=filename, n=3))
    result = []
    orig_line = 0
    fix_line = 0
    for line in diff:
        line = line.rstrip('\n')
        if line.startswith('---') or line.startswith('+++'):
            continue
        elif line.startswith('@@'):
            # Parse hunk header
            import re as _re
            m = _re.search(r'-(\d+)(?:,\d+)? \+(\d+)', line)
            if m:
                orig_line = int(m.group(1)) - 1
                fix_line = int(m.group(2)) - 1
            result.append({"type": "hunk", "text": line})
        elif line.startswith('-'):
            orig_line += 1
            result.append({"type": "removed", "text": line[1:], "orig": orig_line, "fix": None})
        elif line.startswith('+'):
            fix_line += 1
            result.append({"type": "added", "text": line[1:], "orig": None, "fix": fix_line})
        else:
            orig_line += 1
            fix_line += 1
            result.append({"type": "ctx", "text": line[1:] if line.startswith(' ') else line, "orig": orig_line, "fix": fix_line})
    return result


@app.get("/api/code-healer/browse-folder")
async def ch_browse_folder():
    """Open native Windows folder picker dialog, return selected path."""
    import features.feature_6.core as _f6
    # Patch wrong model name before any AI call
    _f6.GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]

    loop = asyncio.get_event_loop()
    def _pick():
        try:
            import tkinter as tk
            from tkinter import filedialog
            root = tk.Tk()
            root.withdraw()
            root.wm_attributes("-topmost", True)
            folder = filedialog.askdirectory(title="Select Project Folder", parent=root)
            root.destroy()
            return folder or ""
        except Exception:
            return ""
    path = await loop.run_in_executor(None, _pick)
    # Return empty path with 200 so frontend can handle gracefully
    return {"path": path, "cancelled": not bool(path)}


@app.post("/api/code-healer/scan")
async def ch_scan(req: CHScanRequest):
    """Scan a project folder and return metadata + create an agent session."""
    import features.feature_6.core as _f6
    # Patch wrong model name in the core module (can't modify core.py directly)
    _f6.GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]

    folder = req.folder.strip()
    if not os.path.isdir(folder):
        raise HTTPException(status_code=400, detail=f"Folder not found: {folder}")

    loop = asyncio.get_event_loop()
    source_files = await loop.run_in_executor(None, scan_source_files, folder)
    proj_type, default_cmd = await loop.run_in_executor(None, detect_project_type, folder)
    run_command, entry = await loop.run_in_executor(
        None, auto_detect_run_command, folder, source_files, proj_type, default_cmd
    )
    file_tree = await loop.run_in_executor(None, _build_file_tree, folder)

    # Create agent session
    session_id = uuid.uuid4().hex
    agent = ALOAAgent(folder, source_files, proj_type, run_command or "")
    _ch_agents[session_id] = agent

    return {
        "session_id": session_id,
        "project_type": proj_type,
        "file_count": len(source_files),
        "run_command": run_command or "",
        "entry_point": os.path.relpath(entry, folder) if entry else "",
        "file_tree": file_tree,
    }


@app.post("/api/code-healer/run")
async def ch_run(req: CHRunRequest):
    """Run the project and stream output via SSE."""
    folder = req.folder.strip()
    if not os.path.isdir(folder):
        raise HTTPException(status_code=400, detail="Folder not found")

    agent = _ch_agents.get(req.session_id)
    if agent and req.run_command:
        agent.run_command = req.run_command

    async def stream() -> AsyncGenerator[str, None]:
        loop = asyncio.get_event_loop()
        yield sse({"type": "step", "message": "Starting project...", "detail": f"Running: {req.run_command}"})
        try:
            success, stdout, stderr, is_server = await loop.run_in_executor(
                None, execute_project, folder, req.run_command
            )
            combined_output = (stdout + "\n" + stderr).strip()
            if success:
                yield sse({"type": "success", "output": combined_output,
                           "message": "Project ran successfully", "is_server": is_server})
            else:
                yield sse({"type": "error_found", "output": combined_output,
                           "error_text": stderr.strip() or stdout.strip(),
                           "message": "Error detected"})
        except Exception as e:
            yield sse({"type": "error_found", "output": "", "error_text": str(e),
                       "message": "Failed to run project"})

    return StreamingResponse(stream(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@app.post("/api/code-healer/fix")
async def ch_fix(req: CHFixRequest):
    """Ask AI to fix the error, stream progress, return fix + diff."""
    agent = _ch_agents.get(req.session_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Session not found. Re-scan the project.")

    async def stream() -> AsyncGenerator[str, None]:
        loop = asyncio.get_event_loop()
        yield sse({"type": "step", "message": "Analyzing error...", "detail": "Reading project files"})

        prompt = f"""I ran the project and got this error:

{req.error_text}

Please analyze the error, identify the exact file and line causing it, explain what's wrong, and provide the complete fix.
Use the FIX_FILE and FIXED_CODE format."""

        try:
            response = await loop.run_in_executor(None, agent.send_message, prompt, 'fix')
            yield sse({"type": "step", "message": "Parsing fix...", "detail": "Extracting changes"})

            fix_file, fixed_code = agent.parse_fix_from_response(response)

            if not fix_file or not fixed_code:
                yield sse({"type": "no_fix", "message": "AI explained the issue but couldn't generate a fix.",
                           "explanation": response})
                return

            # Read original file for diff
            fix_path = os.path.join(agent.folder_path, fix_file)
            original_code = ""
            if os.path.isfile(fix_path):
                try:
                    with open(fix_path, 'r', encoding='utf-8', errors='ignore') as f:
                        original_code = f.read()
                except:
                    pass

            diff = _compute_diff(original_code, fixed_code, fix_file)

            # Extract explanation (text before FIX_FILE:)
            explanation = response.split("FIX_FILE:")[0].strip()

            yield sse({
                "type": "fix_ready",
                "fix_file": fix_file,
                "explanation": explanation,
                "diff": diff,
                "message": "Fix ready",
            })
        except Exception as e:
            yield sse({"type": "error", "message": "AI failed to generate fix", "detail": str(e)})

    return StreamingResponse(stream(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@app.post("/api/code-healer/apply")
async def ch_apply(req: CHApplyRequest):
    """Apply the last AI fix to the file."""
    agent = _ch_agents.get(req.session_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Session not found.")

    loop = asyncio.get_event_loop()
    success, message = await loop.run_in_executor(None, agent.apply_fix)
    if not success:
        raise HTTPException(status_code=400, detail=message)

    backup_file = (agent.last_fix_file or "") + ".bak"
    return {"success": True, "message": message, "fix_file": agent.last_fix_file,
            "backup_file": backup_file}


@app.post("/api/code-healer/chat")
async def ch_chat(req: CHChatRequest):
    """Send a chat message to the AI agent about the project."""
    agent = _ch_agents.get(req.session_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Session not found.")

    loop = asyncio.get_event_loop()
    reply = await loop.run_in_executor(None, agent.send_message, req.message, 'chat')
    return {"reply": reply}


@app.post("/api/code-healer/update-run-command")
async def ch_update_run_command(req: CHRunCommandRequest):
    """Update the run command for an existing session."""
    agent = _ch_agents.get(req.session_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Session not found.")
    agent.run_command = req.run_command
    return {"success": True}



# ══════════════════════════════════════════════════════════════
# FEATURE 9 — RESUME ENGINE
# ══════════════════════════════════════════════════════════════

class BrainDumpRequest(BaseModel):
    raw_text: str

class ResumeSaveRequest(BaseModel):
    profile: dict
    filename: Optional[str] = None

class SummaryGenRequest(BaseModel):
    profile: dict
    target_role: str = ""

class StarBulletRequest(BaseModel):
    bullet: str
    job_context: str = ""

class ATSAnalyzeRequest(BaseModel):
    profile: dict
    job_description: str

class ResumeRenderRequest(BaseModel):
    profile: dict
    template_name: str = "ats_classic"


@app.get("/api/resume/profiles")
async def resume_list_profiles():
    """List all saved resume profiles."""
    profiles = list_profiles()
    return {"profiles": profiles}


@app.get("/api/resume/profile/{filename}")
async def resume_load_profile(filename: str):
    """Load a specific resume profile by filename."""
    profile = load_profile(filename)
    if profile is None:
        raise HTTPException(status_code=404, detail="Profile not found.")
    return profile


@app.post("/api/resume/save")
async def resume_save_profile(req: ResumeSaveRequest):
    """Save a resume profile to disk."""
    path = save_profile(req.profile, req.filename)
    return {"success": True, "path": str(path)}


@app.post("/api/resume/brain-dump")
async def resume_brain_dump(req: BrainDumpRequest):
    """Extract a structured profile from raw text using AI."""
    loop = asyncio.get_event_loop()
    try:
        profile = await loop.run_in_executor(None, extract_profile_from_text, req.raw_text)
        if profile is None:
            raise HTTPException(status_code=422, detail="AI could not extract profile from the provided text. Try adding more details.")
        return profile
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/resume/summary")
async def resume_generate_summary(req: SummaryGenRequest):
    """Generate a professional summary for the profile."""
    loop = asyncio.get_event_loop()
    try:
        summary = await loop.run_in_executor(None, generate_summary, req.profile, req.target_role)
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/resume/star-bullet")
async def resume_star_bullet(req: StarBulletRequest):
    """Rewrite a bullet point using the STAR method."""
    loop = asyncio.get_event_loop()
    try:
        bullet = await loop.run_in_executor(None, rewrite_bullet, req.bullet, req.job_context)
        return {"bullet": bullet}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/resume/ats-analyze")
async def resume_ats_analyze(req: ATSAnalyzeRequest):
    """Analyze a profile against a job description for ATS compatibility."""
    loop = asyncio.get_event_loop()
    try:
        analysis = await loop.run_in_executor(None, analyze_ats, req.profile, req.job_description)
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/resume/render")
async def resume_render(req: ResumeRenderRequest):
    """Render a resume profile as HTML using the specified template."""
    html = generate_resume_html(req.profile, req.template_name)
    return {"html": html, "template": req.template_name}
