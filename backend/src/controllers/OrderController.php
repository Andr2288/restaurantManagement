<?php
// src/controllers/OrderController.php

namespace Restaurant\controllers;

use Restaurant\models\Order;
use Restaurant\models\OrderDetail;

class OrderController extends BaseController
{
    private $order;
    private $orderDetail;

    public function __construct($db, $requestMethod, $resourceId = null)
    {
        parent::__construct($db, $requestMethod, $resourceId);
        $this->order = new Order($db);
        $this->orderDetail = new OrderDetail($db);
    }

    protected function handleGet()
    {
        // Перевіряємо спеціальні ендпоінти
        $uri = $_SERVER['REQUEST_URI'];

        if (strpos($uri, '/active') !== false) {
            return $this->getActiveOrders();
        }

        if (strpos($uri, '/date/') !== false) {
            $date = $this->getDateFromUri($uri);
            return $this->getOrdersByDate($date);
        }

        if ($this->resourceId) {
            return $this->getOrder();
        } else {
            return $this->getAllOrders();
        }
    }

    protected function handlePost()
    {
        return $this->createOrder();
    }

    protected function handlePut()
    {
        if (!$this->resourceId) {
            return $this->errorResponse('ID замовлення не вказано');
        }

        // Перевіряємо, чи це запит на зміну статусу
        $uri = $_SERVER['REQUEST_URI'];
        if (strpos($uri, '/status') !== false) {
            return $this->updateOrderStatus();
        }

        return $this->updateOrder();
    }

    protected function handleDelete()
    {
        if (!$this->resourceId) {
            return $this->errorResponse('ID замовлення не вказано');
        }
        return $this->deleteOrder();
    }

    /**
     * Отримати всі замовлення
     */
    private function getAllOrders()
    {
        try {
            $stmt = $this->order->getAll();
            $orders = $this->resultToArray($stmt);

            return $this->successResponse($orders);
        } catch (\Exception $e) {
            return $this->errorResponse('Помилка отримання замовлень: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Отримати активні замовлення
     */
    private function getActiveOrders()
    {
        try {
            $stmt = $this->order->getActive();
            $orders = $this->resultToArray($stmt);

            return $this->successResponse($orders);
        } catch (\Exception $e) {
            return $this->errorResponse('Помилка отримання активних замовлень: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Отримати замовлення за датою
     */
    private function getOrdersByDate($date)
    {
        try {
            if (!$this->isValidDate($date)) {
                return $this->errorResponse('Невірний формат дати. Використовуйте YYYY-MM-DD');
            }

            $stmt = $this->order->getByDate($date);
            $orders = $this->resultToArray($stmt);

            return $this->successResponse($orders);
        } catch (\Exception $e) {
            return $this->errorResponse('Помилка отримання замовлень за датою: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Отримати одне замовлення з деталями
     */
    private function getOrder()
    {
        try {
            $this->order->id = $this->resourceId;

            $orderData = $this->order->getOneWithDetails();
            if (!$orderData) {
                return $this->errorResponse('Замовлення не знайдено', 404);
            }

            return $this->successResponse($orderData);
        } catch (\Exception $e) {
            return $this->errorResponse('Помилка отримання замовлення: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Створити замовлення
     */
    private function createOrder()
    {
        try {
            $data = $this->getRequestBody();

            // Валідація обов'язкових полів
            $required = ['table_id', 'employee_id'];
            $error = $this->validateRequired($data, $required);
            if ($error) {
                return $this->errorResponse($error);
            }

            // Валідація числових полів
            if (!is_numeric($data['table_id']) || $data['table_id'] <= 0) {
                return $this->errorResponse('ID столика має бути позитивним числом');
            }

            if (!is_numeric($data['employee_id']) || $data['employee_id'] <= 0) {
                return $this->errorResponse('ID співробітника має бути позитивним числом');
            }

            // Заповнення даних замовлення
            $this->order->table_id = $data['table_id'];
            $this->order->employee_id = $data['employee_id'];
            $this->order->order_date = $data['order_date'] ?? date('Y-m-d');
            $this->order->order_time = $data['order_time'] ?? date('H:i:s');
            $this->order->total_amount = 0; // Буде розраховано автоматично
            $this->order->status = $data['status'] ?? 'Нове';

            if ($this->order->create()) {
                // Додаємо деталі замовлення, якщо вони є
                if (isset($data['items']) && is_array($data['items'])) {
                    $this->orderDetail->addMultiple($this->order->id, $data['items']);
                }

                // Отримуємо створене замовлення з деталями
                $orderData = $this->order->getOneWithDetails();

                return $this->createdResponse($orderData, 'Замовлення створено');
            } else {
                return $this->errorResponse('Не вдалося створити замовлення', 500);
            }
        } catch (\Exception $e) {
            return $this->errorResponse('Помилка створення замовлення: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Оновити замовлення
     */
    private function updateOrder()
    {
        try {
            // Перевіряємо, чи існує замовлення
            $this->order->id = $this->resourceId;
            if (!$this->order->getOne()) {
                return $this->errorResponse('Замовлення не знайдено', 404);
            }

            $data = $this->getRequestBody();

            // Валідація числових полів
            if (isset($data['table_id'])) {
                if (!is_numeric($data['table_id']) || $data['table_id'] <= 0) {
                    return $this->errorResponse('ID столика має бути позитивним числом');
                }
            }

            if (isset($data['employee_id'])) {
                if (!is_numeric($data['employee_id']) || $data['employee_id'] <= 0) {
                    return $this->errorResponse('ID співробітника має бути позитивним числом');
                }
            }

            // Валідація статусу
            $allowedStatuses = ['Нове', 'Готується', 'Готове', 'Подано', 'Оплачено', 'Скасовано'];
            if (isset($data['status']) && !in_array($data['status'], $allowedStatuses)) {
                return $this->errorResponse('Невірний статус. Доступні: ' . implode(', ', $allowedStatuses));
            }

            // Валідація методу оплати
            $allowedPaymentMethods = ['Готівка', 'Картка', 'Безконтактно'];
            if (isset($data['payment_method']) && !in_array($data['payment_method'], $allowedPaymentMethods)) {
                return $this->errorResponse('Невірний метод оплати. Доступні: ' . implode(', ', $allowedPaymentMethods));
            }

            // Оновлення даних
            $this->order->table_id = $data['table_id'] ?? $this->order->table_id;
            $this->order->employee_id = $data['employee_id'] ?? $this->order->employee_id;
            $this->order->order_date = $data['order_date'] ?? $this->order->order_date;
            $this->order->order_time = $data['order_time'] ?? $this->order->order_time;
            $this->order->total_amount = $data['total_amount'] ?? $this->order->total_amount;
            $this->order->status = $data['status'] ?? $this->order->status;
            $this->order->payment_method = $data['payment_method'] ?? $this->order->payment_method;

            if ($this->order->update()) {
                return $this->successResponse(null, 'Замовлення оновлено');
            } else {
                return $this->errorResponse('Не вдалося оновити замовлення', 500);
            }
        } catch (\Exception $e) {
            return $this->errorResponse('Помилка оновлення замовлення: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Оновити статус замовлення
     */
    private function updateOrderStatus()
    {
        try {
            $this->order->id = $this->resourceId;

            // Перевіряємо, чи існує замовлення
            if (!$this->order->getOne()) {
                return $this->errorResponse('Замовлення не знайдено', 404);
            }

            $data = $this->getRequestBody();

            if (!isset($data['status'])) {
                return $this->errorResponse('Статус не вказано');
            }

            // Валідація статусу
            $allowedStatuses = ['Нове', 'Готується', 'Готове', 'Подано', 'Оплачено', 'Скасовано'];
            if (!in_array($data['status'], $allowedStatuses)) {
                return $this->errorResponse('Невірний статус. Доступні: ' . implode(', ', $allowedStatuses));
            }

            if ($this->order->updateStatus($data['status'])) {
                return $this->successResponse(null, 'Статус замовлення оновлено');
            } else {
                return $this->errorResponse('Не вдалося оновити статус замовлення', 500);
            }
        } catch (\Exception $e) {
            return $this->errorResponse('Помилка оновлення статусу: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Видалити замовлення
     */
    private function deleteOrder()
    {
        try {
            $this->order->id = $this->resourceId;

            // Перевіряємо, чи існує замовлення
            if (!$this->order->getOne()) {
                return $this->errorResponse('Замовлення не знайдено', 404);
            }

            if ($this->order->delete()) {
                return $this->successResponse(null, 'Замовлення видалено');
            } else {
                return $this->errorResponse('Не вдалося видалити замовлення', 500);
            }
        } catch (\Exception $e) {
            return $this->errorResponse('Помилка видалення замовлення: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Отримати дату з URI
     */
    private function getDateFromUri($uri)
    {
        $parts = explode('/date/', $uri);
        if (count($parts) > 1) {
            $date = explode('?', $parts[1])[0]; // Прибираємо query parameters
            return $date;
        }
        return '';
    }

    /**
     * Перевірити валідність дати
     */
    private function isValidDate($date)
    {
        $d = \DateTime::createFromFormat('Y-m-d', $date);
        return $d && $d->format('Y-m-d') === $date;
    }
}