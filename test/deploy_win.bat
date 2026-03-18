@echo off
setlocal enabledelayedexpansion
:: ============================================================
:: IoT Farm — Deploy server/ to iot.aitalim.com via FTPS (Windows)
:: ============================================================
:: Usage: deploy_win.bat
:: Requires: Built-in Windows 10/11 curl.exe
:: ============================================================

:: --- Configuration ---
set FTP_USER=admin@iot.aitalim.com
set FTP_PASS=@dmin#123
set FTP_HOST=ftp.aitalim.com
set LOCAL_DIR=..\server

echo ============================================
echo   IoT Farm — Windows FTPS Auto-Deploy
echo   Target: ftp://%FTP_HOST%/
echo ============================================
echo.

if not exist "%LOCAL_DIR%" (
    echo ERROR: ..\server directory not found!
    exit /b 1
)

:: List of files to upload
set FILES=^
 .htaccess^
 css/style.css^
 js/core.js^
 js/dashboard.js^
 js/devices.js^
 js/types/chicken_coop.js^
 js/types/random_test.js^
 js/types/soil_sensor.js^
 js/types/ldr_sensor.js^
 index.html^
 devices.html^
 docs.html^
 config-view.html^
 iot_config.json^
 config.php^
 db.php^
 schema.sql^
 api/data.php^
 api/device-config.php^
 api/devices.php^
 esp32/chicken_farm_iot/chicken_farm_iot.ino^
 esp32/chicken_farm_iot/config.h

for %%F in (%FILES%) do (
    echo Uploading: %%F
    
    :: Convert slash to backslash for local path, but keep slash for FTP
    set LOCAL_FILE=%%F
    set LOCAL_FILE=!LOCAL_FILE:/=\!
    
    curl.exe -s --disable-epsv --ftp-create-dirs -T "%LOCAL_DIR%\!LOCAL_FILE!" "ftp://%FTP_HOST%/%%F" --user "%FTP_USER%:%FTP_PASS%"
    
    if !errorlevel! equ 0 (
        echo   [OK] %%F uploaded
    ) else (
        echo   [FAIL] Failed to upload %%F
        exit /b 1
    )
)

echo.
echo ============================================
echo   DEPLOY SUCCESS!
echo ============================================
echo.
echo   Dashboard: https://iot.aitalim.com
echo   Docs:      https://iot.aitalim.com/docs.html
echo   Config:    https://iot.aitalim.com/config-view.html
echo   API:       https://iot.aitalim.com/api/devices.php
echo.
pause
exit /b 0
