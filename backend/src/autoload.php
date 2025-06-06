<?php
// src/autoload.php
// Простий автозавантажувач для проекту

spl_autoload_register(function ($className) {
    // Базовий namespace проекту
    $baseNamespace = 'Restaurant\\';

    // Перевіряємо, чи клас належить нашому namespace
    if (strpos($className, $baseNamespace) === 0) {
        // Видаляємо базовий namespace
        $className = substr($className, strlen($baseNamespace));

        // Конвертуємо namespace в шлях до файлу
        $file = __DIR__ . '/' . str_replace('\\', '/', $className) . '.php';

        // Завантажуємо файл, якщо він існує
        if (file_exists($file)) {
            require_once $file;
        }
    }
});