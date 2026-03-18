# IoT Farm — iot.aitalim.com

ESP32 + Vanilla PHP IoT platform for monitoring sensors and controlling actuators in real-time.

## Architecture

```
ESP32  ──POST /data/{id}──→  PHP API  →  MySQL (per-device table)
ESP32  ──GET /config/{id}──→  PHP API  →  devices.config column
Dashboard  ──AJAX──→  PHP API  ──→  MySQL → renders live data/controls
```

## Features

- **4 device types**: Random Test, Chicken Coop, Soil Sensor, LDR
- **Multipage UI**: Dashboard, Device Manager, Documentation
- **Modular JS**: Each device type is a self-contained ES6 module
- **Config-based control**: ESP32 polls `/config/{id}` — no MQTT needed
- **Per-device tables**: Each device gets its own `data_{id}` table
- **Code generator**: Dashboard generates Arduino IDE code per device
- **Auto-deploy**: `deploy.sh` → FTP → cPanel

## Quick Start

```bash
# 1. Deploy to server
./deploy.sh

# 2. Test with Python emulator
python3 server_python_test/test_device.py

# 3. Open dashboard
# https://iot.aitalim.com
```

## API

| Method | Endpoint | Purpose |
|--------|----------|---------| 
| POST | `/data/{device_id}` | ESP32 sends sensor data |
| GET | `/data/{device_id}?limit=N` | Fetch recent data |
| GET | `/config/{device_id}` | ESP32 reads control config |
| POST | `/config/{device_id}` | Update device config |
| GET | `/api/devices.php` | List devices |
| POST | `/api/devices.php` | Register device |

## Files

```
server/
├── index.html              ← Dashboard (device selector + live data + controls)
├── devices.html            ← Device Manager (register + view code)
├── docs.html               ← Full documentation
├── config.php              ← DB credentials + helpers
├── db.php                  ← PDO connection + auto table creation
├── schema.sql              ← MySQL schema reference
├── .htaccess               ← URL rewriting (clean routes)
├── css/style.css           ← Global stylesheet
├── js/
│   ├── core.js             ← Shared API/utility functions
│   ├── dashboard.js        ← Dashboard page logic
│   ├── devices.js          ← Device manager page logic
│   └── types/
│       ├── chicken_coop.js ← Chicken Coop module
│       ├── random_test.js  ← Random Test module
│       ├── soil_sensor.js  ← Soil Sensor module
│       └── ldr_sensor.js   ← LDR Sensor module
└── api/
    ├── data.php            ← /data/{device_id}
    ├── device-config.php   ← /config/{device_id}
    └── devices.php         ← Device CRUD

server_python_test/
└── test_device.py          ← Python ESP32 emulator
```

## Hardware

Default WiFi: `accounthack_fbnpa_2` / `CLED02502F`
Board: TTGO T-Call ESP32 SIM800L (safe pins: 2, 13, 14, 15, 25, 32, 33)

## Docs

Full documentation at [iot.aitalim.com/docs.html](https://iot.aitalim.com/docs.html)
