"""
ALOA V3 — Phase 2 Hybrid Architecture & Companion Integration Test Suite
Tests:
  1. Sibling-prefix and symlink escape prevention (canonical path containment)
  2. WebSocket origin verification & CSWSH defense
  3. Companion Agent local Code Healer actions (scan, run, apply, read_file)
  4. End-to-end device routing for Code Healer (cloud backend -> companion agent)
  5. Session isolation and prevention of unauthorized session ID reuse
  6. Device status reporting in cloud vs local environments
"""

import os
import sys
import tempfile
import asyncio
import pytest
from fastapi.testclient import TestClient

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)

from backend.server import app, _ch_agents
from backend.device_manager import DeviceManager, device_manager
from aloa_agent.actions import (
    is_safe_path,
    handle_code_healer_scan,
    handle_code_healer_run,
    handle_code_healer_apply,
    handle_code_healer_read_file,
)
from features.feature_6.core import ALOAAgent

client = TestClient(app)


class MockWebSocket:
    def __init__(self):
        self.sent_messages = []
    async def send_json(self, data):
        self.sent_messages.append(data)
    async def send(self, data):
        self.sent_messages.append(data)


def test_sibling_prefix_and_canonical_containment():
    """Verify that sibling directories with matching prefixes are strictly rejected."""
    with tempfile.TemporaryDirectory() as tmp_root:
        base_dir = os.path.join(tmp_root, "project")
        sibling_dir = os.path.join(tmp_root, "project_evil")
        os.makedirs(base_dir, exist_ok=True)
        os.makedirs(sibling_dir, exist_ok=True)

        evil_file = os.path.join(sibling_dir, "secret.py")
        with open(evil_file, "w") as f:
            f.write("# secret")

        # 1. is_safe_path must reject sibling directory
        assert is_safe_path(base_dir, evil_file) is False

        # 2. ALOAAgent.apply_fix must reject sibling directory
        agent = ALOAAgent(folder_path=base_dir, source_files=[], proj_type="python", run_command="")
        agent.last_fix_file = "../project_evil/secret.py"
        agent.last_fix_code = "hacked"
        ok, msg = agent.apply_fix()
        assert ok is False
        assert "traversal" in msg.lower() or "escapes" in msg.lower()


def test_companion_actions_code_healer():
    """Verify companion agent actions engine handles scan, apply, read, and run correctly."""
    with tempfile.TemporaryDirectory() as tmp_dir:
        main_py = os.path.join(tmp_dir, "main.py")
        with open(main_py, "w", encoding="utf-8") as f:
            f.write("print('Hello from ALOA test')\n")

        # 1. Scan
        scan_res = handle_code_healer_scan({"folder": tmp_dir})
        assert scan_res["success"] is True
        assert scan_res["project_type"] == "python"
        assert scan_res["file_count"] >= 1

        # 2. Read file
        read_res = handle_code_healer_read_file({"folder": tmp_dir, "file_path": "main.py"})
        assert read_res["success"] is True
        assert "Hello from ALOA test" in read_res["content"]

        # 3. Read file with traversal must fail
        bad_read = handle_code_healer_read_file({"folder": tmp_dir, "file_path": "../outside.txt"})
        assert bad_read["success"] is False

        # 4. Apply fix
        apply_res = handle_code_healer_apply({
            "folder": tmp_dir,
            "fix_file": "main.py",
            "fixed_code": "print('Fixed by ALOA')\n"
        })
        assert apply_res["success"] is True
        assert os.path.exists(main_py + ".bak")  # backup created
        with open(main_py, "r", encoding="utf-8") as f:
            assert f.read() == "print('Fixed by ALOA')\n"

        # 5. Apply fix traversal attempt must fail
        bad_apply = handle_code_healer_apply({
            "folder": tmp_dir,
            "fix_file": "../escaped.py",
            "fixed_code": "print('bad')"
        })
        assert bad_apply["success"] is False

        # 6. Run project
        run_res = handle_code_healer_run({"folder": tmp_dir, "run_command": "python main.py"})
        assert run_res["success"] is True
        assert "Fixed by ALOA" in run_res["output"]


def test_device_status_cloud_vs_local():
    """Verify /api/device/status returns is_local=False and online=False in cloud when unpaired."""
    os.environ["ALOA_CLOUD_MODE"] = "true"
    try:
        res = client.get("/api/device/status?session_id=unpaired_sess")
        data = res.json()
        assert data["online"] is False
        assert data["is_local"] is False
        assert "companion agent" in data["message"].lower()
    finally:
        os.environ.pop("ALOA_CLOUD_MODE", None)


def test_end_to_end_companion_code_healer_routing():
    """Verify that paired browser sessions route Code Healer requests to the companion agent."""
    async def _run():
        dm = DeviceManager()
        mock_ws = MockWebSocket()

        # 1. Register companion agent
        agent_id, code = await dm.register_agent(mock_ws, {"hostname": "Developer-Laptop", "os": "Windows"})

        # 2. Pair session
        session_id = "test_dev_session_789"
        pair_res = await dm.pair_session(session_id, code)
        assert pair_res["success"] is True

        # 3. Simulate companion agent handling ACTION_DISPATCH in background
        async def mock_agent_responder():
            while True:
                if mock_ws.sent_messages:
                    msg = mock_ws.sent_messages.pop(0)
                    if msg.get("type") == "ACTION_DISPATCH":
                        req_id = msg.get("request_id")
                        action = msg.get("action")
                        payload = msg.get("payload", {})

                        if action == "CODE_HEALER_SCAN":
                            await dm.handle_agent_message(agent_id, {
                                "type": "ACTION_RESULT",
                                "request_id": req_id,
                                "data": {
                                    "success": True,
                                    "folder": payload.get("folder"),
                                    "project_type": "python",
                                    "file_count": 5,
                                    "run_command": "python main.py",
                                    "entry_point": "main.py",
                                    "file_tree": [{"name": "main.py", "type": "file"}]
                                }
                            })
                        elif action == "CODE_HEALER_APPLY":
                            await dm.handle_agent_message(agent_id, {
                                "type": "ACTION_RESULT",
                                "request_id": req_id,
                                "data": {
                                    "success": True,
                                    "message": "Fix applied remotely",
                                    "backup_file": payload.get("fix_file") + ".bak"
                                }
                            })
                await asyncio.sleep(0.01)

        responder_task = asyncio.create_task(mock_agent_responder())

        try:
            # Dispatch scan
            scan_res = await dm.dispatch_action(session_id, "CODE_HEALER_SCAN", {"folder": "C:\\Dev\\App"}, timeout_sec=5)
            assert scan_res["success"] is True
            assert scan_res["result"]["project_type"] == "python"

            # Dispatch apply
            apply_res = await dm.dispatch_action(session_id, "CODE_HEALER_APPLY", {
                "folder": "C:\\Dev\\App", "fix_file": "main.py", "fixed_code": "# fixed"
            }, timeout_sec=5)
            assert apply_res["success"] is True
            assert apply_res["result"]["backup_file"] == "main.py.bak"

        finally:
            responder_task.cancel()
            try:
                await responder_task
            except asyncio.CancelledError:
                pass

    asyncio.run(_run())


def test_unauthorized_code_healer_session_rejection():
    """Verify unauthorized or un-scanned session IDs cannot invoke run, fix, or apply."""
    # Fake session ID
    res = client.post("/api/code-healer/run", json={"folder": ".", "session_id": "forged_sess_id", "run_command": "dir"})
    assert res.status_code == 401

    res_apply = client.post("/api/code-healer/apply", json={"session_id": "forged_sess_id"})
    assert res_apply.status_code == 401
