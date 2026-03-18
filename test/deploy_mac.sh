#!/bin/bash
# ============================================================
# IoT Farm — Deploy server/ to iot.aitalim.com via FTPS (macOS/Linux)
# ============================================================
# Usage: ./deploy_mac.sh
# Requires: curl (built-in on macOS)
# ============================================================

# --- Configuration ---
FTP_USER="admin@iot.aitalim.com"
FTP_PASS="@dmin#123"
FTP_HOST="ftp.aitalim.com"
LOCAL_DIR="../server"

echo "============================================"
echo "  IoT Farm — macOS/Linux FTPS Auto-Deploy"
echo "  Target: ftp://$FTP_HOST/"
echo "============================================"
echo ""

if [ ! -d "$LOCAL_DIR" ]; then
    echo "ERROR: ../server directory not found!"
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
    "config-view.html"
    "iot_config.json"
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
    # --ftp-create-dirs: Auto-create folders if missing
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
echo "  Config:    https://iot.aitalim.com/config-view.html"
echo "  API:       https://iot.aitalim.com/api/devices.php"
echo ""
exit 0
