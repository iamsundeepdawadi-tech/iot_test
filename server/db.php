<?php
// ============================================================
// IoT Farm — Database Connection
// ============================================================

require_once __DIR__ . '/config.php';

function getDB() {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4';
            $pdo = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
        } catch (PDOException $e) {
            jsonError('Database connection failed: ' . $e->getMessage(), 500);
        }
    }
    return $pdo;
}

// Create per-device data table if it doesn't exist
function ensureDeviceTable($deviceId) {
    $db = getDB();
    $safe = sanitizeDeviceId($deviceId);
    if (empty($safe)) return false;

    $db->exec("
        CREATE TABLE IF NOT EXISTS `data_{$safe}` (
            id          INT AUTO_INCREMENT PRIMARY KEY,
            recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            data        JSON NOT NULL,
            INDEX idx_time (recorded_at DESC)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
    return true;
}
