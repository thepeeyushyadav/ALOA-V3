"""
Tests for System Doctor Scan Endpoint Contract.
Ensures both frontend-expected keys (cpu, ram, disk, disk_free, cpu_status, ram_status, disk_status)
and backwards-compatible keys (cpu_percent, ram_percent, disk_percent) are returned.
"""

import os
import sys
import pytest
from fastapi.testclient import TestClient

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)

from backend.server import app

client = TestClient(app)


def test_system_doctor_scan_local_contract():
    """Verify local fallback scan returns all required fields for frontend and backward compatibility."""
    response = client.get("/api/system-doctor/scan")
    assert response.status_code == 200
    data = response.json()

    # Frontend UI keys
    assert "cpu" in data and isinstance(data["cpu"], (int, float))
    assert "ram" in data and isinstance(data["ram"], (int, float))
    assert "disk" in data and isinstance(data["disk"], (int, float))
    assert "disk_free" in data and isinstance(data["disk_free"], str)
    assert data["cpu_status"] in ("stable", "high", "critical")
    assert data["ram_status"] in ("stable", "high", "critical")
    assert data["disk_status"] in ("stable", "high", "critical")

    # Backwards compatibility keys
    assert "cpu_percent" in data and data["cpu_percent"] == data["cpu"]
    assert "ram_percent" in data and data["ram_percent"] == data["ram"]
    assert "disk_percent" in data and data["disk_percent"] == data["disk"]

    # Process and insight lists
    assert "processes" in data and isinstance(data["processes"], list)
    assert "junk_label" in data and isinstance(data["junk_label"], str)
    assert "insight" in data and isinstance(data["insight"], str)
    assert data["is_remote_agent"] is False
