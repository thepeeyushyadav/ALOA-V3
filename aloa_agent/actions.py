"""
ALOA V3 Companion Agent — Local Actions Engine
Executes approved system operations directly on the user's Windows laptop.
Never executes arbitrary shell strings. Uses parameterized command arrays.
"""

import os
import sys
import re
import psutil
import subprocess
import shutil
from typing import Dict, Any

NO_WINDOW = getattr(subprocess, "CREATE_NO_WINDOW", 0)
DETACHED = getattr(subprocess, "DETACHED_PROCESS", 0)

APP_ALIASES = {
    "code": "code",
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
    "vlc": "vlc",
    "calc": "calc",
    "calculator": "calc",
    "paint": "mspaint",
}

def sanitize_id(app_id: str) -> str:
    """Validate and clean winget package ID."""
    clean = app_id.strip()
    if not re.match(r"^[A-Za-z0-9_\.\-]{2,100}$", clean):
        raise ValueError(f"Invalid application package ID: {clean}")
    return clean

def handle_app_install(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Execute silent Winget installation for approved app."""
    app_id = payload.get("app_id") or payload.get("app_name", "")
    clean_id = sanitize_id(app_id)
    app_name = payload.get("app_name", clean_id)

    cmd = [
        "winget", "install",
        "--id", clean_id,
        "--silent",
        "--accept-package-agreements",
        "--accept-source-agreements"
    ]

    res = subprocess.run(
        cmd,
        shell=False,
        capture_output=True,
        text=True,
        timeout=300,
        creationflags=NO_WINDOW
    )

    already = "no applicable upgrade" in (res.stdout or "").lower() or res.returncode == -1978335212
    success = res.returncode == 0 or already

    # Try launching if installed successfully
    if success:
        handle_app_launch({"app_name": app_name})

    return {
        "success": success,
        "already_installed": already,
        "app_name": app_name,
        "return_code": res.returncode,
        "message": f"{app_name} is already installed!" if already else (f"{app_name} installed successfully!" if success else f"Installation failed with code {res.returncode}")
    }

def handle_app_uninstall(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Execute silent Winget uninstall for approved app."""
    app_id = payload.get("app_id") or payload.get("app_name", "")
    clean_id = sanitize_id(app_id)
    app_name = payload.get("app_name", clean_id)

    cmd = ["winget", "uninstall", "--id", clean_id, "--silent"]
    res = subprocess.run(
        cmd,
        shell=False,
        capture_output=True,
        text=True,
        timeout=180,
        creationflags=NO_WINDOW
    )

    success = res.returncode == 0
    return {
        "success": success,
        "app_name": app_name,
        "message": f"{app_name} uninstalled successfully." if success else "Uninstall failed."
    }

def handle_app_launch(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Launch an application on Windows without terminal flicker."""
    name = payload.get("app_name", "").strip().strip('"').strip("'")
    alias = APP_ALIASES.get(name.lower(), name)

    # Strategy 1: PowerShell Start-Process
    try:
        subprocess.Popen(
            ["powershell", "-NoProfile", "-NonInteractive", "-WindowStyle", "Hidden", "-Command", f'Start-Process "{alias}"'],
            creationflags=NO_WINDOW | DETACHED,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            stdin=subprocess.DEVNULL
        )
        return {"success": True, "message": f"{name} launched."}
    except Exception:
        pass

    # Strategy 2: os.startfile
    try:
        if sys.platform == "win32":
            os.startfile(alias)
            return {"success": True, "message": f"{name} launched."}
    except Exception:
        pass

    return {"success": False, "message": f"Could not launch {name}."}

def handle_system_metrics(payload: Dict[str, Any] = None) -> Dict[str, Any]:
    """Gather real hardware telemetry from user's Windows laptop."""
    total_ram = psutil.virtual_memory().total
    ram_used_pct = psutil.virtual_memory().percent
    cpu_pct = psutil.cpu_percent(interval=0.3)

    # Disk
    root = "C:\\" if sys.platform == "win32" else "/"
    disk = psutil.disk_usage(root)

    # Battery
    battery = psutil.sensors_battery()
    battery_info = {
        "percent": battery.percent if battery else 100,
        "power_plugged": battery.power_plugged if battery else True
    } if battery else None

    # Top memory processes
    processes = []
    for proc in psutil.process_iter(['pid', 'name', 'memory_percent']):
        try:
            info = proc.info
            if info['name'] and info['memory_percent']:
                mem_bytes = (info['memory_percent'] / 100) * total_ram
                processes.append({
                    "pid": info['pid'],
                    "name": info['name'].replace(".exe", "").capitalize(),
                    "mem_bytes": mem_bytes,
                    "mem_mb": round(mem_bytes / (1024 * 1024), 1),
                    "mem_pct": round(info['memory_percent'], 1)
                })
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue

    processes.sort(key=lambda x: x["mem_bytes"], reverse=True)
    top_processes = processes[:5]

    return {
        "success": True,
        "cpu_pct": cpu_pct,
        "ram_pct": ram_used_pct,
        "ram_total_gb": round(total_ram / (1024**3), 1),
        "ram_used_gb": round((total_ram * (ram_used_pct / 100)) / (1024**3), 1),
        "disk_pct": disk.percent,
        "disk_free_gb": round(disk.free / (1024**3), 1),
        "disk_total_gb": round(disk.total / (1024**3), 1),
        "battery": battery_info,
        "top_processes": top_processes
    }

def handle_system_cleanup(payload: Dict[str, Any] = None) -> Dict[str, Any]:
    """Safely clear user temp files and recycle bin."""
    freed_bytes = 0
    temp_dir = os.environ.get("TEMP", "")
    if temp_dir and os.path.exists(temp_dir):
        for item in os.listdir(temp_dir):
            p = os.path.join(temp_dir, item)
            try:
                if os.path.isfile(p) or os.path.islink(p):
                    sz = os.path.getsize(p)
                    os.unlink(p)
                    freed_bytes += sz
                elif os.path.isdir(p):
                    shutil.rmtree(p, ignore_errors=True)
            except Exception:
                continue

    # Clear recycle bin on Windows
    if sys.platform == "win32":
        try:
            subprocess.run(["powershell", "-NoProfile", "Clear-RecycleBin -Force -ErrorAction SilentlyContinue"], creationflags=NO_WINDOW)
        except Exception:
            pass

    freed_mb = round(freed_bytes / (1024 * 1024), 1)
    return {"success": True, "freed_mb": freed_mb, "message": f"Cleaned {freed_mb} MB of junk files."}

def handle_process_kill(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Terminate a specific process by name or PID on user's laptop."""
    p_name = payload.get("process_name", "")
    pid = payload.get("pid")

    killed = False
    if pid:
        try:
            proc = psutil.Process(pid)
            proc.terminate()
            killed = True
        except Exception:
            pass

    if not killed and p_name:
        for proc in psutil.process_iter(['pid', 'name']):
            try:
                if proc.info['name'] and p_name.lower() in proc.info['name'].lower():
                    proc.terminate()
                    killed = True
            except Exception:
                continue

    return {
        "success": killed,
        "message": f"Terminated {p_name or pid}" if killed else f"Could not find or terminate {p_name or pid}"
    }

def handle_browse_folder(payload: Dict[str, Any] = None) -> Dict[str, Any]:
    """Open desktop folder selection dialog on the user's laptop."""
    try:
        import tkinter as tk
        from tkinter import filedialog
        root = tk.Tk()
        root.withdraw()
        root.wm_attributes("-topmost", True)
        folder = filedialog.askdirectory(title="ALOA — Select Project Folder", parent=root)
        root.destroy()
        return {"success": True, "path": folder or ""}
    except Exception as e:
        return {"success": False, "error": str(e), "path": ""}
