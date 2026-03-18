#!/bin/bash
# ============================================================
# IoT Farm — Deploy server/ to iot.aitalim.com via FTPS
# ============================================================
# Usage: ./deploy.sh
# Requires: curl (built-in on macOS)
# ============================================================

# --- Configuration ---
FTP_USER="admin@iot.aitalim.com"
FTP_PASS="@dmin#123"
FTP_HOST="ftp.aitalim.com"
LOCAL_DIR="server"

echo "============================================"
echo "  IoT Farm — macOS FTPS Auto-Deploy"
echo "  Target: ftp://$FTP_HOST/"
echo "============================================"
echo ""

if [ ! -d "$LOCAL_DIR" ]; then
    echo "ERROR: server/ directory not found in current path!"
    exit 1
fi

# List of files to upload
FILES=(
    ".htaccess"
    "css/style.css"
    "js/core.js"
    "js/dashboard.js"
    "js/devices.js"
    "js/types/chicken_coop.js"
    "js/types/random_test.js"
    "js/types/soil_sensor.js"
    "js/types/ldr_sensor.js"
    "index.html"
    "devices.html"
    "docs.html"
    "config.php"
    "db.php"
    "schema.sql"
    "api/data.php"
    "api/device-config.php"
    "api/devices.php"
    "esp32/chicken_farm_iot/chicken_farm_iot.ino"
    "esp32/chicken_farm_iot/config.h"
)

# Upload each file via curl FTPS
for FILE in "${FILES[@]}"; do
    echo "Uploading: $FILE"
    
    # --disable-epsv: Use standard passive mode (fixes some cPanel data connection hangs)
    # --ftp-create-dirs: Auto-create 'api' folder if missing
    curl -s --disable-epsv --ftp-create-dirs -T "$LOCAL_DIR/$FILE" "ftp://$FTP_HOST/$FILE" --user "$FTP_USER:$FTP_PASS"
    
    if [ $? -eq 0 ]; then
        echo "  [OK] $FILE uploaded"
    else
        echo "  [FAIL] Failed to upload $FILE"
        exit 1
    fi
done

echo ""
echo "============================================"
echo "  DEPLOY SUCCESS!"
echo "============================================"
echo ""
echo "  Dashboard: https://iot.aitalim.com"
echo "  Docs:      https://iot.aitalim.com/docs.html"
echo "  API:       https://iot.aitalim.com/api/devices.php"
echo ""
echo "  Next steps:"
echo "  1. Open dashboard to view real-time data"
echo "  2. Add a device and flash ESP32"
echo ""
exit 0
