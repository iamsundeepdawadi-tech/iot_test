#!/usr/bin/expect -f
# ============================================================
# IoT Farm — Deploy server/ to iot.aitalim.com via SFTP
# ============================================================
# Usage: ./deploy.sh
# Requires: macOS Terminal (expect and sftp are built-in)
# ============================================================

set timeout -1

# --- Configuration ---
set REMOTE_USER "admin@iot.aitalim.com"
set REMOTE_HOST "iot.aitalim.com"
set REMOTE_PASS "@dmin#123"
set REMOTE_DIR "/home/iot.aitalim.com"
set LOCAL_DIR "server"

puts "============================================"
puts "  IoT Farm — macOS SFTP Auto-Deploy"
puts "  Target: $REMOTE_USER@$REMOTE_HOST"
puts "  Remote: $REMOTE_DIR"
puts "============================================"
puts ""

# Ensure we're in the right directory before launching SFTP
if { [file isdirectory $LOCAL_DIR] == 0 } {
    puts "ERROR: server/ directory not found in current path!"
    puts "Run this script from the iot_test root directory."
    exit 1
}

# Spawn the SFTP interactive session
spawn sftp -o StrictHostKeyChecking=no $REMOTE_USER@$REMOTE_HOST

# Handle password prompt
expect {
    "password:" {
        send "$REMOTE_PASS\r"
    }
    "yes/no" {
        send "yes\r"
        exp_continue
    }
    timeout {
        puts "\nConnection timed out."
        exit 1
    }
}

# Wait for the SFTP prompt
expect "sftp>"

# Run the upload commands
send "cd $REMOTE_DIR\r"
expect "sftp>"

send "mkdir api\r"
expect "sftp>"

send "put $LOCAL_DIR/.htaccess .htaccess\r"
expect "sftp>"

send "put $LOCAL_DIR/index.html index.html\r"
expect "sftp>"

send "put $LOCAL_DIR/docs.html docs.html\r"
expect "sftp>"

send "put $LOCAL_DIR/config.php config.php\r"
expect "sftp>"

send "put $LOCAL_DIR/db.php db.php\r"
expect "sftp>"

send "put $LOCAL_DIR/schema.sql schema.sql\r"
expect "sftp>"

send "cd api\r"
expect "sftp>"

send "put $LOCAL_DIR/api/data.php data.php\r"
expect "sftp>"

send "put $LOCAL_DIR/api/device-config.php device-config.php\r"
expect "sftp>"

send "put $LOCAL_DIR/api/devices.php devices.php\r"
expect "sftp>"

send "put $LOCAL_DIR/api/login.php login.php\r"
expect "sftp>"

send "bye\r"

puts "\n\n============================================"
puts "  DEPLOY SUCCESS!"
puts "============================================"
puts "\n  Dashboard: https://iot.aitalim.com"
puts "  Docs:      https://iot.aitalim.com/docs.html"
puts "  API:       https://iot.aitalim.com/api/devices.php\n"
puts "  Next steps:"
puts "  1. Import schema.sql via phpMyAdmin"
puts "  2. Login: admin / @dmin#123"
puts "  3. Add a device and flash ESP32\n"

exit 0
