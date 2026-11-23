"""
ALOA V3 Companion Agent — Desktop User Interface
Provides visual connection status, pairing code display, and interactive
approval confirmation modals for system-changing operations.
"""

import sys
import tkinter as tk
from tkinter import ttk, messagebox
import threading
from typing import Callable, Optional

class AgentAppUI:
    def __init__(self, on_close: Optional[Callable] = None):
        self.on_close = on_close
        self.root = None
        self.code_label = None
        self.status_label = None
        self.status_dot = None
        self.log_box = None
        self.current_code = "------"
        self._is_ready = threading.Event()

    def start(self):
        """Run the Tkinter main loop in the current thread."""
        self.root = tk.Tk()
        self.root.title("THE ALOA V3 — Windows Companion")
        self.root.geometry("460x520")
        self.root.resizable(False, False)
        self.root.configure(bg="#0f172a")

        # Set protocol for clean exit
        self.root.protocol("WM_DELETE_WINDOW", self._handle_close)

        # Style configuration
        style = ttk.Style()
        style.theme_use("clam")

        # Header Frame
        header = tk.Frame(self.root, bg="#1e293b", padx=16, pady=14)
        header.pack(fill="x")

        title = tk.Label(
            header,
            text="THE ALOA V3",
            font=("Segoe UI", 14, "bold"),
            fg="#f8fafc",
            bg="#1e293b"
        )
        title.pack(anchor="w")

        subtitle = tk.Label(
            header,
            text="Autonomous Laptop Operating Agent • Windows Companion",
            font=("Segoe UI", 8),
            fg="#94a3b8",
            bg="#1e293b"
        )
        subtitle.pack(anchor="w")

        # Connection Status Bar
        status_bar = tk.Frame(self.root, bg="#0f172a", padx=16, pady=10)
        status_bar.pack(fill="x")

        self.status_dot = tk.Label(status_bar, text="●", font=("Segoe UI", 12), fg="#f59e0b", bg="#0f172a")
        self.status_dot.pack(side="left", padx=(0, 6))

        self.status_label = tk.Label(
            status_bar,
            text="Connecting to cloud...",
            font=("Segoe UI", 9),
            fg="#cbd5e1",
            bg="#0f172a"
        )
        self.status_label.pack(side="left")

        # Pairing Card
        card = tk.Frame(self.root, bg="#1e293b", padx=20, pady=16, relief="flat", highlightbackground="#334155", highlightthickness=1)
        card.pack(fill="x", padx=16, pady=10)

        card_title = tk.Label(
            card,
            text="YOUR DEVICE PAIRING CODE",
            font=("Segoe UI", 8, "bold"),
            fg="#38bdf8",
            bg="#1e293b"
        )
        card_title.pack()

        self.code_label = tk.Label(
            card,
            text=self.current_code,
            font=("Consolas", 26, "bold"),
            fg="#f8fafc",
            bg="#1e293b",
            pady=8
        )
        self.code_label.pack()

        instr = tk.Label(
            card,
            text="Enter this 6-character code at aloav3.com to link this laptop.",
            font=("Segoe UI", 8),
            fg="#94a3b8",
            bg="#1e293b"
        )
        instr.pack(pady=(0, 8))

        copy_btn = tk.Button(
            card,
            text="Copy Pairing Code",
            font=("Segoe UI", 9, "bold"),
            bg="#0284c7",
            fg="#ffffff",
            activebackground="#0369a1",
            activeforeground="#ffffff",
            relief="flat",
            padx=12,
            pady=4,
            cursor="hand2",
            command=self._copy_code
        )
        copy_btn.pack()

        # Activity Log Section
        log_frame = tk.Frame(self.root, bg="#0f172a", padx=16, pady=6)
        log_frame.pack(fill="both", expand=True)

        log_label = tk.Label(log_frame, text="Activity & Operation Log", font=("Segoe UI", 8, "bold"), fg="#64748b", bg="#0f172a")
        log_label.pack(anchor="w", pady=(0, 4))

        self.log_box = tk.Text(
            log_frame,
            font=("Consolas", 8),
            bg="#090d16",
            fg="#94a3b8",
            relief="flat",
            height=8,
            padx=8,
            pady=8,
            highlightbackground="#1e293b",
            highlightthickness=1
        )
        self.log_box.pack(fill="both", expand=True)
        self.log_box.insert("end", "[ALOA] Companion Agent initialized.\n")
        self.log_box.configure(state="disabled")

        # Ready event
        self._is_ready.set()
        self.root.mainloop()

    def _copy_code(self):
        """Copy current pairing code to clipboard."""
        if self.root and self.current_code:
            self.root.clipboard_clear()
            self.root.clipboard_append(self.current_code)
            self.log("Pairing code copied to clipboard.")

    def set_pairing_code(self, code: str):
        """Update pairing code on the UI thread."""
        self.current_code = code
        if self.root and self.code_label:
            self.root.after(0, lambda: self.code_label.config(text=code))

    def set_connected(self, is_connected: bool, endpoint_name: str = "api.aloav3.com"):
        """Update connection dot and status label."""
        if not self.root:
            return
        def _update():
            if is_connected:
                self.status_dot.config(text="●", fg="#22c55e")
                self.status_label.config(text=f"Connected to {endpoint_name}")
            else:
                self.status_dot.config(text="●", fg="#ef4444")
                self.status_label.config(text="Disconnected — Reconnecting...")
        self.root.after(0, _update)

    def log(self, message: str):
        """Append a message to the UI activity box."""
        if not self.root or not self.log_box:
            return
        def _append():
            self.log_box.configure(state="normal")
            self.log_box.insert("end", f"> {message}\n")
            self.log_box.see("end")
            self.log_box.configure(state="disabled")
        self.root.after(0, _append)

    def ask_approval(self, title: str, message: str) -> bool:
        """
        Pop up an explicit user confirmation dialog on the desktop.
        Must be approved by the local user before executing system changes.
        """
        result = [False]
        event = threading.Event()

        def _ask():
            res = messagebox.askyesno(
                f"ALOA Security Approval — {title}",
                f"{message}\n\nDo you want to allow this operation on your laptop?",
                parent=self.root
            )
            result[0] = res
            event.set()

        if self.root:
            self.root.after(0, _ask)
            event.wait()
            return result[0]
        return False

    def _handle_close(self):
        if self.on_close:
            self.on_close()
        if self.root:
            self.root.destroy()
            self.root = None
