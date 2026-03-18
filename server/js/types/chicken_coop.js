/**
 * Chicken Coop Device Module
 */
import { WIFI_SSID, WIFI_PASS, SERVER_URL } from '../core.js';

export const label = 'Chicken Coop';
export const desc = 'DHT22 temperature + humidity sensor. Light and heater relay control.';

export const sensors = {
    temp_c: { label: 'Temperature', unit: '°C' },
    humidity: { label: 'Humidity', unit: '%' }
};

export const controls = [
    { key: 'light', label: 'Light', type: 'toggle' },
    { key: 'heater', label: 'Heater', type: 'toggle' },
    { key: 'desired_temp', label: 'Desired Temp (°C)', type: 'range', min: 15, max: 40, step: 1 }
];

export const configDefaults = { light: 'off', heater: 'off', desired_temp: 28 };

export function generateCode(d) {
    return `// ============================================================
// ${d.name} — Chicken Coop Controller
// ============================================================
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

#define WIFI_SSID       "${WIFI_SSID}"
#define WIFI_PASSWORD   "${WIFI_PASS}"
#define SERVER_URL      "${SERVER_URL}"
#define DEVICE_ID       "${d.device_id}"

#define DHT_PIN         25
#define DHT_TYPE        DHT22
#define RELAY_LIGHT     13
#define RELAY_HEATER    14

DHT dht(DHT_PIN, DHT_TYPE);
unsigned long lastSend = 0;
unsigned long lastConfig = 0;

void setup() {
    Serial.begin(115200);
    pinMode(RELAY_LIGHT, OUTPUT);
    pinMode(RELAY_HEATER, OUTPUT);
    digitalWrite(RELAY_LIGHT, LOW);
    digitalWrite(RELAY_HEATER, LOW);
    dht.begin();
    connectWiFi();
}

void loop() {
    if (WiFi.status() != WL_CONNECTED) connectWiFi();
    unsigned long now = millis();
    if (now - lastSend >= 10000) { lastSend = now; sendData(); }
    if (now - lastConfig >= 5000) { lastConfig = now; readConfig(); }
    delay(100);
}

void connectWiFi() {
    Serial.printf("[WiFi] Connecting to %s", WIFI_SSID);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
    Serial.printf("\\n[WiFi] OK IP: %s\\n", WiFi.localIP().toString().c_str());
}

void sendData() {
    float temp = dht.readTemperature();
    float hum = dht.readHumidity();
    if (isnan(temp) || isnan(hum)) return;
    JsonDocument doc;
    doc["temp_c"] = temp;
    doc["humidity"] = hum;
    String payload;
    serializeJson(doc, payload);
    HTTPClient http;
    http.begin(String(SERVER_URL) + "/data/" + DEVICE_ID);
    http.addHeader("Content-Type", "application/json");
    http.POST(payload);
    http.end();
}

void readConfig() {
    HTTPClient http;
    http.begin(String(SERVER_URL) + "/config/" + DEVICE_ID);
    int code = http.GET();
    if (code == 200) {
        String body = http.getString();
        JsonDocument doc;
        deserializeJson(doc, body);

        // Apply light relay
        String light = doc["light"] | "off";
        digitalWrite(RELAY_LIGHT, light == "on" ? HIGH : LOW);

        // Apply heater relay (manual override)
        String heater = doc["heater"] | "off";
        digitalWrite(RELAY_HEATER, heater == "on" ? HIGH : LOW);

        // Auto-heater: if temp < desired_temp, force heater on
        int desired = doc["desired_temp"] | 28;
        float curTemp = dht.readTemperature();
        if (!isnan(curTemp) && curTemp < desired) {
            digitalWrite(RELAY_HEATER, HIGH);
        }
    }
    http.end();
}`;
}
