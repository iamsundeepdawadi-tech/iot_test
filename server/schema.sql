-- ============================================================
-- IoT Farm — Database Schema
-- ============================================================
-- Database: aitalimc_iot
-- Run: mysql -u aitalimc_admin -p aitalimc_iot < schema.sql
-- Or import via phpMyAdmin on cPanel
-- ============================================================

CREATE TABLE IF NOT EXISTS devices (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    device_id   VARCHAR(50) NOT NULL UNIQUE,
    device_type VARCHAR(50) NOT NULL,
    name        VARCHAR(100) NOT NULL,
    location    VARCHAR(100) DEFAULT '',
    config      JSON DEFAULT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_seen   DATETIME DEFAULT NULL,
    ip_address  VARCHAR(45) DEFAULT '',

    INDEX idx_type (device_type),
    INDEX idx_device (device_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
