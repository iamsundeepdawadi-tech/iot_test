<?php
// ============================================================
// API: /api/login.php
// ============================================================
// POST — Login with username/password → session
// GET  — Check if logged in
// ============================================================

session_start();
require_once __DIR__ . '/../config.php';

$method = $_SERVER['REQUEST_METHOD'];

// ── GET: Check auth status ──
if ($method === 'GET') {
    header('Content-Type: application/json');
    jsonResponse([
        'authenticated' => isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true,
        'user'          => $_SESSION['username'] ?? null
    ]);
}

// ── POST: Login ──
if ($method === 'POST') {
    $data = getJsonInput();
    $username = $data['username'] ?? '';
    $password = $data['password'] ?? '';

    if ($username === ADMIN_USER && $password === ADMIN_PASS) {
        $_SESSION['logged_in'] = true;
        $_SESSION['username']  = $username;
        jsonResponse(['status' => 'ok', 'message' => 'Login successful']);
    }

    jsonError('Invalid credentials', 401);
}

jsonError('Method not allowed', 405);
