<?php
// public/api/tables.php
// API для управління столиками

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Обробка OPTIONS запитів для CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Автозавантаження
require_once __DIR__ . '/../../src/autoload.php';
require_once __DIR__ . '/../../config/db.php';

use Restaurant\controllers\TableController;

try {
    // Підключення до БД
    $database = new Database();
    $db = $database->getConnection();

    // Отримуємо метод запиту та ID ресурсу
    $method = $_SERVER['REQUEST_METHOD'];
    $uri = $_SERVER['REQUEST_URI'];

    // Витягуємо ID з URI
    $resourceId = null;
    if (preg_match('/\/tables\/(\d+)/', $uri, $matches)) {
        $resourceId = $matches[1];
    }

    // Створюємо контролер та обробляємо запит
    $controller = new TableController($db, $method, $resourceId);
    $controller->processRequest('/tables');

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Внутрішня помилка сервера',
        'message' => $e->getMessage()
    ]);
}