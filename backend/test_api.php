<?php
// test_api.php
// Простий скрипт для тестування API

echo "🧪 Тестування Restaurant API...\n\n";

// Базовий URL API
$baseUrl = 'http://localhost:8080';

// Дані для авторизації
$auth = base64_encode('admin:restaurant123');

/**
 * Виконати HTTP запит
 */
function makeRequest($url, $method = 'GET', $data = null, $needAuth = false) {
    global $auth;

    $options = [
        'http' => [
            'method' => $method,
            'header' => [
                'Content-Type: application/json',
                'Accept: application/json'
            ]
        ]
    ];

    if ($needAuth) {
        $options['http']['header'][] = 'Authorization: Basic ' . $auth;
    }

    if ($data && in_array($method, ['POST', 'PUT'])) {
        $options['http']['content'] = json_encode($data);
    }

    $context = stream_context_create($options);
    $result = @file_get_contents($url, false, $context);

    if ($result === false) {
        return ['error' => 'Помилка запиту'];
    }

    return json_decode($result, true);
}

/**
 * Показати результат тесту
 */
function showResult($testName, $result) {
    echo "📋 {$testName}:\n";

    if (isset($result['error'])) {
        echo "   ❌ Помилка: {$result['error']}\n";
    } elseif (isset($result['success']) && $result['success']) {
        echo "   ✅ Успішно\n";
        if (isset($result['message'])) {
            echo "   💬 {$result['message']}\n";
        }
    } else {
        echo "   ⚠️ Невідомий результат\n";
        print_r($result);
    }
    echo "\n";
}

// Тести

echo "🔍 1. Перевірка головної сторінки API\n";
$result = makeRequest($baseUrl);
showResult('GET /', $result);

echo "🍽️ 2. Отримання меню (публічний доступ)\n";
$result = makeRequest($baseUrl . '/menu');
showResult('GET /menu', $result);

echo "📊 3. Статистика відгуків (публічний доступ)\n";
$result = makeRequest($baseUrl . '/feedback/stats');
showResult('GET /feedback/stats', $result);

echo "🪑 4. Доступні столики (публічний доступ)\n";
$result = makeRequest($baseUrl . '/tables/available');
showResult('GET /tables/available', $result);

echo "👥 5. Список співробітників (потрібна авторизація)\n";
$result = makeRequest($baseUrl . '/employees', 'GET', null, true);
showResult('GET /employees', $result);

echo "📋 6. Всі замовлення (потрібна авторизація)\n";
$result = makeRequest($baseUrl . '/orders', 'GET', null, true);
showResult('GET /orders', $result);

echo "📅 7. Майбутні резервації (потрібна авторизація)\n";
$result = makeRequest($baseUrl . '/reservations/upcoming', 'GET', null, true);
showResult('GET /reservations/upcoming', $result);

echo "💬 8. Створення відгуку (публічний доступ)\n";
$feedbackData = [
    'customer_name' => 'Тестовий клієнт',
    'rating' => 5,
    'comments' => 'Відмінний API! Все працює чудово.',
    'feedback_date' => date('Y-m-d')
];
$result = makeRequest($baseUrl . '/feedback', 'POST', $feedbackData);
showResult('POST /feedback', $result);

echo "📝 9. Створення резервації (публічний доступ)\n";
$reservationData = [
    'customer_name' => 'Тестовий клієнт',
    'customer_phone' => '+380501234567',
    'reservation_date' => date('Y-m-d', strtotime('+1 day')),
    'reservation_time' => '19:00',
    'table_id' => 1,
    'number_of_guests' => 2,
    'notes' => 'Тестова резервація через API'
];
$result = makeRequest($baseUrl . '/reservations', 'POST', $reservationData);
showResult('POST /reservations', $result);

echo "👨‍💼 10. Створення співробітника (потрібна авторизація)\n";
$employeeData = [
    'first_name' => 'Тестовий',
    'last_name' => 'Співробітник',
    'position' => 'Офіціант',
    'phone' => '+380501111111',
    'email' => 'test@restaurant.com',
    'hire_date' => date('Y-m-d'),
    'salary' => 12000
];
$result = makeRequest($baseUrl . '/employees', 'POST', $employeeData, true);
showResult('POST /employees', $result);

echo "🎉 Тестування завершено!\n\n";

echo "💡 Для запуску сервера використовуйте:\n";
echo "   php -S localhost:8080 -t public/\n\n";

echo "📖 Більше прикладів дивіться в README.md\n";
?>