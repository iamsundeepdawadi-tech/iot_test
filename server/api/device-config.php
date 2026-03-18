<?php
// ============================================================
// API: /config/{device_id}  (rewritten from /api/device-config.php)
// ============================================================
// GET  — ESP32 polls its config (control signals)
// POST — Dashboard updates config (light on/off, desired_temp, etc)
// ============================================================

require_once __DIR__ . '/../db.php';

$deviceId = sanitizeDeviceId($_GET['device_id'] ?? '');
if (empty($deviceId)) {
    jsonError('Missing device_id');
}

$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];

// ── GET: ESP32 reads its config ──
if ($method === 'GET') {
    $stmt = $db->prepare('SELECT config, device_type FROM devices WHERE device_id = ?');
    $stmt->execute([$deviceId]);
    $row = $stmt->fetch();

    if (!$row) {
        jsonError('Device not found: ' . $deviceId, 404);
    }

    $config = json_decode($row['config'] ?? '{}', true) ?: [];

    // Update last_seen
    $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    $stmt = $db->prepare('UPDATE devices SET last_seen = NOW(), ip_address = ? WHERE device_id = ?');
    $stmt->execute([$ip, $deviceId]);

    jsonResponse($config);
}

// ── POST: Dashboard updates config ──
if ($method === 'POST') {
    $data = getJsonInput();
    if (empty($data)) {
        jsonError('Empty config payload');
    }

    // Verify device exists
    $stmt = $db->prepare('SELECT config FROM devices WHERE device_id = ?');
    $stmt->execute([$deviceId]);
    $row = $stmt->fetch();

    if (!$row) {
        jsonError('Device not found: ' . $deviceId, 404);
    }

    // Merge new config with existing (partial updates supported)
    $existing = json_decode($row['config'] ?? '{}', true) ?: [];
    $merged = array_merge($existing, $data);

    $stmt = $db->prepare('UPDATE devices SET config = ? WHERE device_id = ?');
    $stmt->execute([json_encode($merged), $deviceId]);

    jsonResponse(['status' => 'ok', 'config' => $merged]);
}

jsonError('Method not allowed', 405);
