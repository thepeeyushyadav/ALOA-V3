"""
ALOA V3 — Security & Device Pairing Automated Regression Suite
Tests:
  1. Cryptographic Pairing Code Generation & TTL Expiration
  2. One-Time Code Consumption (Replay Prevention)
  3. Rate Limiting on Brute Force Pairing
  4. Cross-Session Isolation (Session A cannot access Session B's device)
  5. Command Injection & Malicious Package ID Sanitization
"""

import sys
import os
import time
import pytest
import asyncio

# Setup path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)

from backend.device_manager import DeviceManager
from aloa_agent.actions import sanitize_id

class MockWebSocket:
    def __init__(self):
        self.sent_messages = []
    async def send_json(self, data):
        self.sent_messages.append(data)
    async def send(self, data):
        self.sent_messages.append(data)

def test_pairing_flow_and_one_time_consumption():
    async def _run():
        dm = DeviceManager()
        mock_ws = MockWebSocket()

        # 1. Register agent
        agent_id, code = await dm.register_agent(mock_ws, {"hostname": "Test-PC", "os": "Windows 11"})
        assert agent_id.startswith("agent_")
        assert len(code) == 6

        # 2. Pair valid session
        session_id = "user_session_123"
        result = await dm.pair_session(session_id, code)
        assert result["success"] is True
        assert result["agent_id"] == agent_id
        assert result["hostname"] == "Test-PC"

        # 3. Verify one-time use (code burned)
        second_attempt = await dm.pair_session("user_session_456", code)
        assert second_attempt["success"] is False
        assert "Invalid or expired" in second_attempt["error"]

    asyncio.run(_run())

def test_expired_pairing_code():
    async def _run():
        dm = DeviceManager()
        mock_ws = MockWebSocket()
        agent_id, code = await dm.register_agent(mock_ws, {"hostname": "Test-PC"})

        # Force expiration
        dm.pairing_codes[code]["expires_at"] = time.time() - 10

        res = await dm.pair_session("sess_expired", code)
        assert res["success"] is False
        assert "Invalid or expired" in res["error"]

    asyncio.run(_run())

def test_pairing_rate_limiting():
    async def _run():
        dm = DeviceManager()
        sess = "attacker_session"

        # Attempt 5 invalid guesses
        for _ in range(5):
            await dm.pair_session(sess, "WRONG1")

        # 6th attempt should be blocked by rate limit
        blocked = await dm.pair_session(sess, "WRONG2")
        assert blocked["success"] is False
        assert "Too many pairing attempts" in blocked["error"]

    asyncio.run(_run())

def test_session_isolation():
    async def _run():
        dm = DeviceManager()
        ws1 = MockWebSocket()
        ws2 = MockWebSocket()

        a1, code1 = await dm.register_agent(ws1, {"hostname": "Laptop-Alice"})
        a2, code2 = await dm.register_agent(ws2, {"hostname": "Laptop-Bob"})

        await dm.pair_session("session_alice", code1)
        await dm.pair_session("session_bob", code2)

        alice_agent = dm.get_agent_for_session("session_alice")
        bob_agent = dm.get_agent_for_session("session_bob")

        assert alice_agent["agent_id"] == a1
        assert alice_agent["hostname"] == "Laptop-Alice"
        assert bob_agent["agent_id"] == a2
        assert bob_agent["hostname"] == "Laptop-Bob"
        assert alice_agent["agent_id"] != bob_agent["agent_id"]

    asyncio.run(_run())

def test_command_injection_sanitization():
    # Valid IDs
    assert sanitize_id("Microsoft.VisualStudioCode") == "Microsoft.VisualStudioCode"
    assert sanitize_id("Spotify.Spotify") == "Spotify.Spotify"
    assert sanitize_id("Git.Git-2.40") == "Git.Git-2.40"

    # Malicious injection payloads must be rejected
    malicious = [
        "calc.exe & whoami",
        "app; rm -rf /",
        "../../etc/passwd",
        "package | powershell -enc",
        "$(whoami)",
        "app`id`"
    ]
    for m in malicious:
        with pytest.raises(ValueError):
            sanitize_id(m)

if __name__ == "__main__":
    import pytest
    sys.exit(pytest.main(["-v", __file__]))
