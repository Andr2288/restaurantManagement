<?php
// src/controllers/TableController.php

namespace Restaurant\controllers;

use Restaurant\models\Table;

class TableController extends BaseController
{
    private $table;

    public function __construct($db, $requestMethod, $resourceId = null)
    {
        parent::__construct($db, $requestMethod, $resourceId);
        $this->table = new Table($db);
    }

    protected function handleGet()
    {
        // Перевіряємо спеціальні ендпоінти
        $uri = $_SERVER['REQUEST_URI'];

        if (strpos($uri, '/available') !== false) {
            return $this->getAvailableTables();
        }

        if ($this->resourceId) {
            return $this->getTable();
        } else {
            return $this->getAllTables();
        }
    }

    protected function handlePost()
    {
        return $this->createTable();
    }

    protected function handlePut()
    {
        if (!$this->resourceId) {
            return $this->errorResponse('ID столика не вказано');
        }
        return $this->updateTable();
    }

    protected function handleDelete()
    {
        if (!$this->resourceId) {
            return $this->errorResponse('ID столика не вказано');
        }
        return $this->deleteTable();
    }

    /**
     * Отримати всі столики
     */
    private function getAllTables()
    {
        try {
            $stmt = $this->table->getAll();
            $tables = $this->resultToArray($stmt);

            return $this->successResponse($tables);
        } catch (\Exception $e) {
            return $this->errorResponse('Помилка отримання столиків: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Отримати доступні столики
     */
    private function getAvailableTables()
    {
        try {
            $stmt = $this->table->getAvailable();
            $tables = $this->resultToArray($stmt);

            return $this->successResponse($tables);
        } catch (\Exception $e) {
            return $this->errorResponse('Помилка отримання доступних столиків: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Отримати один столик
     */
    private function getTable()
    {
        try {
            $this->table->id = $this->resourceId;

            if (!$this->table->getOne()) {
                return $this->errorResponse('Столик не знайдено', 404);
            }

            $tableData = [
                'id' => $this->table->id,
                'table_number' => $this->table->table_number,
                'capacity' => $this->table->capacity,
                'location' => $this->table->location,
                'is_available' => $this->table->is_available,
                'created_at' => $this->table->created_at
            ];

            return $this->successResponse($tableData);
        } catch (\Exception $e) {
            return $this->errorResponse('Помилка отримання столика: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Створити столик
     */
    private function createTable()
    {
        try {
            $data = $this->getRequestBody();

            // Валідація обов'язкових полів
            $required = ['table_number', 'capacity'];
            $error = $this->validateRequired($data, $required);
            if ($error) {
                return $this->errorResponse($error);
            }

            // Валідація даних
            if (!is_numeric($data['table_number']) || $data['table_number'] <= 0) {
                return $this->errorResponse('Номер столика має бути позитивним числом');
            }

            if (!is_numeric($data['capacity']) || $data['capacity'] <= 0) {
                return $this->errorResponse('Місткість має бути позитивним числом');
            }

            // Заповнення даних
            $this->table->table_number = $data['table_number'];
            $this->table->capacity = $data['capacity'];
            $this->table->location = $data['location'] ?? '';
            $this->table->is_available = $data['is_available'] ?? true;

            if ($this->table->create()) {
                $tableData = [
                    'id' => $this->table->id,
                    'table_number' => $this->table->table_number,
                    'capacity' => $this->table->capacity,
                    'location' => $this->table->location,
                    'is_available' => $this->table->is_available
                ];

                return $this->createdResponse($tableData, 'Столик створено');
            } else {
                return $this->errorResponse('Не вдалося створити столик', 500);
            }
        } catch (\Exception $e) {
            return $this->errorResponse('Помилка створення столика: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Оновити столик
     */
    private function updateTable()
    {
        try {
            // Перевіряємо, чи існує столик
            $this->table->id = $this->resourceId;
            if (!$this->table->getOne()) {
                return $this->errorResponse('Столик не знайдено', 404);
            }

            $data = $this->getRequestBody();

            // Валідація даних
            if (isset($data['table_number'])) {
                if (!is_numeric($data['table_number']) || $data['table_number'] <= 0) {
                    return $this->errorResponse('Номер столика має бути позитивним числом');
                }
            }

            if (isset($data['capacity'])) {
                if (!is_numeric($data['capacity']) || $data['capacity'] <= 0) {
                    return $this->errorResponse('Місткість має бути позитивним числом');
                }
            }

            // Оновлення даних
            $this->table->table_number = $data['table_number'] ?? $this->table->table_number;
            $this->table->capacity = $data['capacity'] ?? $this->table->capacity;
            $this->table->location = $data['location'] ?? $this->table->location;
            $this->table->is_available = isset($data['is_available']) ? $data['is_available'] : $this->table->is_available;

            if ($this->table->update()) {
                return $this->successResponse(null, 'Столик оновлено');
            } else {
                return $this->errorResponse('Не вдалося оновити столик', 500);
            }
        } catch (\Exception $e) {
            return $this->errorResponse('Помилка оновлення столика: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Видалити столик
     */
    private function deleteTable()
    {
        try {
            $this->table->id = $this->resourceId;

            // Перевіряємо, чи існує столик
            if (!$this->table->getOne()) {
                return $this->errorResponse('Столик не знайдено', 404);
            }

            if ($this->table->delete()) {
                return $this->successResponse(null, 'Столик видалено');
            } else {
                return $this->errorResponse('Не вдалося видалити столик', 500);
            }
        } catch (\Exception $e) {
            return $this->errorResponse('Помилка видалення столика: ' . $e->getMessage(), 500);
        }
    }
}