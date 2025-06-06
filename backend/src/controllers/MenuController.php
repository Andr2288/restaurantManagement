<?php
// src/controllers/MenuController.php

namespace Restaurant\controllers;

use Restaurant\models\MenuItem;

class MenuController extends BaseController
{
    private $menuItem;

    public function __construct($db, $requestMethod, $resourceId = null)
    {
        parent::__construct($db, $requestMethod, $resourceId);
        $this->menuItem = new MenuItem($db);
    }

    protected function handleGet()
    {
        // Перевіряємо спеціальні ендпоінти
        $uri = $_SERVER['REQUEST_URI'];

        if (strpos($uri, '/available') !== false) {
            return $this->getAvailableItems();
        }

        if (strpos($uri, '/category/') !== false) {
            $category = $this->getCategoryFromUri($uri);
            return $this->getItemsByCategory($category);
        }

        if ($this->resourceId) {
            return $this->getMenuItem();
        } else {
            return $this->getAllMenuItems();
        }
    }

    protected function handlePost()
    {
        return $this->createMenuItem();
    }

    protected function handlePut()
    {
        if (!$this->resourceId) {
            return $this->errorResponse('ID страви не вказано');
        }
        return $this->updateMenuItem();
    }

    protected function handleDelete()
    {
        if (!$this->resourceId) {
            return $this->errorResponse('ID страви не вказано');
        }
        return $this->deleteMenuItem();
    }

    /**
     * Отримати всі страви меню
     */
    private function getAllMenuItems()
    {
        try {
            $stmt = $this->menuItem->getAll();
            $items = $this->resultToArray($stmt);

            // Групуємо по категоріях для зручності
            $grouped = [];
            foreach ($items as $item) {
                $grouped[$item['category']][] = $item;
            }

            return $this->successResponse([
                'items' => $items,
                'grouped' => $grouped
            ]);
        } catch (\Exception $e) {
            return $this->errorResponse('Помилка отримання меню: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Отримати доступні страви
     */
    private function getAvailableItems()
    {
        try {
            $stmt = $this->menuItem->getAvailable();
            $items = $this->resultToArray($stmt);

            return $this->successResponse($items);
        } catch (\Exception $e) {
            return $this->errorResponse('Помилка отримання доступних страв: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Отримати страви за категорією
     */
    private function getItemsByCategory($category)
    {
        try {
            $stmt = $this->menuItem->getByCategory($category);
            $items = $this->resultToArray($stmt);

            return $this->successResponse($items);
        } catch (\Exception $e) {
            return $this->errorResponse('Помилка отримання страв за категорією: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Отримати одну страву
     */
    private function getMenuItem()
    {
        try {
            $this->menuItem->id = $this->resourceId;

            if (!$this->menuItem->getOne()) {
                return $this->errorResponse('Страву не знайдено', 404);
            }

            $itemData = [
                'id' => $this->menuItem->id,
                'name' => $this->menuItem->name,
                'category' => $this->menuItem->category,
                'description' => $this->menuItem->description,
                'price' => $this->menuItem->price,
                'cooking_time' => $this->menuItem->cooking_time,
                'is_available' => $this->menuItem->is_available,
                'created_at' => $this->menuItem->created_at
            ];

            return $this->successResponse($itemData);
        } catch (\Exception $e) {
            return $this->errorResponse('Помилка отримання страви: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Створити страву
     */
    private function createMenuItem()
    {
        try {
            $data = $this->getRequestBody();

            // Валідація обов'язкових полів
            $required = ['name', 'category', 'price'];
            $error = $this->validateRequired($data, $required);
            if ($error) {
                return $this->errorResponse($error);
            }

            // Валідація ціни
            if (!is_numeric($data['price']) || $data['price'] <= 0) {
                return $this->errorResponse('Ціна має бути позитивним числом');
            }

            // Валідація часу готування
            if (isset($data['cooking_time']) && (!is_numeric($data['cooking_time']) || $data['cooking_time'] < 0)) {
                return $this->errorResponse('Час готування має бути числом не менше 0');
            }

            // Заповнення даних
            $this->menuItem->name = $data['name'];
            $this->menuItem->category = $data['category'];
            $this->menuItem->description = $data['description'] ?? '';
            $this->menuItem->price = $data['price'];
            $this->menuItem->cooking_time = $data['cooking_time'] ?? 0;
            $this->menuItem->is_available = $data['is_available'] ?? true;

            if ($this->menuItem->create()) {
                $itemData = [
                    'id' => $this->menuItem->id,
                    'name' => $this->menuItem->name,
                    'category' => $this->menuItem->category,
                    'description' => $this->menuItem->description,
                    'price' => $this->menuItem->price,
                    'cooking_time' => $this->menuItem->cooking_time,
                    'is_available' => $this->menuItem->is_available
                ];

                return $this->createdResponse($itemData, 'Страву створено');
            } else {
                return $this->errorResponse('Не вдалося створити страву', 500);
            }
        } catch (\Exception $e) {
            return $this->errorResponse('Помилка створення страви: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Оновити страву
     */
    private function updateMenuItem()
    {
        try {
            // Перевіряємо, чи існує страва
            $this->menuItem->id = $this->resourceId;
            if (!$this->menuItem->getOne()) {
                return $this->errorResponse('Страву не знайдено', 404);
            }

            $data = $this->getRequestBody();

            // Валідація ціни
            if (isset($data['price'])) {
                if (!is_numeric($data['price']) || $data['price'] <= 0) {
                    return $this->errorResponse('Ціна має бути позитивним числом');
                }
            }

            // Валідація часу готування
            if (isset($data['cooking_time'])) {
                if (!is_numeric($data['cooking_time']) || $data['cooking_time'] < 0) {
                    return $this->errorResponse('Час готування має бути числом не менше 0');
                }
            }

            // Оновлення даних
            $this->menuItem->name = $data['name'] ?? $this->menuItem->name;
            $this->menuItem->category = $data['category'] ?? $this->menuItem->category;
            $this->menuItem->description = $data['description'] ?? $this->menuItem->description;
            $this->menuItem->price = $data['price'] ?? $this->menuItem->price;
            $this->menuItem->cooking_time = $data['cooking_time'] ?? $this->menuItem->cooking_time;
            $this->menuItem->is_available = isset($data['is_available']) ? $data['is_available'] : $this->menuItem->is_available;

            if ($this->menuItem->update()) {
                return $this->successResponse(null, 'Страву оновлено');
            } else {
                return $this->errorResponse('Не вдалося оновити страву', 500);
            }
        } catch (\Exception $e) {
            return $this->errorResponse('Помилка оновлення страви: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Видалити страву
     */
    private function deleteMenuItem()
    {
        try {
            $this->menuItem->id = $this->resourceId;

            // Перевіряємо, чи існує страва
            if (!$this->menuItem->getOne()) {
                return $this->errorResponse('Страву не знайдено', 404);
            }

            if ($this->menuItem->delete()) {
                return $this->successResponse(null, 'Страву видалено');
            } else {
                return $this->errorResponse('Не вдалося видалити страву', 500);
            }
        } catch (\Exception $e) {
            return $this->errorResponse('Помилка видалення страви: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Отримати категорію з URI
     */
    private function getCategoryFromUri($uri)
    {
        $parts = explode('/category/', $uri);
        if (count($parts) > 1) {
            $category = explode('?', $parts[1])[0]; // Прибираємо query parameters
            return urldecode($category);
        }
        return '';
    }
}