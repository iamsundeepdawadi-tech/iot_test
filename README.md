# IoT Farm — iot.aitalim.com

ESP32 + vanilla PHP IoT platform for monitoring sensors and controlling actuators in real-time.

## Architecture

```
ESP32  ──POST /data/{id}──→  PHP API  →  MySQL (per-device table)
ESP32  ──GET /config/{id}──→  PHP API  →  devices.config column
Dashboard  ──AJAX──→  PHP API  ──→  MySQL → renders live data/controls
```

## Features

- **4 device types**: Random Test, Chicken Coop, Soil Sensor, LDR  
- **Config-based control**: ESP32 polls `/config/{id}` — no MQTT needed  
- **Per-device tables**: Each device gets its own data table  
- **Code generator**: Dashboard generates Arduino IDE code per device  
- **Auto-deploy**: GitHub Actions → FTP → cPanel  

## Quick Start

```bash
# 1. Clone and push to GitHub
git clone https://github.com/YOUR_USER/iot_test.git
cd iot_test
git push origin main

# 2. Set GitHub Secrets (Settings → Secrets → Actions)
FTP_SERVER   = aitalim.com
FTP_USERNAME = admin@aitalim.com
FTP_PASSWORD = (your FTP password)

# 3. Import database
# cPanel → phpMyAdmin → Import → server/schema.sql

# 4. Open dashboard
# https://iot.aitalim.com
# Login: admin / @dmin#123
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
├── index.html          ← Dashboard (login + device manager + controls)
├── docs.html           ← Full documentation
├── config.php          ← DB credentials
├── db.php              ← PDO connection + dynamic table creation
├── schema.sql          ← MySQL schema
├── .htaccess           ← URL rewriting
└── api/
    ├── data.php            ← /data/{device_id}
    ├── device-config.php   ← /config/{device_id}
    ├── devices.php         ← Device CRUD
    └── login.php           ← Session auth
```

## Hardware

Default WiFi: `accounthack_fbnpa_5` / `CLED02502F`  
Board: TTGO T-Call ESP32 SIM800L (safe pins: 2, 13, 14, 15, 25, 32, 33)

## Docs

Full documentation at [iot.aitalim.com/docs.html](https://iot.aitalim.com/docs.html)
