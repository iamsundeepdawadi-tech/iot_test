# File Map — Every File Explained

> **Audience**: AI coding assistants (LLM agents)

## Root Directory

| File | Purpose |
|------|---------|
| `README.md` | Project overview for GitHub |
| `.gitignore` | Ignores `.env`, `node_modules`, etc. |

## `test/` — Testing & Deployment

| File | Purpose |
|------|---------|
| `deploy.sh` | Uploads `server/` to cPanel via FTPS. Run with `./deploy.sh` from project root or `test/` dir. Contains FTP credentials and the list of files to upload. |
| `test_device.py` | Python script that emulates a Chicken Coop ESP32. Functions: `list_devices()`, `register_device()`, `send_telemetry()`, `fetch_config()`, `update_config()`, `read_history()`. |

## `llm_guidelines/` — AI Agent Documentation

| File | Purpose |
|------|---------|
| `OVERVIEW.md` | Full system architecture, design decisions, database schema |
| `ADD_NEW_DEVICE.md` | Step-by-step guide with template for adding new device types |
| `API_REFERENCE.md` | Complete HTTP API documentation with curl examples |
| `FILE_MAP.md` | This file — purpose of every file in the project |

## `server/` — Deployed to cPanel

### HTML Pages

| File | URL | Purpose |
|------|-----|---------|
| `index.html` | `/` or `/dashboard/{id}` | Main dashboard. Device selector, live sensor readings, control toggles/sliders, history table, code generation modal. |
| `devices.html` | `/devices` | Device manager. Two tabs: "My Devices" (list with dashboard/code links) and "+ Add New" (registration form). |
| `docs.html` | `/docs` | User-facing docs. 6 tabbed sections: Overview, Quick Start, ESP32 Guide, API Reference, Developer Guide, Troubleshooting. |
| `config-view.html` | `/settings` | Read-only sitewide config display (WiFi, server URL, device types, DB info). |

### PHP Backend

| File | Purpose | Key Functions |
|------|---------|---------------|
| `config.php` | DB credentials, CORS headers, global error handler | `jsonResponse()`, `jsonError()`, `getJsonInput()`, `sanitizeDeviceId()` |
| `db.php` | PDO connection with auto-schema creation | `getDB()` — singleton PDO, `ensureDeviceTable($id)` — creates per-device table |
| `schema.sql` | Reference SQL (not used at runtime — `db.php` handles everything) | — |
| `.htaccess` | Apache rewrite rules for clean URLs | Maps `/data/{id}` → `api/data.php?device_id={id}`, etc. |

### API Endpoints

| File | Route | Methods | Purpose |
|------|-------|---------|---------|
| `api/devices.php` | `/api/devices.php` | GET, POST | List/register devices. Contains `$defaultConfigs` array — **edit this when adding new device types**. |
| `api/data.php` | `/data/{device_id}` | GET, POST | POST: ESP32 stores sensor JSON. GET: Dashboard reads history. Updates `last_seen` on POST. |
| `api/device-config.php` | `/config/{device_id}` | GET, POST | GET: ESP32 reads config. POST: Dashboard updates config (partial merge). Updates `last_seen` on GET. |

### JavaScript (ES6 Modules)

| File | Loaded By | Purpose |
|------|-----------|---------|
| `js/core.js` | All pages | Shared utilities: `fetchJson()`, `esc()`, `fmtTime()`, `loadDeviceModule()`. Exports `WIFI_SSID`, `WIFI_PASS`, `SERVER_URL` constants. |
| `js/dashboard.js` | `index.html` | Device selector, polling loop (data + status + config every 5s), dynamic UI rendering, control handlers, code modal. |
| `js/devices.js` | `devices.html` | Device list rendering, registration form handler, tab switching, code modal on device cards. |

### Device Type Modules (`js/types/`)

Each file exports the same interface. See `ADD_NEW_DEVICE.md` for the full template.

| File | Type Key | Sensors | Controls |
|------|----------|---------|----------|
| `chicken_coop.js` | `chicken_coop` | `temp_c`, `humidity` | `light` (toggle), `heater` (toggle), `desired_temp` (range 15-40) |
| `random_test.js` | `random_test` | `value` | `led` (toggle) |
| `soil_sensor.js` | `soil_sensor` | `moisture`, `ph`, `nitrogen`, `phosphorus`, `potassium`, `temp_c`, `conductivity` | none |
| `ldr_sensor.js` | `ldr_sensor` | `light_level` | none |

### ESP32 Reference Code

| File | Purpose |
|------|---------|
| `esp32/chicken_farm_iot/chicken_farm_iot.ino` | Reference Arduino sketch (can also be generated via dashboard) |
| `esp32/chicken_farm_iot/config.h` | Pin assignments, WiFi/server config for Arduino IDE |

## Data Flow Summary

```
1. User registers device via devices.html → POST /api/devices.php → INSERT INTO devices
2. ESP32 boots → connects WiFi → enters loop:
   a. Read sensor → POST /data/{id} → INSERT INTO data_{id} + UPDATE last_seen
   b. GET /config/{id} → SELECT config → apply relay states
3. Dashboard polls every 5s:
   a. GET /data/{id}?limit=15 → display readings + history table
   b. GET /api/devices.php?device_id={id} → display status (online/offline)
   c. GET /config/{id} → display control states
4. User clicks toggle/slider → POST /config/{id} → MERGE into config JSON
```
