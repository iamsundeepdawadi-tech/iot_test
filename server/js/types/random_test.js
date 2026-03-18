/**
 * Random Test Device Module
 */
import { WIFI_SSID, WIFI_PASS, SERVER_URL } from '../core.js';

export const label = 'Random Test (Demo)';
export const desc = 'Sends a random number every second. LED on/off control.';

export const sensors = {
    value: { label: 'Value', unit: '' }
};

export const controls = [
    { key: 'led', label: 'Built-in LED', type: 'toggle' }
];

export const configDefaults = { led: 'off' };

export function generateCode(d) {
    return `// ============================================================
// ${d.name} — Random Test
// ============================================================
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

#define WIFI_SSID       "${WIFI_SSID}"
#define WIFI_PASSWORD   "${WIFI_PASS}"
#define SERVER_URL      "${SERVER_URL}"
#define DEVICE_ID       "${d.device_id}"

#define LED_PIN         2

unsigned long lastSend = 0;
unsigned long lastConfig = 0;

void setup() {
    Serial.begin(115200);
    pinMode(LED_PIN, OUTPUT);
    connectWiFi();
}

void loop() {
    if (WiFi.status() != WL_CONNECTED) connectWiFi();
    unsigned long now = millis();
    if (now - lastSend >= 2000) { lastSend = now; sendData(); }
    if (now - lastConfig >= 2000) { lastConfig = now; readConfig(); }
    delay(50);
}

void connectWiFi() {
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    while (WiFi.status() != WL_CONNECTED) { delay(500); }
}

void sendData() {
    JsonDocument doc;
    doc["value"] = random(0, 1001);
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
    if (http.GET() == 200) {
        JsonDocument doc;
        deserializeJson(doc, http.getString());
        const char* led = doc["led"] | "off";
        digitalWrite(LED_PIN, strcmp(led, "on") == 0 ? HIGH : LOW);
    }
    http.end();
}`;
}
