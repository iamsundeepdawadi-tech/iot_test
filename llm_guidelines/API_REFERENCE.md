# API Reference

> **Audience**: AI coding assistants (LLM agents)
> **Base URL**: `https://iot.aitalim.com`

## URL Routing

All clean URLs are handled by `.htaccess` rewrite rules:

| Clean URL | Rewrites To | Purpose |
|-----------|-------------|---------|
| `/` | `index.html` | Dashboard |
| `/dashboard/{device_id}` | `index.html?device_id={id}` | Dashboard with pre-selected device |
| `/devices` | `devices.html` | Device manager |
| `/docs` | `docs.html` | Documentation |
| `/data/{device_id}` | `api/data.php?device_id={id}` | Sensor data endpoint |
| `/config/{device_id}` | `api/device-config.php?device_id={id}` | Device config endpoint |

## Endpoints

---

### `GET /api/devices.php`

List all registered devices.

**Query params:**
- `?type={device_type}` — filter by type
- `?device_id={id}` — get a specific device

**Response** (200):
```json
[
  {
    "device_id": "python_test_01",
    "device_type": "chicken_coop",
    "name": "Test Device",
    "location": "Test Location",
    "config": {"light": "off", "heater": "off", "desired_temp": 28},
    "last_seen": "2026-03-18 12:00:00",
    "ip_address": "27.34.73.230",
    "created_at": "2026-03-18 10:00:00"
  }
]
```

---

### `POST /api/devices.php`

Register a new device.

**Body:**
```json
{
  "device_id": "my_device_01",
  "device_type": "chicken_coop",
  "name": "Barn A Sensor",
  "location": "Barn A"
}
```

**Required fields:** `device_id`, `device_type`, `name`
**Optional fields:** `location`

**Valid `device_type` values:** `chicken_coop`, `random_test`, `soil_sensor`, `ldr_sensor`
(Defined in `$defaultConfigs` array in `api/devices.php`)

**Response** (201):
```json
{
  "status": "ok",
  "device_id": "my_device_01",
  "config": {"light": "off", "heater": "off", "desired_temp": 28},
  "message": "Device registered successfully"
}
```

**Errors:**
- 400: Missing required field, invalid device_type, duplicate device_id
- 400: `Invalid device_id (alphanumeric and underscore only)`

---

### `POST /data/{device_id}`

ESP32 sends sensor readings. Also updates `last_seen` and `ip_address` on the device.

**Body** (any JSON object — stored as-is):
```json
{"temp_c": 25.3, "humidity": 62.1}
```

**Response** (200):
```json
{"status": "ok", "id": 42}
```

**Errors:**
- 404: Device not registered
- 400: Empty data payload

---

### `GET /data/{device_id}?limit=N`

Read recent sensor data. Default limit: 50, max: 500.

**Response** (200):
```json
[
  {"id": "42", "recorded_at": "2026-03-18 12:00:05", "data": {"temp_c": 25.3, "humidity": 62.1}},
  {"id": "41", "recorded_at": "2026-03-18 11:59:55", "data": {"temp_c": 25.1, "humidity": 62.0}}
]
```

Returns empty array `[]` if no data exists yet.

---

### `GET /config/{device_id}`

ESP32 polls this to read its control signals. Also updates `last_seen`.

**Response** (200):
```json
{"light": "on", "heater": "off", "desired_temp": 28}
```

**Errors:**
- 404: `Device not found: {id}`

---

### `POST /config/{device_id}`

Dashboard sends control updates. **Partial updates supported** — only keys you send are merged.

**Body:**
```json
{"light": "on"}
```

**Response** (200):
```json
{"status": "ok", "config": {"light": "on", "heater": "off", "desired_temp": 28}}
```

---

## Error Format

All errors return JSON:
```json
{"error": "Human-readable error message"}
```

HTTP status codes: 400 (bad request), 404 (not found), 405 (method not allowed), 500 (server error).

## CORS

All API endpoints return:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

## curl Testing Cheat Sheet

```bash
# List all devices
curl https://iot.aitalim.com/api/devices.php

# Register device
curl -X POST https://iot.aitalim.com/api/devices.php \
  -H "Content-Type: application/json" \
  -d '{"device_id":"test","device_type":"random_test","name":"Test","location":"Lab"}'

# Send data
curl -X POST https://iot.aitalim.com/data/test \
  -H "Content-Type: application/json" \
  -d '{"value": 42}'

# Read data
curl "https://iot.aitalim.com/data/test?limit=5"

# Read config
curl https://iot.aitalim.com/config/test

# Update config
curl -X POST https://iot.aitalim.com/config/test \
  -H "Content-Type: application/json" \
  -d '{"led": "on"}'
```
