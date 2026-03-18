// ============================================================
// Chicken Farm IoT — ESP32 Arduino Sketch
// ============================================================
// Reads DHT22 sensor, POSTs data to PHP server, polls for
// commands, and controls relays (light/heater).
//
// Arduino IDE Setup:
//   1. Install ESP32 board package (Espressif)
//   2. Install libraries: "DHT sensor library", "ArduinoJson"
//   3. Select board: "ESP32 Dev Module"
//   4. Edit config.h with your settings
//   5. Upload
// ============================================================

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include "config.h"

// --- Globals ---
DHT dht(DHT_PIN, DHT_TYPE);

unsigned long lastSensorPost   = 0;
unsigned long lastCommandPoll  = 0;

// ============================================================
// SETUP
// ============================================================
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n========================================");
  Serial.println("  Chicken Farm IoT — Starting...");
  Serial.println("========================================");

  // Init relay pins
  pinMode(RELAY_LIGHT, OUTPUT);
  pinMode(RELAY_HEATER, OUTPUT);
  digitalWrite(RELAY_LIGHT, LOW);
  digitalWrite(RELAY_HEATER, LOW);

  // Init sensor
  dht.begin();

  // Connect WiFi
  connectWiFi();
}

// ============================================================
// LOOP
// ============================================================
void loop() {
  // Ensure WiFi is connected
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WiFi] Disconnected! Reconnecting...");
    connectWiFi();
  }

  unsigned long now = millis();

  // Post sensor data at interval
  if (now - lastSensorPost >= SENSOR_INTERVAL) {
    lastSensorPost = now;
    postSensorData();
  }

  // Poll for commands at interval
  if (now - lastCommandPoll >= COMMAND_INTERVAL) {
    lastCommandPoll = now;
    pollCommands();
  }

  delay(100);
}

// ============================================================
// WiFi
// ============================================================
void connectWiFi() {
  Serial.printf("[WiFi] Connecting to %s", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n[WiFi] Connected! IP: %s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("\n[WiFi] Failed to connect. Will retry...");
  }
}

// ============================================================
// POST Sensor Data
// ============================================================
void postSensorData() {
  float temp = dht.readTemperature();
  float hum  = dht.readHumidity();

  if (isnan(temp) || isnan(hum)) {
    Serial.println("[Sensor] Failed to read DHT22!");
    return;
  }

  Serial.printf("[Sensor] Temp: %.1f°C  Humidity: %.1f%%\n", temp, hum);

  // Build JSON
  JsonDocument doc;
  doc["device_id"]  = DEVICE_ID;
  doc["temp_c"]     = temp;
  doc["humidity"]   = hum;
  doc["ts"]         = millis() / 1000;

  String payload;
  serializeJson(doc, payload);

  // POST to server
  HTTPClient http;
  String url = String(SERVER_URL) + "/api/sensor-data.php";
  http.begin(url);
  http.setTimeout(HTTP_TIMEOUT);
  http.addHeader("Content-Type", "application/json");

  int code = http.POST(payload);

  if (code == 200) {
    Serial.println("[HTTP] Sensor data posted OK");
  } else {
    Serial.printf("[HTTP] POST failed, code: %d\n", code);
  }

  http.end();
}

// ============================================================
// Poll Commands
// ============================================================
void pollCommands() {
  HTTPClient http;
  String url = String(SERVER_URL) + "/api/commands-pending.php?device_id=" + DEVICE_ID;
  http.begin(url);
  http.setTimeout(HTTP_TIMEOUT);

  int code = http.GET();

  if (code != 200) {
    Serial.printf("[HTTP] Command poll failed, code: %d\n", code);
    http.end();
    return;
  }

  String body = http.getString();
  http.end();

  // Parse JSON array of commands
  JsonDocument doc;
  DeserializationError err = deserializeJson(doc, body);

  if (err) {
    Serial.printf("[JSON] Parse error: %s\n", err.c_str());
    return;
  }

  JsonArray commands = doc.as<JsonArray>();
  if (commands.size() == 0) return;

  Serial.printf("[CMD] Received %d command(s)\n", commands.size());

  for (JsonObject cmd : commands) {
    int id = cmd["id"];
    const char* type = cmd["command_type"];
    JsonObject payload = cmd["payload"];

    executeCommand(type, payload);
    ackCommand(id);
  }
}

// ============================================================
// Execute Command
// ============================================================
void executeCommand(const char* type, JsonObject payload) {
  const char* action = payload["action"] | "off";

  if (strcmp(type, "light") == 0) {
    bool on = (strcmp(action, "on") == 0);
    digitalWrite(RELAY_LIGHT, on ? HIGH : LOW);
    Serial.printf("[CMD] Light -> %s\n", on ? "ON" : "OFF");
  }
  else if (strcmp(type, "heater") == 0) {
    bool on = (strcmp(action, "on") == 0);
    digitalWrite(RELAY_HEATER, on ? HIGH : LOW);
    Serial.printf("[CMD] Heater -> %s\n", on ? "ON" : "OFF");
  }
  else {
    Serial.printf("[CMD] Unknown command type: %s\n", type);
  }
}

// ============================================================
// Acknowledge Command
// ============================================================
void ackCommand(int id) {
  HTTPClient http;
  String url = String(SERVER_URL) + "/api/commands-ack.php?id=" + String(id);
  http.begin(url);
  http.setTimeout(HTTP_TIMEOUT);

  int code = http.POST("");

  if (code == 200) {
    Serial.printf("[CMD] Acked command #%d\n", id);
  } else {
    Serial.printf("[CMD] Ack failed for #%d, code: %d\n", id, code);
  }

  http.end();
}
