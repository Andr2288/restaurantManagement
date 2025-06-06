<?php
// src/controllers/BaseController.php

namespace Restaurant\controllers;

use Restaurant\middleware\Auth;

class BaseController
{
    protected $db;
    protected $requestMethod;
    protected $resourceId;

    public function __construct($db, $requestMethod, $resourceId = null)
    {
        $this->db = $db;
        $this->requestMethod = $requestMethod;
        $this->resourceId = $resourceId;
    }

    /**
     * Обробити запит
     */
    public function processRequest($endpoint = '')
    {
        // Перевіряємо авторизацію, якщо потрібно
        if (Auth::requiresAuth($this->requestMethod, $endpoint)) {
            if (!Auth::checkAdmin()) {
                return;
            }
        }

        switch ($this->requestMethod) {
            case 'GET':
                $response = $this->handleGet();
                break;
            case 'POST':
                $response = $this->handlePost();
                break;
            case 'PUT':
                $response = $this->handlePut();
                break;
            case 'DELETE':
                $response = $this->handleDelete();
                break;
            default:
                $response = $this->notFoundResponse();
                break;
        }

        header($response['status_code_header']);
        if ($response['body']) {
            echo $response['body'];
        }
    }

    /**
     * Обробка GET запитів
     */
    protected function handleGet()
    {
        return $this->notFoundResponse();
    }

    /**
     * Обробка POST запитів
     */
    protected function handlePost()
    {
        return $this->notFoundResponse();
    }

    /**
     * Обробка PUT запитів
     */
    protected function handlePut()
    {
        return $this->notFoundResponse();
    }

    /**
     * Обробка DELETE запитів
     */
    protected function handleDelete()
    {
        return $this->notFoundResponse();
    }

    /**
     * Отримати дані з тіла запиту
     */
    protected function getRequestBody()
    {
        $input = file_get_contents('php://input');
        return json_decode($input, true);
    }

    /**
     * Валідація обов'язкових полів
     */
    protected function validateRequired($data, $required)
    {
        foreach ($required as $field) {
            if (!isset($data[$field]) || empty($data[$field])) {
                return "Поле '{$field}' є обов'язковим";
            }
        }
        return null;
    }

    /**
     * Успішна відповідь
     */
    protected function successResponse($data = null, $message = null)
    {
        $response = ['success' => true];

        if ($message) {
            $response['message'] = $message;
        }

        if ($data !== null) {
            $response['data'] = $data;
        }

        return [
            'status_code_header' => 'HTTP/1.1 200 OK',
            'body' => json_encode($response)
        ];
    }

    /**
     * Відповідь про створення
     */
    protected function createdResponse($data = null, $message = 'Запис створено')
    {
        $response = ['success' => true, 'message' => $message];

        if ($data !== null) {
            $response['data'] = $data;
        }

        return [
            'status_code_header' => 'HTTP/1.1 201 Created',
            'body' => json_encode($response)
        ];
    }

    /**
     * Відповідь про помилку
     */
    protected function errorResponse($message, $code = 400)
    {
        $statusText = $this->getStatusText($code);

        return [
            'status_code_header' => "HTTP/1.1 {$code} {$statusText}",
            'body' => json_encode([
                'success' => false,
                'error' => $message
            ])
        ];
    }

    /**
     * Відповідь "не знайдено"
     */
    protected function notFoundResponse()
    {
        return [
            'status_code_header' => 'HTTP/1.1 404 Not Found',
            'body' => json_encode([
                'success' => false,
                'error' => 'Ендпоінт не знайдено'
            ])
        ];
    }

    /**
     * Отримати текст статусу
     */
    private function getStatusText($code)
    {
        $codes = [
            200 => 'OK',
            201 => 'Created',
            400 => 'Bad Request',
            401 => 'Unauthorized',
            404 => 'Not Found',
            500 => 'Internal Server Error'
        ];

        return isset($codes[$code]) ? $codes[$code] : 'Unknown';
    }

    /**
     * Конвертувати результат запиту в масив
     */
    protected function resultToArray($stmt)
    {
        $results = [];
        while ($row = $stmt->fetch()) {
            $results[] = $row;
        }
        return $results;
    }
}