<?php
// ============================================================
// IoT Farm — Configuration
// ============================================================

define('DB_HOST', 'localhost');
define('DB_NAME', 'aitalimc_iot');
define('DB_USER', 'aitalimc_admin');
define('DB_PASS', '@dmin#123');

// Dashboard auth
define('ADMIN_USER', 'admin');
define('ADMIN_PASS', '@dmin#123');

// CORS + JSON headers
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
