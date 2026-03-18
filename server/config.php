<?php
// ============================================================
// IoT Farm — Configuration
// ============================================================

define('DB_HOST', 'localhost');
define('DB_NAME', 'aitalimc_iot');
define('DB_USER', 'aitalimc_admin');
define('DB_PASS', '@dmin#123');

// Global error handler for API
set_exception_handler(function($e) {
    header('Content-Type: application/json; charset=utf-8');
    http_response_code(500);
    $msg = $e->getMessage();
    // Catch common "table not found" error to help user debug
    if ($e instanceof PDOException && strpos($msg, 'Base table or view not found') !== false) {
        $msg .= " — CRITICAL FIX: The database tables do not exist! You MUST import 'server/schema.sql' into your 'aitalimc_iot' database via phpMyAdmin.";
    }
    echo json_encode(['status' => 'error', 'error' => $msg], JSON_UNESCAPED_UNICODE);
    exit;
});

// Configure CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// --- Helpers ---
function jsonResponse($data, $code = 200) {
    header('Content-Type: application/json; charset=utf-8');
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function jsonError($msg, $code = 400) {
    jsonResponse(['error' => $msg], $code);
}

function getJsonInput() {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    if ($data === null && json_last_error() !== JSON_ERROR_NONE) {
        jsonError('Invalid JSON body');
    }
    return $data ?: [];
}

function sanitizeDeviceId($id) {
    return preg_replace('/[^a-zA-Z0-9_]/', '', $id);
}
