#!/usr/bin/env python3
"""
IoT Farm — Python Test Emulator
================================
Emulates a Chicken Coop ESP32 device. Provides functions to:
  - List all registered devices
  - Register a new device (auto-registers if missing)
  - Send telemetry data
  - Fetch device config
  - Update device config
  - Read historical data
"""

import json
import time
import random
import urllib.request
import urllib.error
import sys

# --- Configuration ---
SERVER_URL = "http://iot.aitalim.com"
DEVICE_ID  = "python_test_01"
DEVICE_TYPE = "chicken_coop"
DEVICE_NAME = "Test Device"
LOCATION    = "Test Location"

# ── HTTP Helper ──────────────────────────────────────────────
def api(url, method="GET", data=None):
    """Send an HTTP request and return (status_code, json_body)."""
    req = urllib.request.Request(url, method=method)
    body = None
    if data:
        req.add_header('Content-Type', 'application/json')
        body = json.dumps(data).encode('utf-8')
    try:
        with urllib.request.urlopen(req, data=body, timeout=10) as r:
            return r.getcode(), json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode())
        except Exception:
            return e.code, {"error": str(e)}
    except Exception as e:
        return 0, {"error": str(e)}

# ── API Functions ────────────────────────────────────────────
def list_devices(device_type=None):
    """GET /api/devices.php — List all registered devices."""
    url = f"{SERVER_URL}/api/devices.php"
    if device_type:
        url += f"?type={device_type}"
    code, res = api(url)
    if code == 200 and isinstance(res, list):
        print(f"[+] Found {len(res)} device(s):")
        for d in res:
            status = "ONLINE" if d.get('last_seen') else "NEVER SEEN"
            print(f"    • {d['device_id']} ({d['device_type']}) — {d['name']} [{status}]")
        return res
    else:
        print(f"[-] Failed to list devices: HTTP {code}")
        return []

def get_device(device_id):
    """GET /api/devices.php?device_id=X — Get a single device."""
    code, res = api(f"{SERVER_URL}/api/devices.php?device_id={device_id}")
    if code == 200 and isinstance(res, list) and len(res) > 0:
        return res[0]
    return None

def register_device(device_id=DEVICE_ID, device_type=DEVICE_TYPE, name=DEVICE_NAME, location=LOCATION):
    """POST /api/devices.php — Register a new device (skips if exists)."""
    existing = get_device(device_id)
    if existing:
        print(f"[+] Device '{device_id}' already registered.")
        return True

    print(f"[*] Registering device '{device_id}'...")
    payload = {
        "device_id": device_id,
        "device_type": device_type,
        "name": name,
        "location": location
    }
    code, res = api(f"{SERVER_URL}/api/devices.php", method="POST", data=payload)
    if code == 201:
        print(f"[+] Registered successfully! Config: {res.get('config')}")
        return True
    else:
        print(f"[-] Registration failed: HTTP {code}: {json.dumps(res)}")
        return False

def send_telemetry(device_id, data):
    """POST /data/{device_id} — Push sensor readings."""
    code, res = api(f"{SERVER_URL}/data/{device_id}", method="POST", data=data)
    if code == 200:
        print(f"[+] Telemetry sent: {data}")
        return True
    else:
        print(f"[-] Telemetry failed: HTTP {code}: {json.dumps(res)}")
        return False

def fetch_config(device_id):
    """GET /config/{device_id} — Read device config (control signals)."""
    code, res = api(f"{SERVER_URL}/config/{device_id}")
    if code == 200:
        return res
    else:
        print(f"[-] Config fetch failed: HTTP {code}: {json.dumps(res)}")
        return None

def update_config(device_id, config_updates):
    """POST /config/{device_id} — Update device config from dashboard side."""
    code, res = api(f"{SERVER_URL}/config/{device_id}", method="POST", data=config_updates)
    if code == 200:
        print(f"[+] Config updated: {res.get('config')}")
        return res.get('config')
    else:
        print(f"[-] Config update failed: HTTP {code}: {json.dumps(res)}")
        return None

def read_history(device_id, limit=10):
    """GET /data/{device_id}?limit=N — Read historical sensor data."""
    code, res = api(f"{SERVER_URL}/data/{device_id}?limit={limit}")
    if code == 200 and isinstance(res, list):
        print(f"[+] Last {len(res)} readings for '{device_id}':")
        for row in res:
            print(f"    {row.get('recorded_at')} → {row.get('data')}")
        return res
    else:
        print(f"[-] History read failed: HTTP {code}")
        return []

# ── Main Loop ────────────────────────────────────────────────
def main():
    print("==============================================")
    print("  IoT Farm — ESP32 Emulator (Chicken Coop)")
    print("==============================================\n")

    # 1. List all devices
    list_devices()
    print()

    # 2. Register our test device (auto-skips if exists)
    register_device()
    print()

    # 3. Start the main telemetry loop
    print("[*] Starting telemetry loop (Ctrl+C to exit)...\n")
    while True:
        # Send random sensor data
        telemetry = {
            "temp_c": round(random.uniform(20.0, 30.0), 2),
            "humidity": round(random.uniform(40.0, 80.0), 2)
        }
        send_telemetry(DEVICE_ID, telemetry)

        # Fetch and react to config
        config = fetch_config(DEVICE_ID)
        if config:
            light = config.get('light', 'off')
            heater = config.get('heater', 'off')
            print(f"    Config → Light: {light.upper()}, Heater: {heater.upper()}")

        time.sleep(5)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n[*] Emulator stopped.")
        sys.exit(0)
