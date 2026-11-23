"""
ALOA V3 Companion Agent — WebSocket Client
Maintains an encrypted, outbound WebSocket tunnel to the ALOA cloud backend.
Bypasses firewalls and NAT without router port forwarding.
"""

import os
import sys
import json
import time
import socket
import asyncio
import logging
import platform
import websockets
from typing import Optional, Callable
from aloa_agent.actions import (
    handle_app_install,
    handle_app_uninstall,
    handle_app_launch,
    handle_system_metrics,
    handle_system_cleanup,
    handle_process_kill,
    handle_browse_folder,
    handle_code_healer_scan,
    handle_code_healer_run,
    handle_code_healer_apply,
    handle_code_healer_read_file,
)

logger = logging.getLogger("aloa.agent_client")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

class AgentClient:
    def __init__(self, server_url: str, ui=None):
        self.server_url = server_url
        self.ui = ui
        self.running = True
        self.agent_id: Optional[str] = None
        self.pairing_code: Optional[str] = None
        self.ws = None

    def stop(self):
        self.running = False

    async def run(self):
        """Persistent connection loop with exponential backoff."""
        delay = 2
        while self.running:
            try:
                if self.ui:
                    self.ui.set_connected(False)
                    self.ui.log(f"Connecting to {self.server_url}...")

                async with websockets.connect(self.server_url, ping_interval=20, ping_timeout=10) as ws:
                    self.ws = ws
                    delay = 2  # reset backoff on success

                    # 1. Send handshake metadata
                    metadata = {
                        "type": "HANDSHAKE",
                        "hostname": socket.gethostname(),
                        "os": f"{platform.system()} {platform.release()}",
                        "version": "3.0.0",
                        "timestamp": time.time()
                    }
                    await ws.send(json.dumps(metadata))

                    # 2. Receive welcome / pairing code
                    msg_raw = await ws.recv()
                    data = json.loads(msg_raw)
                    if data.get("type") == "REGISTERED":
                        self.agent_id = data.get("agent_id")
                        self.pairing_code = data.get("pairing_code")
                        logger.info(f"Registered as {self.agent_id}. Pairing Code: {self.pairing_code}")
                        if self.ui:
                            self.ui.set_connected(True, self.server_url.split("/")[2])
                            self.ui.set_pairing_code(self.pairing_code)
                            self.ui.log(f"Registered with cloud. Pairing Code: {self.pairing_code}")

                    # 3. Message loop
                    async for message in ws:
                        if not self.running:
                            break
                        await self._process_message(json.loads(message))

            except (websockets.ConnectionClosed, ConnectionRefusedError, socket.gaierror) as e:
                logger.warning(f"Connection lost: {e}. Reconnecting in {delay}s...")
                if self.ui:
                    self.ui.set_connected(False)
                    self.ui.log(f"Connection dropped. Retrying in {delay}s...")
                await asyncio.sleep(delay)
                delay = min(delay * 1.5, 30)
            except Exception as e:
                logger.error(f"Unexpected client error: {e}")
                await asyncio.sleep(delay)

    async def _process_message(self, data: dict):
        """Handle incoming command messages from cloud."""
        msg_type = data.get("type")
        request_id = data.get("request_id")
        action = data.get("action")
        payload = data.get("payload", {})

        if msg_type == "ACTION_DISPATCH":
            logger.info(f"Received action: {action} (request_id={request_id})")
            if self.ui:
                self.ui.log(f"Action received: {action}")

            # Run action handler (with user approval if system-changing)
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(None, self._execute_action_with_consent, action, payload)

            # Send response back to cloud
            response = {
                "type": "ACTION_RESULT" if result.get("success", False) else "ACTION_ERROR",
                "request_id": request_id,
                "data": result,
                "error": result.get("error") if not result.get("success") else None
            }
            if self.ws:
                await self.ws.send(json.dumps(response))
                if self.ui:
                    self.ui.log(f"Action {action} completed: {'Success' if result.get('success') else 'Failed'}")

    def _execute_action_with_consent(self, action: str, payload: dict) -> dict:
        """Enforces mandatory local user approval for destructive/system operations."""
        try:
            # 1. System Insights & Metrics (Read-only -> no destructive confirmation needed)
            if action in ("SYSTEM_METRICS", "GET_SYSTEM_METRICS"):
                return handle_system_metrics(payload)

            # 2. Browse Folder Dialog (Opens native picker -> user selects explicitly)
            elif action == "BROWSE_FOLDER":
                return handle_browse_folder(payload)

            # 3. App Installation / Launch
            elif action in ("APP_MANAGER_EXECUTE", "APP_INSTALL"):
                app_name = payload.get("app_name", "Application")
                action_type = payload.get("action", "install")

                if action_type == "open":
                    return handle_app_launch(payload)

                # Require desktop approval
                if self.ui:
                    approved = self.ui.ask_approval(
                        "Application Management",
                        f"ALOA Web requested to {action_type.upper()}: '{app_name}' via Winget."
                    )
                    if not approved:
                        return {"success": False, "error": f"Operation '{action_type} {app_name}' was denied by the local user."}

                if action_type == "install":
                    return handle_app_install(payload)
                elif action_type == "uninstall":
                    return handle_app_uninstall(payload)

            # 4. System Cleanup (Clearing temp / recycle bin)
            elif action in ("SYSTEM_CLEANUP", "CLEANUP"):
                if self.ui:
                    approved = self.ui.ask_approval(
                        "Disk Cleanup",
                        "ALOA Web requested to clean Windows Temp files and empty the Recycle Bin."
                    )
                    if not approved:
                        return {"success": False, "error": "Disk cleanup was denied by the local user."}
                return handle_system_cleanup(payload)

            # 5. Process Termination
            elif action in ("KILL_PROCESS", "PROCESS_KILL"):
                proc_name = payload.get("process_name") or payload.get("pid")
                if self.ui:
                    approved = self.ui.ask_approval(
                        "Process Termination",
                        f"ALOA Web requested to terminate process: '{proc_name}'."
                    )
                    if not approved:
                        return {"success": False, "error": f"Termination of {proc_name} was denied by the local user."}
                return handle_process_kill(payload)

            # 6. Code Healer - Project Scan
            elif action in ("CODE_HEALER_SCAN", "CH_SCAN"):
                return handle_code_healer_scan(payload)

            # 7. Code Healer - Project Run (Requires local user consent)
            elif action in ("CODE_HEALER_RUN", "CH_RUN"):
                cmd = payload.get("run_command", "")
                folder = payload.get("folder", "")
                if self.ui:
                    approved = self.ui.ask_approval(
                        "Code Execution",
                        f"ALOA Web requested to run project:\n'{cmd}'\nin folder:\n'{folder}'"
                    )
                    if not approved:
                        return {"success": False, "error": "Project execution was denied by the local user."}
                return handle_code_healer_run(payload)

            # 8. Code Healer - Apply Patch (Requires local user consent)
            elif action in ("CODE_HEALER_APPLY", "CH_APPLY"):
                fix_file = payload.get("fix_file", "")
                if self.ui:
                    approved = self.ui.ask_approval(
                        "Code Healer Patch",
                        f"ALOA Web requested to apply code fix to file:\n'{fix_file}'"
                    )
                    if not approved:
                        return {"success": False, "error": f"Patch application to {fix_file} was denied by the local user."}
                return handle_code_healer_apply(payload)

            # 9. Code Healer - Read File for Diff
            elif action in ("CODE_HEALER_READ_FILE", "CH_READ_FILE"):
                return handle_code_healer_read_file(payload)

            else:
                return {"success": False, "error": f"Unknown or unsupported local action: {action}"}

        except Exception as e:
            logger.exception("Error executing local action")
            return {"success": False, "error": str(e)}
