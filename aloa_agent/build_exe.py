"""
ALOA V3 — PyInstaller Packaging Script for Windows Agent
Builds a standalone executable: aloa_agent/dist/aloa-agent.exe
"""

import os
import sys
import subprocess

def build():
    agent_dir = os.path.dirname(os.path.abspath(__file__))
    main_py = os.path.join(agent_dir, "main.py")
    dist_dir = os.path.join(agent_dir, "dist")
    build_dir = os.path.join(agent_dir, "build")

    print("[ALOA] Packaging Windows Companion Agent with PyInstaller...")

    cmd = [
        sys.executable, "-m", "PyInstaller",
        "--noconfirm",
        "--clean",
        "--onefile",
        "--name", "aloa-agent",
        "--distpath", dist_dir,
        "--workpath", build_dir,
        "--hidden-import", "websockets",
        "--hidden-import", "psutil",
        main_py
    ]

    res = subprocess.run(cmd)
    if res.returncode == 0:
        exe_path = os.path.join(dist_dir, "aloa-agent.exe")
        print(f"\n[ALOA SUCCESS] Standalone executable compiled successfully:\n-> {exe_path}")
    else:
        print(f"\n[ALOA ERROR] PyInstaller build failed with code {res.returncode}")

if __name__ == "__main__":
    build()
