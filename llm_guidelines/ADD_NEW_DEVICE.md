# Adding a New Device Type — Step-by-Step

> **Audience**: AI coding assistants (LLM agents)
> **Difficulty**: Easy — 1 new file + 2 small edits
> **Time**: ~5 minutes

## Prerequisites

Read `OVERVIEW.md` first to understand the architecture.

## Deep Dive: Architecture of a Device Module

IoT Farm is designed to make adding new hardware completely frictionless. Instead of editing 10 different files or writing SQL migrations, all business logic for a device type lives inside **one ES6 module**.

### How the Frontend Works (Dynamic Rendering)
The dashboard (`index.html`) doesn't know what a "Chicken Coop" or a "Soil Sensor" is. It simply polls `GET /api/devices.php` to find the registered active device.
When you select a device:
1. `dashboard.js` reads its `device_type`.
2. It dynamically imports `js/types/{device_type}.js`.
3. It iterates over your `sensors` object to draw the reading cards.
4. It iterates over your `controls` array to draw sliders/buttons.
5. It calls your `generateCode(d)` function to create the copy/paste `.ino` code for the user.

### How the Backend Works (Zero Migration)
The Vanilla PHP backend (`api/devices.php`, `db.php`) has no idea what your sensors mean. It just stores JSON.
1. When you register a new device, `db.php` checks if `data_{device_id}` table exists. If not, it creates it instantly:
   `CREATE TABLE data_{device_id} (id INT AUTO_INCREMENT, recorded_at DATETIME, data JSON)`
2. When the ESP32 `sendData()` hits `POST /data/{id}`, the backend blindly inserts the payload into the JSON column.
3. This is why **your `sensors` keys in JS MUST EXACTLY MATCH the JSON keys your ESP32 sends**.

---

## Step 1: Create the Module File

Create `server/js/types/{your_type}.js`.

**The type name must be lowercase, alphanumeric with underscores only** — it will be used as the database identifier.

### The Complete Template & Architecture Explanation

```javascript
/**
 * {Human Name} Device Module
 */
// core.js exports the centralized config (WIFI_SSID, WIFI_PASS, SERVER_URL) fetched from iot_config.json
import { WIFI_SSID, WIFI_PASS, SERVER_URL } from '../core.js';

// ── 1. Metadata ──
// Used on the "Devices" registration page to explain what this type does.
export const label = 'Human Readable Name';
export const desc = 'One-line description shown in registration form.';

// ── 2. Sensors (Inputs) ──
// Dictates the live dashboard UI and history table headers.
// ARCHITECTURE RULE: The keys defined here (e.g., "sensor_key") MUST perfectly match 
// the JSON keys that your Arduino `doc["sensor_key"] = ...` generates.
export const sensors = {
    sensor_key: { label: 'Display Name', unit: '°C' },
    // Add more sensors here...
};

// ── 3. Controls (Outputs/State) ──
// Defines interactive elements on the dashboard.
// Currently supported UI primitives:
//   toggle: On/Off buttons   → sends {"key": "on"} or {"key": "off"}
//   range:  Slider            → sends {"key": 50} (integer)
// When a user clicks a control, it sends a PATCH to /config/{device_id}.
export const controls = [
    { key: 'relay', label: 'Relay', type: 'toggle' },
    { key: 'threshold', label: 'Threshold', type: 'range', min: 0, max: 100, step: 5 },
    // If your device only reads data and has no relays/controls, use: []
];

// ── 4. Default Config ──
// The initial state saved to the 'devices' table when registered.
// The ESP32 will GET /config/{device_id} and receive exactly this JSON.
export const configDefaults = { relay: 'off', threshold: 50 };

// ── 5. Arduino Code Generator ──
// This is the magic. When the user clicks "View Code", this string is returned.
// 'd' is the device row from MySQL: { device_id, name, device_type, location }
export function generateCode(d) {
    return `// ============================================================
// ${d.name} — {Type Name}
// Generated securely for device: ${d.device_id}
// ============================================================
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// Automatically injected from iot_config.json!
#define WIFI_SSID     "${WIFI_SSID}"
#define WIFI_PASSWORD "${WIFI_PASS}"
#define SERVER_URL    "${SERVER_URL}"
#define DEVICE_ID     "${d.device_id}"

// Define your pins here (TTGO safe pins: 13, 14, 15, 25, 32, 33)
#define SENSOR_PIN    32
#define RELAY_PIN     13

unsigned long lastSend = 0;
unsigned long lastConfig = 0;

void setup() {
    Serial.begin(115200);
    pinMode(RELAY_PIN, OUTPUT);
    
    // Connect to WiFi blocking
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    while (WiFi.status() != WL_CONNECTED) delay(500);
}

void loop() {
    // Auto-reconnect WiFi if dropped
    if (WiFi.status() != WL_CONNECTED) {
        WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
        while (WiFi.status() != WL_CONNECTED) delay(500);
    }
    
    unsigned long now = millis();
    
    // Telemetry Thread: Read sensors and push to /data/{id} every 10s
    if (now - lastSend >= 10000) { 
        lastSend = now; 
        sendData(); 
    }
    
    // Control Thread: Pull config from /config/{id} every 5s
    if (now - lastConfig >= 5000) { 
        lastConfig = now; 
        readConfig(); 
    }
    delay(100); // Prevent watchdog timeout
}

// Architecture: Sensor Push
void sendData() {
    int value = analogRead(SENSOR_PIN); // READ YOUR SENSOR

    // The JSON Document key MUST match the export const sensors key!
    JsonDocument doc;
    doc["sensor_key"] = value;  
    
    String payload;
    serializeJson(doc, payload);

    HTTPClient http;
    http.begin(String(SERVER_URL) + "/data/" + DEVICE_ID);
    http.addHeader("Content-Type", "application/json");
    http.POST(payload);
    http.end();
}

// Architecture: Config Pull
void readConfig() {
    HTTPClient http;
    http.begin(String(SERVER_URL) + "/config/" + DEVICE_ID);
    
    if (http.GET() == 200) {
        JsonDocument doc;
        deserializeJson(doc, http.getString());
        
        // Parse the keys defined in export const controls
        const char* relay = doc["relay"] | "off";
        int threshold = doc["threshold"] | 50;
        
        // Apply hardware logic
        digitalWrite(RELAY_PIN, strcmp(relay, "on") == 0 ? HIGH : LOW);
        
        // Auto-control Example:
        // if (analogRead(SENSOR_PIN) < threshold) { digitalWrite(RELAY_PIN, HIGH); }
    }
    http.end();
}`;
}
```

## Step 2: Register the Type in Backend

Open `server/api/devices.php` and add your type to the `$defaultConfigs` array (around line 15):

```php
$defaultConfigs = [
    'chicken_coop'  => ['light' => 'off', 'heater' => 'off', 'desired_temp' => 28],
    'soil_sensor'   => [],
    'ldr_sensor'    => [],
    'random_test'   => ['led' => 'off'],
    
    // ↓ ADD YOUR TYPE HERE ↓
    // The key MUST match your JS filename (without .js).
    // The array MUST match your module's configDefaults.
    'your_type'     => ['relay' => 'off', 'threshold' => 50],
];
```

## Step 3: Add to Registration Dropdown

Open `server/devices.html` and add an `<option>` to the `<select id="f-type">` element:

```html
<option value="your_type">Human Name</option>
```

## Step 4: Update Deploy Script

Since IoT Farm avoids CI/CD pipelines in favor of brutalist simplicity, you must manually list files to upload.
Open `test/deploy_mac.sh` and `test/deploy_win.bat` and add your new JS file to the `FILES` array:

```bash
    "js/types/your_type.js"
```

## Step 5: Deploy & Test

```bash
cd test/
./deploy.sh

# Test with curl
curl -X POST https://iot.aitalim.com/api/devices.php \
  -H "Content-Type: application/json" \
  -d '{"device_id":"test_new","device_type":"your_type","name":"Test","location":"Lab"}'

curl https://iot.aitalim.com/config/test_new
# Should return: {"relay":"off","threshold":50}
```

## Checklist

- [ ] Created `server/js/types/{type}.js` with all 5 exports
- [ ] Added type to `$defaultConfigs` in `server/api/devices.php`
- [ ] Added `<option>` to `server/devices.html`
- [ ] Added file to `FILES` array in `test/deploy.sh`
- [ ] Deployed and tested with curl

## Common Mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| Sensor key mismatch | Dashboard shows `—` for readings | Ensure ESP32 POSTs the same JSON keys as your `sensors` object |
| Missing `$defaultConfigs` entry | 400 error on device registration | Add your type to `api/devices.php` |
| Forgot `<option>` in dropdown | Can't select type in UI | Add to `devices.html` select |
| Used uppercase/spaces in type name | Module fails to load | Use `lowercase_with_underscores` only |

## Existing Device Types for Reference

| Type | File | Sensors | Controls |
|------|------|---------|----------|
| `chicken_coop` | `js/types/chicken_coop.js` | temp_c, humidity | light (toggle), heater (toggle), desired_temp (range) |
| `random_test` | `js/types/random_test.js` | value | led (toggle) |
| `soil_sensor` | `js/types/soil_sensor.js` | moisture, ph, nitrogen, phosphorus, potassium, temp_c, conductivity | none |
| `ldr_sensor` | `js/types/ldr_sensor.js` | light_level | none |
