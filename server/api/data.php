<?php
// ============================================================
// API: /data/{device_id}  (rewritten from /api/data.php)
// ============================================================
// POST — ESP32 pushes sensor data (JSON) → stored in per-device table
// GET  — Dashboard reads data (?limit=N)
// ============================================================

require_once __DIR__ . '/../db.php';

$deviceId = sanitizeDeviceId($_GET['device_id'] ?? '');
if (empty($deviceId)) {
    jsonError('Missing device_id');
}

$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];

// ── POST: ESP32 sends sensor data ──
if ($method === 'POST') {
    $data = getJsonInput();
    if (empty($data)) {
        jsonError('Empty data payload');
    }

    // Verify device exists
    $stmt = $db->prepare('SELECT device_id FROM devices WHERE device_id = ?');
    $stmt->execute([$deviceId]);
    if (!$stmt->fetch()) {
        jsonError('Device not registered: ' . $deviceId, 404);
    }

    // Ensure data table exists
    ensureDeviceTable($deviceId);

    // Insert data row
    $safe = sanitizeDeviceId($deviceId);
    $stmt = $db->prepare("INSERT INTO `data_{$safe}` (data) VALUES (?)");
    $stmt->execute([json_encode($data)]);

    // Update last_seen
    $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    $stmt = $db->prepare('UPDATE devices SET last_seen = NOW(), ip_address = ? WHERE device_id = ?');
    $stmt->execute([$ip, $deviceId]);

    jsonResponse(['status' => 'ok', 'id' => (int)$db->lastInsertId()]);
}

// ── GET: Dashboard reads sensor data ──
if ($method === 'GET') {
    $limit = min((int)($_GET['limit'] ?? 50), 500);
    $safe = sanitizeDeviceId($deviceId);

    // Check if table exists
    $tables = $db->query("SHOW TABLES LIKE 'data_{$safe}'")->fetchAll();
    if (empty($tables)) {
        jsonResponse([]);
    }

    $stmt = $db->prepare("SELECT id, recorded_at, data FROM `data_{$safe}` ORDER BY recorded_at DESC LIMIT ?");
    $stmt->execute([$limit]);
    $rows = $stmt->fetchAll();

    // Decode JSON data column
    foreach ($rows as &$row) {
        $row['data'] = json_decode($row['data'], true);
    }

    jsonResponse($rows);
}

jsonError('Method not allowed', 405);
