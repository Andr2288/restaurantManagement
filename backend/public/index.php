<?php
// public/index.php
// Головний файл API ресторану

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
require_once __DIR__ . '/../src/autoload.php';
require_once __DIR__ . '/../config/db.php';

use Restaurant\controllers\EmployeeController;
use Restaurant\controllers\TableController;
use Restaurant\controllers\MenuController;
use Restaurant\controllers\OrderController;
use Restaurant\controllers\ReservationController;
use Restaurant\controllers\FeedbackController;

try {
    // Підключення до БД
    $database = new Database();
    $db = $database->getConnection();

    // Отримуємо URI та метод запиту
    $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $uri = rtrim($uri, '/');
    $method = $_SERVER['REQUEST_METHOD'];

    // Простий роутинг
    $uriParts = explode('/', $uri);

    // Видаляємо порожні елементи
    $uriParts = array_filter($uriParts);
    $uriParts = array_values($uriParts);

    // Головна сторінка API
    if (empty($uriParts)) {
        echo json_encode([
            'success' => true,
            'message' => 'Restaurant Management API',
            'version' => '1.0.0',
            'endpoints' => [
                'GET /employees' => 'Список всіх співробітників',
                'GET /tables' => 'Список всіх столиків',
                'GET /tables/available' => 'Доступні столики',
                'GET /menu' => 'Повне меню',
                'GET /menu/available' => 'Доступні страви',
                'GET /menu/category/{category}' => 'Страви за категорією',
                'GET /orders' => 'Всі замовлення',
                'GET /orders/active' => 'Активні замовлення',
                'GET /orders/date/{date}' => 'Замовлення за датою',
                'GET /reservations' => 'Всі резервації',
                'GET /reservations/upcoming' => 'Майбутні резервації',
                'GET /feedback' => 'Всі відгуки',
                'GET /feedback/published' => 'Опубліковані відгуки',
                'GET /feedback/stats' => 'Статистика відгуків'
            ],
            'auth' => [
                'admin_required' => 'POST, PUT, DELETE методи потребують HTTP Basic Auth',
                'username' => 'admin',
                'password' => 'restaurant123'
            ]
        ]);
        exit;
    }

    // Роутинг до контролерів
    $endpoint = $uriParts[0];
    $resourceId = isset($uriParts[1]) ? $uriParts[1] : null;

    // Якщо resourceId не числовий, це може бути спеціальний ендпоінт
    if ($resourceId && !is_numeric($resourceId)) {
        $resourceId = null;
    }

    switch ($endpoint) {
        case 'employees':
            $controller = new EmployeeController($db, $method, $resourceId);
            $controller->processRequest('/employees');
            break;

        case 'tables':
            $controller = new TableController($db, $method, $resourceId);
            $controller->processRequest('/tables');
            break;

        case 'menu':
            $controller = new MenuController($db, $method, $resourceId);
            $controller->processRequest('/menu');
            break;

        case 'orders':
            $controller = new OrderController($db, $method, $resourceId);
            $controller->processRequest('/orders');
            break;

        case 'reservations':
            $controller = new ReservationController($db, $method, $resourceId);
            $controller->processRequest('/reservations');
            break;

        case 'feedback':
            $controller = new FeedbackController($db, $method, $resourceId);
            $controller->processRequest('/feedback');
            break;

        default:
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'error' => 'Ендпоінт не знайдено',
                'available_endpoints' => ['employees', 'tables', 'menu', 'orders', 'reservations', 'feedback']
            ]);
            break;
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Внутрішня помилка сервера',
        'message' => $e->getMessage()
    ]);
}