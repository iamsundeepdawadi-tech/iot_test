# IoT Farm — System Overview

> **Audience**: AI coding assistants (LLM agents) working on this codebase.
> **Last updated**: 2026-03-18

## Architecture

This is a **zero-dependency Vanilla PHP + Vanilla JS** IoT platform. There are no frameworks, no npm, no Composer. It runs on any cPanel shared hosting.

```
ESP32 Device                          cPanel Server (PHP + MySQL)
┌──────────────┐                     ┌─────────────────────────┐
│  Read Sensor │──POST /data/id───→  │  api/data.php           │
│              │                     │  → INSERT INTO data_{id}│
│              │──GET /config/id──→  │  api/device-config.php  │
│  Apply Relay │←── JSON config ──   │  → SELECT config        │
└──────────────┘                     └─────────────────────────┘
                                                ↑
Browser (ES6 modules) ──── fetch() ─────────────┘
```

## Technology Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Hardware | ESP32 (TTGO T-Call) | Any ESP32 board works |
| Firmware | Arduino C++ | Generated per-device via JS modules |
| Backend | Vanilla PHP 8.x | No frameworks, no Composer |
| Database | MySQL 8.x | Auto-created tables via PDO |
| Frontend | Vanilla JS (ES6 Modules) | No React, no Vue, no build step |
| Styling | Vanilla CSS | Brutalist monospace design |
| Hosting | cPanel shared hosting | FTP deploy via `test/deploy.sh` |

## Key Design Decisions

1. **Per-device tables**: Each device gets its own `data_{device_id}` table. This provides complete isolation, fast queries, and easy archival.

2. **HTTP polling (not MQTT)**: ESP32 polls `/config/{id}` every 5 seconds. This avoids the need for an MQTT broker, simplifies firewall traversal, and works on any web host.

3. **Modular device types**: Each device type is a self-contained ES6 module in `js/types/`. It defines sensors, controls, default config, and Arduino code generation. Adding a new type requires **one new JS file** and **two small edits**.

4. **Auto-schema**: `db.php` auto-creates the `devices` table and per-device data tables on first access. No manual SQL imports required.

## File Map

```
iot_test/
├── README.md                    ← Project overview
├── .gitignore
├── llm_guidelines/              ← YOU ARE HERE — documentation for AI agents
│   ├── OVERVIEW.md              ← This file — architecture + design
│   ├── ADD_NEW_DEVICE.md        ← Step-by-step: adding a new device type
│   ├── API_REFERENCE.md         ← Complete HTTP API documentation
│   └── FILE_MAP.md              ← Every file explained with purpose
├── test/
│   ├── deploy.sh                ← FTP deployment script
│   └── test_device.py           ← Python ESP32 emulator
└── server/                      ← Everything inside here gets deployed
    ├── index.html               ← Dashboard page (device selector + live data)
    ├── devices.html             ← Device manager (register + view code)
    ├── docs.html                ← User-facing documentation (6 tabbed sections)
    ├── config-view.html         ← Read-only sitewide config display
    ├── config.php               ← DB credentials, CORS, helper functions
    ├── db.php                   ← PDO connection + auto table creation
    ├── schema.sql               ← SQL reference (db.php auto-creates)
    ├── .htaccess                ← Apache URL rewriting rules
    ├── css/style.css            ← Global stylesheet
    ├── js/
    │   ├── core.js              ← Shared: fetchJson(), esc(), fmtTime(), loadDeviceModule()
    │   ├── dashboard.js         ← Dashboard page: device select, polling, controls, code modal
    │   ├── devices.js           ← Devices page: register, list, view code
    │   └── types/               ← ONE FILE PER DEVICE TYPE
    │       ├── chicken_coop.js  ← DHT22 temp/humidity + light/heater relays
    │       ├── random_test.js   ← Random number + LED toggle (demo)
    │       ├── soil_sensor.js   ← 7-parameter soil analysis
    │       └── ldr_sensor.js    ← Light-dependent resistor
    ├── api/
    │   ├── devices.php          ← GET: list devices, POST: register device
    │   ├── data.php             ← GET: read sensor data, POST: store sensor data
    │   └── device-config.php   ← GET: read config, POST: update config
    └── esp32/
        └── chicken_farm_iot/    ← Reference Arduino project (also generated via dashboard)
            ├── chicken_farm_iot.ino
            └── config.h
```

## Global Constants

These are defined in `server/js/core.js` and used by all device type modules:

```javascript
export const WIFI_SSID  = 'accounthack_fbnpa_2';
export const WIFI_PASS  = 'CLED02502F';
export const SERVER_URL = 'http://iot.aitalim.com';
```

## Database Schema

**`devices` table** (auto-created by `db.php`):
```sql
CREATE TABLE devices (
    device_id   VARCHAR(64) PRIMARY KEY,
    device_type VARCHAR(64) NOT NULL,
    name        VARCHAR(128) NOT NULL,
    location    VARCHAR(128),
    config      JSON DEFAULT ('{}'),
    last_seen   DATETIME NULL,
    ip_address  VARCHAR(45) NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**`data_{device_id}` tables** (auto-created per device):
```sql
CREATE TABLE data_{device_id} (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    data        JSON NOT NULL,
    INDEX idx_time (recorded_at DESC)
);
```

## Deploy Process

```bash
cd test/
./deploy.sh
```

This uploads the entire `server/` directory to `ftp://ftp.aitalim.com/` via FTPS.
