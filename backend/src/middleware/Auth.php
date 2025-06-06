<?php
// src/middleware/Auth.php

namespace Restaurant\middleware;

class Auth
{
    // Простий логін та пароль для адміністратора
    private static $admin_username = 'admin';
    private static $admin_password = 'restaurant123';

    /**
     * Перевірити авторизацію адміністратора
     */
    public static function checkAdmin()
    {
        // Перевіряємо HTTP Basic Auth
        if (!isset($_SERVER['PHP_AUTH_USER']) || !isset($_SERVER['PHP_AUTH_PW'])) {
            self::requireAuth();
            return false;
        }

        $username = $_SERVER['PHP_AUTH_USER'];
        $password = $_SERVER['PHP_AUTH_PW'];

        if ($username === self::$admin_username && $password === self::$admin_password) {
            return true;
        }

        self::requireAuth();
        return false;
    }

    /**
     * Вимагати авторизацію
     */
    private static function requireAuth()
    {
        header('WWW-Authenticate: Basic realm="Restaurant Admin"');
        header('HTTP/1.0 401 Unauthorized');
        echo json_encode([
            'error' => 'Unauthorized',
            'message' => 'Потрібна авторизація адміністратора'
        ]);
        exit;
    }

    /**
     * Перевірити, чи метод потребує авторизації
     */
    public static function requiresAuth($method, $endpoint)
    {
        // Методи, що потребують авторизації
        $protectedMethods = ['POST', 'PUT', 'DELETE'];

        // Публічні ендпоінти (не потребують авторизації)
        $publicEndpoints = [
            'GET /menu',
            'GET /menu/available',
            'GET /menu/category',
            'GET /feedback/published',
            'GET /feedback/stats',
            'GET /tables/available',
            'POST /feedback',
            'POST /reservations'
        ];

        // Формуємо строку для перевірки
        $requestString = $method . ' ' . $endpoint;

        // Перевіряємо публічні ендпоінти
        foreach ($publicEndpoints as $public) {
            if (strpos($requestString, $public) === 0) {
                return false;
            }
        }

        // Якщо метод захищений, потрібна авторизація
        return in_array($method, $protectedMethods);
    }
}