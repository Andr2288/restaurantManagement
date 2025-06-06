<?php
// setup.php
// Покращений скрипт для створення бази даних ресторану

require_once __DIR__ . '/config/db.php';

/**
 * Перевірити, чи існує база даних
 */
function checkDatabaseExists($pdo, $dbname)
{
    $stmt = $pdo->query("SHOW DATABASES LIKE '{$dbname}'");
    return $stmt->rowCount() > 0;
}

/**
 * Отримати підтвердження від користувача
 */
function getUserConfirmation($message)
{
    echo $message . " (y/n): ";
    $handle = fopen("php://stdin", "r");
    $response = trim(fgets($handle));
    fclose($handle);

    return strtolower($response) === 'y' || strtolower($response) === 'yes';
}

/**
 * Видалити базу даних
 */
function dropDatabase($pdo, $dbname)
{
    try {
        $pdo->exec("DROP DATABASE IF EXISTS {$dbname}");
        echo "🗑️ База даних '{$dbname}' видалена\n";
        return true;
    } catch (PDOException $e) {
        echo "❌ Помилка при видаленні БД: " . $e->getMessage() . "\n";
        return false;
    }
}

/**
 * Створити базу даних
 */
function createDatabase($pdo, $dbname)
{
    try {
        $pdo->exec("CREATE DATABASE IF NOT EXISTS {$dbname} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        $pdo->exec("USE {$dbname}");
        echo "✅ База даних '{$dbname}' створена\n";
        return true;
    } catch (PDOException $e) {
        echo "❌ Помилка при створенні БД: " . $e->getMessage() . "\n";
        return false;
    }
}

/**
 * Створити схему таблиць
 */
function createSchema($pdo)
{
    try {
        echo "🏗️ Створення схеми бази даних...\n";

        $schemaFile = __DIR__ . '/database.schema.sql';
        if (!file_exists($schemaFile)) {
            throw new Exception("Файл схеми не знайдено: {$schemaFile}");
        }

        $schemaScript = file_get_contents($schemaFile);

        // Видаляємо команди USE та CREATE DATABASE зі схеми
        $schemaScript = preg_replace('/^CREATE DATABASE.*$/m', '', $schemaScript);
        $schemaScript = preg_replace('/^USE .*$/m', '', $schemaScript);

        $pdo->exec($schemaScript);
        echo "✅ Схема створена\n";
        return true;
    } catch (Exception $e) {
        echo "❌ Помилка при створенні схеми: " . $e->getMessage() . "\n";
        return false;
    }
}

/**
 * Додати тестові дані
 */
function insertTestData($pdo)
{
    try {
        echo "📋 Додавання тестових даних...\n";

        $dataFile = __DIR__ . '/fictitious_data.sql';
        if (!file_exists($dataFile)) {
            throw new Exception("Файл з даними не знайдено: {$dataFile}");
        }

        $dataScript = file_get_contents($dataFile);
        $pdo->exec($dataScript);
        echo "✅ Тестові дані додані\n";
        return true;
    } catch (Exception $e) {
        echo "❌ Помилка при додаванні даних: " . $e->getMessage() . "\n";
        return false;
    }
}

/**
 * Показати статистику створених таблиць
 */
function showTablesStats($pdo, $dbname)
{
    try {
        echo "\n📊 Створені таблиці:\n";

        $stmt = $pdo->query("SHOW TABLES FROM {$dbname}");
        $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);

        foreach ($tables as $table) {
            // Підраховуємо кількість записів у таблиці
            $countStmt = $pdo->query("SELECT COUNT(*) FROM {$table}");
            $count = $countStmt->fetchColumn();

            echo "   - {$table} ({$count} записів)\n";
        }

        echo "\n📈 Загальна статистика:\n";
        echo "   - Всього таблиць: " . count($tables) . "\n";

        return true;
    } catch (Exception $e) {
        echo "❌ Помилка при отриманні статистики: " . $e->getMessage() . "\n";
        return false;
    }
}

/**
 * Головна функція налаштування
 */
function setupDatabase()
{
    try {
        echo "🏪 Починаємо налаштування бази даних ресторану...\n\n";

        // Отримуємо налаштування з .env
        $host = getenv('DB_HOST') ?: 'localhost';
        $user = getenv('DB_USER') ?: 'root';
        $password = getenv('DB_PASSWORD') ?: '';
        $dbname = getenv('DB_NAME') ?: 'restaurant_management_db';

        echo "🔧 Налаштування підключення:\n";
        echo "   - Хост: {$host}\n";
        echo "   - Користувач: {$user}\n";
        echo "   - База даних: {$dbname}\n\n";

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

        echo "✅ Підключено до MySQL сервера\n\n";

        // Перевіряємо, чи існує база даних
        $databaseExists = checkDatabaseExists($pdo, $dbname);

        if ($databaseExists) {
            echo "⚠️ База даних '{$dbname}' вже існує!\n";

            if (getUserConfirmation("Видалити існуючу базу даних та створити нову?")) {
                if (!dropDatabase($pdo, $dbname)) {
                    return false;
                }
                echo "\n";
            } else {
                echo "❌ Установка скасована користувачем\n";
                return false;
            }
        } else {
            echo "ℹ️ База даних '{$dbname}' не існує. Створюємо нову...\n";
        }

        // Створюємо базу даних
        if (!createDatabase($pdo, $dbname)) {
            return false;
        }

        // Створюємо схему
        if (!createSchema($pdo)) {
            return false;
        }

        // Додаємо тестові дані
        if (!insertTestData($pdo)) {
            return false;
        }

        // Показуємо статистику
        showTablesStats($pdo, $dbname);

        echo "\n🎉 База даних успішно налаштована та готова до роботи!\n";
        echo "\n💡 Для тестування API використовуйте:\n";
        echo "   php -S localhost:8080 -t public/\n";
        echo "   Або відкрийте: http://localhost:8080/employees\n\n";

        return true;

    } catch (PDOException $e) {
        echo "❌ Помилка підключення до MySQL: " . $e->getMessage() . "\n";
        echo "\n🔧 Перевірте:\n";
        echo "   - Чи запущений MySQL сервер\n";
        echo "   - Правильність даних у файлі .env\n";
        echo "   - Чи має користувач права на створення БД\n";
        return false;
    } catch (Exception $e) {
        echo "❌ Загальна помилка: " . $e->getMessage() . "\n";
        return false;
    }
}

/**
 * Тест підключення до БД
 */
function testConnection()
{
    echo "🔍 Тестування підключення до бази даних...\n\n";

    try {
        $database = new Database();
        if ($database->testConnection()) {
            echo "\n✅ Підключення працює! База даних готова до використання.\n";
            return true;
        }
    } catch (Exception $e) {
        echo "❌ Помилка тестування: " . $e->getMessage() . "\n";
    }

    return false;
}

// Перевіряємо аргументи командного рядка
if (isset($argv[1])) {
    switch ($argv[1]) {
        case 'test':
            testConnection();
            break;
        case 'setup':
        case 'install':
            setupDatabase();
            break;
        case 'help':
        case '--help':
        case '-h':
            echo "📋 Доступні команди:\n";
            echo "   php setup.php          - Повне налаштування БД\n";
            echo "   php setup.php setup    - Те саме що і без аргументів\n";
            echo "   php setup.php test     - Тест підключення до БД\n";
            echo "   php setup.php help     - Показати цю довідку\n\n";
            break;
        default:
            echo "❌ Невідома команда: {$argv[1]}\n";
            echo "Використайте 'php setup.php help' для списку команд\n";
    }
} else {
    // За замовчуванням запускаємо налаштування
    setupDatabase();
}