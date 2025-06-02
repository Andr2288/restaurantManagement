<?php
// config/db.php

// Завантаження змінних середовища
$envFile = __DIR__ . '/../.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '#') === 0) {
            continue;
        }
        list($name, $value) = explode('=', $line, 2);
        $_ENV[trim($name)] = trim($value);
        putenv(sprintf('%s=%s', trim($name), trim($value)));
    }
}

/**
 * Клас для роботи з базою даних
 */
class Database
{
    private $host;
    private $user;
    private $password;
    private $dbname;
    private $conn;

    /**
     * Конструктор класу
     */
    public function __construct()
{
    $this->host = getenv('DB_HOST') ?: 'localhost';
    $this->user = getenv('DB_USER') ?: 'root';
    $this->password = getenv('DB_PASSWORD') ?: '';
    $this->dbname = getenv('DB_NAME') ?: 'restaurant_management_db';
}

    /**
     * Підключення до бази даних
     */
    public function connect()
{
    try {
        $this->conn = new PDO(
            "mysql:host={$this->host};dbname={$this->dbname};charset=utf8mb4",
            $this->user,
            $this->password,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
    ]
    );
        return $this->conn;
    } catch (PDOException $e) {
    echo "❌ Помилка підключення: " . $e->getMessage();
    exit;
}
}

    /**
     * Тест підключення до бази даних
     */
    public function testConnection()
{
    try {
        $this->connect();
        echo "✅ Підключення до БД успішне\n";
        return true;
    } catch (Exception $e) {
    echo "❌ Помилка підключення: " . $e->getMessage() . "\n";
    return false;
}
}

    /**
     * Отримання з'єднання з базою даних
     */
    public function getConnection()
{
    return $this->conn ?: $this->connect();
}
}