<?php
// setup.php
// Скрипт для створення бази даних ресторану

require_once __DIR__ . '/config/db.php';

/**
 * Налаштування бази даних
 */
function setupDatabase()
{
    try {
        echo "🏪 Починаємо налаштування бази даних ресторану...\n";

        // Налаштування підключення
        $host = getenv('DB_HOST') ?: 'localhost';
        $user = getenv('DB_USER') ?: 'root';
        $password = getenv('DB_PASSWORD') ?: '';

        // Підключення до MySQL без вибору бази даних
        $pdo = new PDO(
            "mysql:host={$host}",
            $user,
            $password,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
            ]
        );

        echo "✅ Підключено до MySQL\n";

        // Створення схеми
        echo "🏗️ Створення схеми бази даних...\n";
        $schemaScript = file_get_contents(__DIR__ . '/database.schema.sql');
        $pdo->exec($schemaScript);
        echo "✅ Схема створена\n";

        // Додавання тестових даних
        echo "📋 Додавання тестових даних...\n";
        $dataScript = file_get_contents(__DIR__ . '/fictitious_data.sql');
        $pdo->exec($dataScript);
        echo "✅ Дані додані\n";

        // Перевірка таблиць
        $dbname = 'restaurant_management_db';
        $stmt = $pdo->query("SHOW TABLES FROM {$dbname}");
        $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);

        echo "\n📊 Створені таблиці:\n";
        foreach ($tables as $table) {
            echo "   - {$table}\n";
        }

        echo "\n🎉 База даних готова до роботи!\n";

    } catch (PDOException $e) {
        echo "❌ Помилка: " . $e->getMessage() . "\n";
    }
}

// Запуск налаштування
setupDatabase();