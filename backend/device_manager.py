"""
ALOA V3 — In-Memory Device Manager & Pairing Gateway
Provides secure, single-instance pairing and message routing between
the web frontend (sessions) and the ALOA Windows Companion Agent (WebSockets).

Zero Database required: uses cryptographically secure ephemeral state.
"""

import os
import time
import secrets
import string
import asyncio
import logging
from typing import Dict, Optional, Tuple, Any
from fastapi import WebSocket

logger = logging.getLogger("aloa.device_manager")

# Configurable constants
PAIRING_CODE_TTL_SEC = 300  # 5 minutes
PAIRING_MAX_ATTEMPTS = 5    # Max attempts per session before cooldown
CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # 32 chars, no ambiguous 0/O, 1/I

class DeviceManager:
    def __init__(self):
        # agent_id -> WebSocket
        self.active_agents: Dict[str, WebSocket] = {}
        # agent_id -> metadata dict (hostname, os, version, paired_sessions, etc.)
        self.agent_metadata: Dict[str, dict] = {}
        # pairing_code -> {agent_id, expires_at, created_at}
        self.pairing_codes: Dict[str, dict] = {}
        # session_id -> agent_id
        self.session_bindings: Dict[str, str] = {}
        # session_id -> [attempt_timestamps] (rate limiting)
        self.pairing_attempts: Dict[str, list] = {}
        # request_id -> asyncio.Future
        self.pending_requests: Dict[str, asyncio.Future] = {}
        # Lock for thread-safe mutations in async loop
        self._lock = asyncio.Lock()

    def _generate_code(self) -> str:
        """Generate a cryptographically secure 6-character pairing code."""
        return "".join(secrets.choice(CODE_ALPHABET) for _ in range(6))

    async def register_agent(self, websocket: WebSocket, metadata: dict) -> Tuple[str, str]:
        """
        Called when a Windows Companion Agent connects via WebSocket.
        Generates a unique agent_id and a fresh 6-character pairing code.
        """
        async with self._lock:
            agent_id = f"agent_{secrets.token_hex(8)}"

            # Remove any expired codes before adding
            self._cleanup_expired_codes()

            # Ensure unique code
            code = self._generate_code()
            while code in self.pairing_codes:
                code = self._generate_code()

            expires_at = time.time() + PAIRING_CODE_TTL_SEC
            self.pairing_codes[code] = {
                "agent_id": agent_id,
                "expires_at": expires_at,
                "created_at": time.time()
            }

            self.active_agents[agent_id] = websocket
            self.agent_metadata[agent_id] = {
                "agent_id": agent_id,
                "hostname": metadata.get("hostname", "Unknown-PC"),
                "os": metadata.get("os", "Windows"),
                "version": metadata.get("version", "3.0.0"),
                "connected_at": time.time(),
                "last_seen": time.time(),
                "paired_sessions": set()
            }

            logger.info(f"Registered agent {agent_id} ({metadata.get('hostname')}). Pairing code: {code}")
            return agent_id, code

    async def unregister_agent(self, agent_id: str):
        """Called when an agent disconnects."""
        async with self._lock:
            if agent_id in self.active_agents:
                del self.active_agents[agent_id]

            # Clean up pairing codes for this agent
            for code, data in list(self.pairing_codes.items()):
                if data.get("agent_id") == agent_id:
                    del self.pairing_codes[code]

            # Invalidate any pending requests to this agent
            for req_id, future in list(self.pending_requests.items()):
                if not future.done():
                    future.set_exception(ConnectionResetError("Agent disconnected before completing request."))

            logger.info(f"Unregistered agent {agent_id}")

    def _cleanup_expired_codes(self):
        """Purge expired pairing codes."""
        now = time.time()
        for code, data in list(self.pairing_codes.items()):
            if data["expires_at"] < now:
                del self.pairing_codes[code]

    def _check_rate_limit(self, session_id: str) -> bool:
        """Enforce max 5 pairing attempts per minute per session."""
        now = time.time()
        attempts = self.pairing_attempts.get(session_id, [])
        # Keep only attempts in last 60 seconds
        recent = [t for t in attempts if now - t < 60]
        self.pairing_attempts[session_id] = recent
        if len(recent) >= PAIRING_MAX_ATTEMPTS:
            return False
        self.pairing_attempts[session_id].append(now)
        return True

    async def pair_session(self, session_id: str, code: str) -> dict:
        """
        Validate pairing code and bind browser session_id to target agent.
        """
        if not session_id or not code:
            return {"success": False, "error": "Session ID and pairing code are required."}

        clean_code = code.strip().upper()

        if not self._check_rate_limit(session_id):
            return {"success": False, "error": "Too many pairing attempts. Please wait 1 minute."}

        async with self._lock:
            self._cleanup_expired_codes()

            data = self.pairing_codes.get(clean_code)
            if not data:
                return {"success": False, "error": "Invalid or expired pairing code."}

            agent_id = data["agent_id"]
            if agent_id not in self.active_agents:
                del self.pairing_codes[clean_code]
                return {"success": False, "error": "Target laptop is no longer connected."}

            # Burn code immediately (one-time use)
            del self.pairing_codes[clean_code]

            # Bind session
            self.session_bindings[session_id] = agent_id
            self.agent_metadata[agent_id]["paired_sessions"].add(session_id)

            meta = self.agent_metadata[agent_id]
            logger.info(f"Successfully paired session {session_id} to agent {agent_id}")

            return {
                "success": True,
                "agent_id": agent_id,
                "hostname": meta["hostname"],
                "os": meta["os"],
                "version": meta["version"]
            }

    def get_agent_for_session(self, session_id: str) -> Optional[dict]:
        """Check if a session is paired and return agent info if online."""
        if not session_id:
            return None
        agent_id = self.session_bindings.get(session_id)
        if not agent_id or agent_id not in self.active_agents:
            return None
        meta = self.agent_metadata.get(agent_id, {})
        return {
            "agent_id": agent_id,
            "hostname": meta.get("hostname", "Windows-PC"),
            "os": meta.get("os", "Windows"),
            "online": True
        }

    async def dispatch_action(self, session_id: str, action: str, payload: dict, timeout_sec: int = 45) -> dict:
        """
        Send an action to the agent paired with this session and wait for result.
        Actions include: APP_INSTALL, APP_LAUNCH, SYSTEM_METRICS, CLEANUP, KILL_PROCESS, CODE_SCAN, etc.
        """
        agent_id = self.session_bindings.get(session_id)
        if not agent_id or agent_id not in self.active_agents:
            return {
                "success": False,
                "error": "No ALOA Windows Agent connected. Please launch the desktop agent and pair your laptop."
            }

        ws = self.active_agents[agent_id]
        request_id = f"req_{secrets.token_hex(6)}"
        loop = asyncio.get_event_loop()
        future: asyncio.Future = loop.create_future()
        self.pending_requests[request_id] = future

        message = {
            "type": "ACTION_DISPATCH",
            "request_id": request_id,
            "action": action,
            "payload": payload,
            "timestamp": time.time()
        }

        try:
            await ws.send_json(message)
            result = await asyncio.wait_for(future, timeout=timeout_sec)
            return {"success": True, "result": result}
        except asyncio.TimeoutError:
            return {"success": False, "error": f"Agent operation timed out after {timeout_sec}s."}
        except Exception as e:
            return {"success": False, "error": f"Agent communication error: {str(e)}"}
        finally:
            self.pending_requests.pop(request_id, None)

    async def handle_agent_message(self, agent_id: str, message: dict):
        """Process messages received from the agent over WebSocket."""
        msg_type = message.get("type")
        request_id = message.get("request_id")

        if agent_id in self.agent_metadata:
            self.agent_metadata[agent_id]["last_seen"] = time.time()

        if msg_type == "ACTION_RESULT" and request_id:
            future = self.pending_requests.get(request_id)
            if future and not future.done():
                future.set_result(message.get("data", {}))
        elif msg_type == "ACTION_ERROR" and request_id:
            future = self.pending_requests.get(request_id)
            if future and not future.done():
                future.set_exception(RuntimeError(message.get("error", "Unknown error from agent")))
        elif msg_type == "PING":
            ws = self.active_agents.get(agent_id)
            if ws:
                await ws.send_json({"type": "PONG", "timestamp": time.time()})

# Global singleton
device_manager = DeviceManager()
