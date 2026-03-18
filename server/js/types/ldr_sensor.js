/**
 * LDR Sensor Device Module
 */
import { WIFI_SSID, WIFI_PASS, SERVER_URL } from '../core.js';

export const label = 'LDR Sensor';
export const desc = 'Light-dependent resistor reads ambient light level.';

export const sensors = {
    light_level: { label: 'Light Level', unit: '' }
};

export const controls = [];
export const configDefaults = {};

export function generateCode(d) {
    return `// ============================================================
// ${d.name} — LDR Sensor
// ============================================================
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

#define WIFI_SSID       "${WIFI_SSID}"
#define WIFI_PASSWORD   "${WIFI_PASS}"
#define SERVER_URL      "${SERVER_URL}"
#define DEVICE_ID       "${d.device_id}"

void setup() {
    Serial.begin(115200);
    connectWiFi();
}

void loop() {
    if (WiFi.status() != WL_CONNECTED) connectWiFi();
    sendData();
    delay(5000);
}

void connectWiFi() {
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    while (WiFi.status() != WL_CONNECTED) { delay(500); }
}

void sendData() {
    JsonDocument doc;
    doc["light_level"] = analogRead(32);
    String payload;
    serializeJson(doc, payload);
    HTTPClient http;
    http.begin(String(SERVER_URL) + "/data/" + DEVICE_ID);
    http.addHeader("Content-Type", "application/json");
    http.POST(payload);
    http.end();
}`;
}
