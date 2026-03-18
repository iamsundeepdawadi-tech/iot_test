<?php
// ============================================================
// API: /api/devices.php
// ============================================================
// GET  — List all devices (with optional ?type= filter)
// POST — Register a new device (no delete allowed)
// ============================================================

require_once __DIR__ . '/../db.php';

$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];

// Default configs per device type
$defaultConfigs = [
    'chicken_coop'  => ['light' => 'off', 'heater' => 'off', 'desired_temp' => 28],
    'soil_sensor'   => [],
    'ldr_sensor'    => [],
    'random_test'   => ['led' => 'off'],
];

// ── GET: List devices ──
if ($method === 'GET') {
    $type = $_GET['type'] ?? null;
    $deviceId = $_GET['device_id'] ?? null;

    if ($deviceId) {
        $stmt = $db->prepare('SELECT * FROM devices WHERE device_id = ?');
        $stmt->execute([$deviceId]);
    } elseif ($type) {
        $stmt = $db->prepare('SELECT * FROM devices WHERE device_type = ? ORDER BY created_at DESC');
        $stmt->execute([$type]);
    } else {
        $stmt = $db->query('SELECT * FROM devices ORDER BY created_at DESC');
    }

    $rows = $stmt->fetchAll();
    foreach ($rows as &$row) {
        $row['config'] = json_decode($row['config'] ?? '{}', true);
    }

    jsonResponse($rows);
}

// ── POST: Register new device ──
if ($method === 'POST') {
    $data = getJsonInput();

    $required = ['device_id', 'device_type', 'name'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            jsonError("Missing required field: {$field}");
        }
    }

    $deviceId   = sanitizeDeviceId($data['device_id']);
    $deviceType = $data['device_type'];
    $name       = $data['name'];
    $location   = $data['location'] ?? '';

    if (empty($deviceId)) {
        jsonError('Invalid device_id (alphanumeric and underscore only)');
    }

    // Check valid device type
    $validTypes = array_keys($defaultConfigs);
    if (!in_array($deviceType, $validTypes)) {
        jsonError('Invalid device_type. Valid types: ' . implode(', ', $validTypes));
    }

    // Check duplicate
    $stmt = $db->prepare('SELECT device_id FROM devices WHERE device_id = ?');
    $stmt->execute([$deviceId]);
    if ($stmt->fetch()) {
        jsonError('Device ID already exists: ' . $deviceId);
    }

    // Set default config for this device type
    $config = $defaultConfigs[$deviceType] ?? [];

    // Insert device
    $stmt = $db->prepare(
        'INSERT INTO devices (device_id, device_type, name, location, config) VALUES (?, ?, ?, ?, ?)'
    );
    $stmt->execute([$deviceId, $deviceType, $name, $location, json_encode($config)]);

    // Create data table for this device
    ensureDeviceTable($deviceId);

    jsonResponse([
        'status'    => 'ok',
        'device_id' => $deviceId,
        'config'    => $config,
        'message'   => 'Device registered successfully'
    ], 201);
}

jsonError('Method not allowed', 405);
