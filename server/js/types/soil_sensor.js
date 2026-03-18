/**
 * Soil Sensor Device Module
 */
import { WIFI_SSID, WIFI_PASS, SERVER_URL } from '../core.js';

export const label = 'Soil Sensor';
export const desc = '7-parameter soil analysis: moisture, pH, nitrogen, phosphorus, potassium, temperature, conductivity.';

export const sensors = {
    moisture: { label: 'Moisture', unit: '%' },
    ph: { label: 'pH', unit: '' },
    nitrogen: { label: 'Nitrogen', unit: 'mg/kg' },
    phosphorus: { label: 'Phosphorus', unit: 'mg/kg' },
    potassium: { label: 'Potassium', unit: 'mg/kg' },
    temp_c: { label: 'Soil Temp', unit: '°C' },
    conductivity: { label: 'Conductivity', unit: 'dS/m' }
};

export const controls = [];
export const configDefaults = {};

export function generateCode(d) {
    return `// ============================================================
// ${d.name} — Soil Sensor
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
    delay(30000);
}

void connectWiFi() {
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    while (WiFi.status() != WL_CONNECTED) { delay(500); }
}

void sendData() {
    JsonDocument doc;
    doc["moisture"] = random(30, 70);
    doc["ph"] = 6.5;
    doc["nitrogen"] = 20;
    doc["phosphorus"] = 15;
    doc["potassium"] = 30;
    doc["temp_c"] = 22.5;
    doc["conductivity"] = 1.2;
    String payload;
    serializeJson(doc, payload);
    HTTPClient http;
    http.begin(String(SERVER_URL) + "/data/" + DEVICE_ID);
    http.addHeader("Content-Type", "application/json");
    http.POST(payload);
    http.end();
}`;
}
