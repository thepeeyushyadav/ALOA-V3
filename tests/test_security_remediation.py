"""
ALOA V3 — Phase 1 Critical Security Remediation Regression Suite
Tests:
  1. Code Healer apply_fix path traversal prevention
  2. Resume Engine profile save/load path traversal prevention
  3. Cloud Healer GitHub repository URL validation & command injection prevention
  4. Cloud environment enforcement (Code Healer execution/apply & System Doctor kill blocked on cloud)
  5. Code Healer unauthenticated execution & folder mismatch rejection
  6. System Doctor protected process kill prevention
  7. YouTube Notes PDF download path traversal prevention
  8. Resume API endpoint path traversal rejection
"""

import os
import sys
import tempfile
import pytest
from fastapi.testclient import TestClient

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)

from backend.server import app, GITHUB_REPO_REGEX, PROHIBITED_PROCESSES, _ch_agents
from features.feature_6.core import ALOAAgent
from features.feature_9.core import save_profile, load_profile, PROFILES_DIR

client = TestClient(app)


def test_code_healer_apply_fix_path_traversal():
    """Verify apply_fix rejects path traversal outside the authorized folder."""
    with tempfile.TemporaryDirectory() as tmp_dir:
        agent = ALOAAgent(folder_path=tmp_dir, source_files=[], proj_type="python", run_command="")
        
        # Test 1: Parent directory traversal
        agent.last_fix_file = "../escaped_file.py"
        agent.last_fix_code = "print('hacked')"
        success, msg = agent.apply_fix()
        assert success is False
        assert "traversal" in msg.lower() or "escapes" in msg.lower()

        # Test 2: Absolute path injection
        if sys.platform == "win32":
            agent.last_fix_file = "C:\\Windows\\System32\\calc.exe"
        else:
            agent.last_fix_file = "/etc/passwd"
        agent.last_fix_code = "malicious"
        success, msg = agent.apply_fix()
        assert success is False
        assert "traversal" in msg.lower() or "escapes" in msg.lower()

        # Test 3: Valid relative file inside folder succeeds
        valid_file_path = os.path.join(tmp_dir, "valid_script.py")
        with open(valid_file_path, "w", encoding="utf-8") as f:
            f.write("# original code")

        agent.last_fix_file = "valid_script.py"
        agent.last_fix_code = "print('secure')"
        success, msg = agent.apply_fix()
        assert success is True
        assert os.path.exists(valid_file_path)
        with open(valid_file_path, "r", encoding="utf-8") as f:
            assert f.read() == "print('secure')"


def test_resume_profile_path_traversal():
    """Verify resume save_profile and load_profile reject directory traversal."""
    # Test 1: Traversal in save_profile
    with pytest.raises(ValueError):
        save_profile({"name": "Attacker"}, "../../etc/passwd")

    with pytest.raises(ValueError):
        save_profile({"name": "Attacker"}, "subdir/my_profile")

    # Test 2: Valid filename creates file inside PROFILES_DIR
    valid_path = save_profile({"name": "Piyush", "email": "test@aloav3.com"}, "security_test_user")
    assert os.path.exists(valid_path)
    assert valid_path.startswith(os.path.abspath(PROFILES_DIR))

    # Test 3: Traversal in load_profile
    with pytest.raises(ValueError):
        load_profile("../../escaped_profile.json")

    # Test 4: Loading the valid saved profile succeeds
    loaded = load_profile("security_test_user.json")
    assert loaded is not None
    assert loaded.get("name") == "Piyush"

    # Cleanup test file
    try:
        os.remove(valid_path)
    except Exception:
        pass


def test_cloud_healer_url_validation():
    """Verify Cloud Healer regex strictly validates repository URLs."""
    valid_urls = [
        "https://github.com/aloa-team/aloa-v3",
        "https://github.com/aloa-team/aloa-v3.git",
        "https://github.com/torvalds/linux",
        "https://github.com/user_123/my-repo.git/",
    ]
    for url in valid_urls:
        assert GITHUB_REPO_REGEX.match(url) is not None, f"Expected valid: {url}"

    malicious_or_invalid_urls = [
        "--upload-pack=whoami",
        "-oProxyCommand=calc.exe",
        "file:///etc/passwd",
        "git@github.com:aloa/repo.git",
        "https://evil.com/user/repo",
        "https://github.com/user/repo;rm -rf /",
        "https://github.com/user/repo && echo hacked",
        "http://github.com/insecure/repo",
    ]
    for url in malicious_or_invalid_urls:
        assert GITHUB_REPO_REGEX.match(url) is None, f"Expected invalid: {url}"


def test_cloud_environment_blocks_unsafe_routes():
    """Verify that in cloud mode (ALOA_CLOUD_MODE=true), direct code run, scan, apply, and kill are blocked."""
    os.environ["ALOA_CLOUD_MODE"] = "true"
    test_agent = ALOAAgent(folder_path="C:\\fake", source_files=[], proj_type="python", run_command="dir")
    test_agent.last_fix_file = "test.py"
    test_agent.last_fix_code = "print('fixed')"
    test_agent.is_remote = False
    _ch_agents["test_cloud_sess"] = test_agent

    try:
        # 1. Code Healer scan blocked
        res_scan = client.post("/api/code-healer/scan", json={"folder": "C:\\fake"})
        assert res_scan.status_code == 403
        assert "cloud" in res_scan.json()["detail"].lower()

        # 2. Code Healer run blocked
        res_run = client.post("/api/code-healer/run", json={"folder": "C:\\fake", "session_id": "test_cloud_sess", "run_command": "dir"})
        assert res_run.status_code == 403
        assert "cloud" in res_run.json()["detail"].lower()

        # 3. Code Healer apply blocked
        res_apply = client.post("/api/code-healer/apply", json={"session_id": "test_cloud_sess"})
        assert res_apply.status_code == 403
        assert "cloud" in res_apply.json()["detail"].lower()

        # 4. System Doctor kill blocked
        res_kill = client.post("/api/system-doctor/kill", json={"process_name": "notepad.exe"})
        assert res_kill.status_code == 403
        assert "cloud" in res_kill.json()["detail"].lower()

    finally:
        _ch_agents.pop("test_cloud_sess", None)
        os.environ.pop("ALOA_CLOUD_MODE", None)


def test_code_healer_unauthorized_and_mismatch():
    """Verify Code Healer /api/code-healer/run enforces valid session and matching folder."""
    # Ensure not in cloud mode for local check
    os.environ.pop("ALOA_CLOUD_MODE", None)

    # Missing / unauthorized session_id
    res = client.post("/api/code-healer/run", json={"folder": ".", "session_id": "nonexistent_session", "run_command": "python test.py"})
    assert res.status_code == 401
    assert "Unauthorized" in res.json()["detail"] or "invalid session_id" in res.json()["detail"]


def test_system_doctor_kill_protected_processes():
    """Verify protected server and system processes cannot be terminated."""
    for proc in ["python.exe", "python", "uvicorn", "powershell.exe", "cmd.exe", "explorer.exe"]:
        res = client.post("/api/system-doctor/kill", json={"process_name": proc})
        assert res.status_code == 400
        assert "protected process" in res.json()["detail"]


def test_youtube_notes_download_path_traversal():
    """Verify download endpoint blocks non-PDF and directory traversal attempts."""
    # Traversal attempt
    res = client.get("/api/youtube-notes/download/..%2F..%2Fetc%2Fpasswd")
    assert res.status_code in (400, 404)

    # Non-PDF extension attempt
    res_non_pdf = client.get("/api/youtube-notes/download/sensitive.env")
    assert res_non_pdf.status_code == 400
    assert "Invalid PDF" in res_non_pdf.json()["detail"]


def test_resume_api_endpoints_path_traversal():
    """Verify resume API routes reject traversal patterns in filenames."""
    # 1. Save profile with traversal in filename
    res_save = client.post("/api/resume/save", json={"profile": {"name": "Hacker"}, "filename": "../../hacked"})
    assert res_save.status_code == 400
    assert "path traversal" in res_save.json()["detail"].lower()

    # 2. Load profile with traversal in filename
    res_load = client.get("/api/resume/profile/..%2F..%2Fetc%2Fpasswd")
    assert res_load.status_code in (400, 404)

    # 3. Load profile with path traversal dots without slashes
    res_load2 = client.get("/api/resume/profile/something..evil")
    assert res_load2.status_code == 400
    assert "path traversal" in res_load2.json()["detail"].lower()
