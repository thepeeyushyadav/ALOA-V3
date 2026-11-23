"""
THE ALOA V3 — Windows Companion Application Entry Point
Usage:
  python -m aloa_agent.main [--server wss://api.aloav3.com/ws/agent]
"""

import os
import sys
import argparse
import asyncio
import threading
from aloa_agent.ui import AgentAppUI
from aloa_agent.client import AgentClient

DEFAULT_PROD_URL = "wss://api.aloav3.com/ws/agent"
DEFAULT_DEV_URL = "ws://localhost:8000/ws/agent"

def main():
    parser = argparse.ArgumentParser(description="ALOA V3 Windows Companion Agent")
    parser.add_argument(
        "--server",
        type=str,
        default=os.environ.get("ALOA_SERVER_URL", DEFAULT_DEV_URL),
        help=f"Backend WebSocket URL (default: {DEFAULT_DEV_URL})"
    )
    parser.add_argument(
        "--no-ui",
        action="store_true",
        help="Run without graphical window (terminal logging only)"
    )
    args = parser.parse_args()

    ui = None
    if not args.no_ui:
        ui = AgentAppUI()

    client = AgentClient(server_url=args.server, ui=ui)

    def run_async_loop():
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(client.run())
        finally:
            loop.close()

    # Start WebSocket client in dedicated worker thread
    t = threading.Thread(target=run_async_loop, daemon=True)
    t.start()

    if ui:
        ui.start()
    else:
        print(f"[ALOA] Windows Agent running headlessly connecting to {args.server}. Press Ctrl+C to exit.")
        try:
            while True:
                threading.Event().wait(1)
        except KeyboardInterrupt:
            client.stop()
            print("[ALOA] Agent shutting down.")

if __name__ == "__main__":
    main()
