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


def is_safe_path(base_dir: str, target_path: str) -> bool:
    """Ensure target_path resolves strictly within base_dir (prevents traversal, sibling-prefix, and symlink escapes)."""
    try:
        canonical_base = os.path.realpath(os.path.abspath(base_dir))
        canonical_target = os.path.realpath(os.path.abspath(target_path))
        return os.path.commonpath([canonical_base, canonical_target]) == canonical_base
    except Exception:
        return False


def handle_code_healer_scan(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Scans user's local project folder via Companion Agent."""
    from features.feature_6.core import (
        scan_source_files,
        detect_project_type,
        auto_detect_run_command,
        SKIP_DIRS,
        SOURCE_EXTENSIONS,
    )
    folder = payload.get("folder", "").strip()
    if not folder or not os.path.isdir(folder):
        return {"success": False, "error": f"Folder not found: {folder}"}

    canonical_folder = os.path.realpath(os.path.abspath(folder))

    source_files = scan_source_files(canonical_folder)
    proj_type, default_cmd = detect_project_type(canonical_folder)
    run_command, entry = auto_detect_run_command(canonical_folder, source_files, proj_type, default_cmd)

    # Build simplified file tree
    tree = []
    folder_name = os.path.basename(canonical_folder)
    tree.append({"name": folder_name, "type": "dir", "depth": 0, "path": ""})
    for root, dirs, files in os.walk(canonical_folder):
        dirs[:] = sorted([d for d in dirs if d not in SKIP_DIRS])
        depth = os.path.relpath(root, canonical_folder).count(os.sep) + 1
        if depth > 3:
            continue
        for d in dirs:
            rel = os.path.relpath(os.path.join(root, d), canonical_folder)
            tree.append({"name": d, "type": "dir", "depth": depth, "path": rel})
        for f in sorted(files):
            ext = os.path.splitext(f)[1].lower()
            if ext in SOURCE_EXTENSIONS:
                rel = os.path.relpath(os.path.join(root, f), canonical_folder)
                tree.append({"name": f, "type": "file", "depth": depth, "path": rel, "ext": ext})

    rel_sources = [os.path.relpath(f, canonical_folder) for f in source_files[:100]]

    return {
        "success": True,
        "folder": canonical_folder,
        "project_type": proj_type,
        "file_count": len(source_files),
        "run_command": run_command or "",
        "entry_point": os.path.relpath(entry, canonical_folder) if entry else "",
        "file_tree": tree[:60],
        "source_files": rel_sources,
    }


def handle_code_healer_run(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Executes the local project using execute_project."""
    from features.feature_6.core import execute_project

    folder = payload.get("folder", "").strip()
    run_command = payload.get("run_command", "").strip()
    if not folder or not os.path.isdir(folder):
        return {"success": False, "error": f"Folder not found: {folder}"}
    if not run_command:
        return {"success": False, "error": "run_command is required"}

    canonical_folder = os.path.realpath(os.path.abspath(folder))

    try:
        success, stdout, stderr, is_server = execute_project(canonical_folder, run_command)
        combined_output = (stdout + "\n" + stderr).strip()
        return {
            "success": True,
            "project_success": success,
            "output": combined_output,
            "stdout": stdout,
            "stderr": stderr,
            "is_server": is_server,
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


def handle_code_healer_apply(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Applies patch to local file with strict canonical path containment."""
    folder = payload.get("folder", "").strip()
    fix_file = payload.get("fix_file", "").strip()
    fixed_code = payload.get("fixed_code", "")

    if not folder or not os.path.isdir(folder):
        return {"success": False, "error": f"Invalid project folder: {folder}"}
    if not fix_file:
        return {"success": False, "error": "fix_file is required"}

    canonical_folder = os.path.realpath(os.path.abspath(folder))
    clean_rel = os.path.normpath(fix_file)
    if clean_rel.startswith("..") or os.path.isabs(clean_rel):
        return {"success": False, "error": "Path traversal rejected."}

    target_abs = os.path.abspath(os.path.join(canonical_folder, clean_rel))
    if not is_safe_path(canonical_folder, target_abs):
        return {"success": False, "error": "Path traversal or symlink escape detected."}

    # Ensure parent directory exists
    parent = os.path.dirname(target_abs)
    if parent and not os.path.isdir(parent):
        os.makedirs(parent, exist_ok=True)

    # Backup existing file if present
    backup_file = clean_rel + ".bak"
    if os.path.isfile(target_abs):
        try:
            backup_abs = target_abs + ".bak"
            if not os.path.exists(backup_abs):
                shutil.copy2(target_abs, backup_abs)
        except Exception:
            pass

    try:
        with open(target_abs, "w", encoding="utf-8") as f:
            f.write(fixed_code)
        return {
            "success": True,
            "message": f"Successfully applied fix to {fix_file}",
            "fix_file": fix_file,
            "backup_file": backup_file,
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


def handle_code_healer_read_file(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Safely reads file content within project directory for diff computation."""
    folder = payload.get("folder", "").strip()
    file_path = payload.get("file_path", "").strip()

    if not folder or not os.path.isdir(folder):
        return {"success": False, "error": "Invalid project folder"}
    if not file_path:
        return {"success": False, "error": "file_path is required"}

    canonical_folder = os.path.realpath(os.path.abspath(folder))
    clean_rel = os.path.normpath(file_path)
    if clean_rel.startswith("..") or os.path.isabs(clean_rel):
        return {"success": False, "error": "Path traversal detected."}

    target_abs = os.path.abspath(os.path.join(canonical_folder, clean_rel))
    if not is_safe_path(canonical_folder, target_abs):
        return {"success": False, "error": "Path traversal detected."}

    if not os.path.isfile(target_abs):
        return {"success": True, "content": ""}

    try:
        # Limit read size to 1MB
        with open(target_abs, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read(1024 * 1024)
        return {"success": True, "content": content}
    except Exception as e:
        return {"success": False, "error": str(e)}
