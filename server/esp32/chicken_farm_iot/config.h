// ============================================================
// Chicken Farm IoT — Configuration
// ============================================================
// Edit these values before uploading to your ESP32

#ifndef CONFIG_H
#define CONFIG_H

// --- WiFi ---
#define WIFI_SSID       "accounthack_fbnpa_2"
#define WIFI_PASSWORD   "CLED02502F"

// --- Server ---
#define SERVER_URL      "http://iot.aitalim.com"

// --- Device ---
#define DEVICE_ID       "esp32_01"

// --- Pins (TTGO T-Call safe) ---
#define DHT_PIN         25      // DHT22 data pin
#define DHT_TYPE        DHT22
#define RELAY_LIGHT     13      // Relay for lighting
#define RELAY_HEATER    14      // Relay for heater

// --- Intervals (milliseconds) ---
#define SENSOR_INTERVAL     10000   // Post sensor data every 10s
#define CONFIG_INTERVAL     5000    // Poll for config every 5s
#define HTTP_TIMEOUT        5000    // HTTP request timeout

#endif
