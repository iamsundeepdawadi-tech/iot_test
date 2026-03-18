// ============================================================
// Chicken Farm IoT — Configuration
// ============================================================
// Edit these values before uploading to your ESP32

#ifndef CONFIG_H
#define CONFIG_H

// --- WiFi ---
#define WIFI_SSID       "YOUR_WIFI_SSID"
#define WIFI_PASSWORD   "YOUR_WIFI_PASSWORD"

// --- Server ---
// Your Ubuntu server IP/hostname (NO trailing slash)
#define SERVER_URL      "http://192.168.1.100:8080"

// --- Device ---
#define DEVICE_ID       "esp32_01"

// --- Pins ---
#define DHT_PIN         4       // DHT22 data pin
#define DHT_TYPE        DHT22
#define RELAY_LIGHT     16      // Relay for lighting
#define RELAY_HEATER    17      // Relay for heater/fan

// --- Intervals (milliseconds) ---
#define SENSOR_INTERVAL     10000   // Post sensor data every 10s
#define COMMAND_INTERVAL    5000    // Poll for commands every 5s
#define WIFI_RETRY_DELAY    5000    // Wait before WiFi reconnect
#define HTTP_TIMEOUT        5000    // HTTP request timeout

#endif
