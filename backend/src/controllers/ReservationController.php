<?php
// src/controllers/ReservationController.php

namespace Restaurant\controllers;

use Restaurant\models\Reservation;

class ReservationController extends BaseController
{
    private $reservation;

    public function __construct($db, $requestMethod, $resourceId = null)
    {
        parent::__construct($db, $requestMethod, $resourceId);
        $this->reservation = new Reservation($db);
    }

    protected function handleGet()
    {
        // Перевіряємо спеціальні ендпоінти
        $uri = $_SERVER['REQUEST_URI'];

        if (strpos($uri, '/upcoming') !== false) {
            return $this->getUpcomingReservations();
        }

        if (strpos($uri, '/date/') !== false) {
            $date = $this->getDateFromUri($uri);
            return $this->getReservationsByDate($date);
        }

        if ($this->resourceId) {
            return $this->getReservation();
        } else {
            return $this->getAllReservations();
        }
    }

    protected function handlePost()
    {
        return $this->createReservation();
    }

    protected function handlePut()
    {
        if (!$this->resourceId) {
            return $this->errorResponse('ID резервації не вказано');
        }
        return $this->updateReservation();
    }

    protected function handleDelete()
    {
        if (!$this->resourceId) {
            return $this->errorResponse('ID резервації не вказано');
        }
        return $this->deleteReservation();
    }

    /**
     * Отримати всі резервації
     */
    private function getAllReservations()
    {
        try {
            $stmt = $this->reservation->getAll();
            $reservations = $this->resultToArray($stmt);

            return $this->successResponse($reservations);
        } catch (\Exception $e) {
            return $this->errorResponse('Помилка отримання резервацій: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Отримати майбутні резервації
     */
    private function getUpcomingReservations()
    {
        try {
            $stmt = $this->reservation->getUpcoming();
            $reservations = $this->resultToArray($stmt);

            return $this->successResponse($reservations);
        } catch (\Exception $e) {
            return $this->errorResponse('Помилка отримання майбутніх резервацій: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Отримати резервації за датою
     */
    private function getReservationsByDate($date)
    {
        try {
            if (!$this->isValidDate($date)) {
                return $this->errorResponse('Невірний формат дати. Використовуйте YYYY-MM-DD');
            }

            $stmt = $this->reservation->getByDate($date);
            $reservations = $this->resultToArray($stmt);

            return $this->successResponse($reservations);
        } catch (\Exception $e) {
            return $this->errorResponse('Помилка отримання резервацій за датою: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Отримати одну резервацію
     */
    private function getReservation()
    {
        try {
            $this->reservation->id = $this->resourceId;

            if (!$this->reservation->getOne()) {
                return $this->errorResponse('Резервацію не знайдено', 404);
            }

            $reservationData = [
                'id' => $this->reservation->id,
                'customer_name' => $this->reservation->customer_name,
                'customer_phone' => $this->reservation->customer_phone,
                'reservation_date' => $this->reservation->reservation_date,
                'reservation_time' => $this->reservation->reservation_time,
                'table_id' => $this->reservation->table_id,
                'number_of_guests' => $this->reservation->number_of_guests,
                'notes' => $this->reservation->notes,
                'status' => $this->reservation->status,
                'created_at' => $this->reservation->created_at
            ];

            return $this->successResponse($reservationData);
        } catch (\Exception $e) {
            return $this->errorResponse('Помилка отримання резервації: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Створити резервацію
     */
    private function createReservation()
    {
        try {
            $data = $this->getRequestBody();

            // Валідація обов'язкових полів
            $required = ['customer_name', 'reservation_date', 'reservation_time', 'table_id', 'number_of_guests'];
            $error = $this->validateRequired($data, $required);
            if ($error) {
                return $this->errorResponse($error);
            }

            // Валідація дати
            if (!$this->isValidDate($data['reservation_date'])) {
                return $this->errorResponse('Невірний формат дати резервації. Використовуйте YYYY-MM-DD');
            }

            // Валідація часу
            if (!$this->isValidTime($data['reservation_time'])) {
                return $this->errorResponse('Невірний формат часу резервації. Використовуйте HH:MM або HH:MM:SS');
            }

            // Валідація числових полів
            if (!is_numeric($data['table_id']) || $data['table_id'] <= 0) {
                return $this->errorResponse('ID столика має бути позитивним числом');
            }

            if (!is_numeric($data['number_of_guests']) || $data['number_of_guests'] <= 0) {
                return $this->errorResponse('Кількість гостей має бути позитивним числом');
            }

            // Перевірка, що дата не в минулому
            if ($data['reservation_date'] < date('Y-m-d')) {
                return $this->errorResponse('Не можна створити резервацію на минулу дату');
            }

            // Перевірка доступності столика
            if (!$this->reservation->checkTableAvailability($data['table_id'], $data['reservation_date'], $data['reservation_time'])) {
                return $this->errorResponse('Столик недоступний на вказаний час');
            }

            // Валідація статусу
            $allowedStatuses = ['Підтверджено', 'Прибули', 'Не з\'явились', 'Скасовано'];
            if (isset($data['status']) && !in_array($data['status'], $allowedStatuses)) {
                return $this->errorResponse('Невірний статус. Доступні: ' . implode(', ', $allowedStatuses));
            }

            // Заповнення даних
            $this->reservation->customer_name = $data['customer_name'];
            $this->reservation->customer_phone = $data['customer_phone'] ?? null;
            $this->reservation->reservation_date = $data['reservation_date'];
            $this->reservation->reservation_time = $data['reservation_time'];
            $this->reservation->table_id = $data['table_id'];
            $this->reservation->number_of_guests = $data['number_of_guests'];
            $this->reservation->notes = $data['notes'] ?? '';
            $this->reservation->status = $data['status'] ?? 'Підтверджено';

            if ($this->reservation->create()) {
                $reservationData = [
                    'id' => $this->reservation->id,
                    'customer_name' => $this->reservation->customer_name,
                    'customer_phone' => $this->reservation->customer_phone,
                    'reservation_date' => $this->reservation->reservation_date,
                    'reservation_time' => $this->reservation->reservation_time,
                    'table_id' => $this->reservation->table_id,
                    'number_of_guests' => $this->reservation->number_of_guests,
                    'notes' => $this->reservation->notes,
                    'status' => $this->reservation->status
                ];

                return $this->createdResponse($reservationData, 'Резервацію створено');
            } else {
                return $this->errorResponse('Не вдалося створити резервацію', 500);
            }
        } catch (\Exception $e) {
            return $this->errorResponse('Помилка створення резервації: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Оновити резервацію
     */
    private function updateReservation()
    {
        try {
            // Перевіряємо, чи існує резервація
            $this->reservation->id = $this->resourceId;
            if (!$this->reservation->getOne()) {
                return $this->errorResponse('Резервацію не знайдено', 404);
            }

            $data = $this->getRequestBody();

            // Валідація дати
            if (isset($data['reservation_date'])) {
                if (!$this->isValidDate($data['reservation_date'])) {
                    return $this->errorResponse('Невірний формат дати резервації. Використовуйте YYYY-MM-DD');
                }
            }

            // Валідація часу
            if (isset($data['reservation_time'])) {
                if (!$this->isValidTime($data['reservation_time'])) {
                    return $this->errorResponse('Невірний формат часу резервації. Використовуйте HH:MM або HH:MM:SS');
                }
            }

            // Валідація числових полів
            if (isset($data['table_id'])) {
                if (!is_numeric($data['table_id']) || $data['table_id'] <= 0) {
                    return $this->errorResponse('ID столика має бути позитивним числом');
                }
            }

            if (isset($data['number_of_guests'])) {
                if (!is_numeric($data['number_of_guests']) || $data['number_of_guests'] <= 0) {
                    return $this->errorResponse('Кількість гостей має бути позитивним числом');
                }
            }

            // Валідація статусу
            if (isset($data['status'])) {
                $allowedStatuses = ['Підтверджено', 'Прибули', 'Не з\'явились', 'Скасовано'];
                if (!in_array($data['status'], $allowedStatuses)) {
                    return $this->errorResponse('Невірний статус. Доступні: ' . implode(', ', $allowedStatuses));
                }
            }

            // Перевірка доступності столика (якщо змінюють дату, час або столик)
            $checkTable = isset($data['table_id']) || isset($data['reservation_date']) || isset($data['reservation_time']);
            if ($checkTable) {
                $tableId = $data['table_id'] ?? $this->reservation->table_id;
                $date = $data['reservation_date'] ?? $this->reservation->reservation_date;
                $time = $data['reservation_time'] ?? $this->reservation->reservation_time;

                if (!$this->reservation->checkTableAvailability($tableId, $date, $time, $this->reservation->id)) {
                    return $this->errorResponse('Столик недоступний на вказаний час');
                }
            }

            // Оновлення даних
            $this->reservation->customer_name = $data['customer_name'] ?? $this->reservation->customer_name;
            $this->reservation->customer_phone = $data['customer_phone'] ?? $this->reservation->customer_phone;
            $this->reservation->reservation_date = $data['reservation_date'] ?? $this->reservation->reservation_date;
            $this->reservation->reservation_time = $data['reservation_time'] ?? $this->reservation->reservation_time;
            $this->reservation->table_id = $data['table_id'] ?? $this->reservation->table_id;
            $this->reservation->number_of_guests = $data['number_of_guests'] ?? $this->reservation->number_of_guests;
            $this->reservation->notes = $data['notes'] ?? $this->reservation->notes;
            $this->reservation->status = $data['status'] ?? $this->reservation->status;

            if ($this->reservation->update()) {
                return $this->successResponse(null, 'Резервацію оновлено');
            } else {
                return $this->errorResponse('Не вдалося оновити резервацію', 500);
            }
        } catch (\Exception $e) {
            return $this->errorResponse('Помилка оновлення резервації: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Видалити резервацію
     */
    private function deleteReservation()
    {
        try {
            $this->reservation->id = $this->resourceId;

            // Перевіряємо, чи існує резервація
            if (!$this->reservation->getOne()) {
                return $this->errorResponse('Резервацію не знайдено', 404);
            }

            if ($this->reservation->delete()) {
                return $this->successResponse(null, 'Резервацію видалено');
            } else {
                return $this->errorResponse('Не вдалося видалити резервацію', 500);
            }
        } catch (\Exception $e) {
            return $this->errorResponse('Помилка видалення резервації: ' . $e->getMessage(), 500);
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

    /**
     * Перевірити валідність часу
     */
    private function isValidTime($time)
    {
        // Перевіряємо формат HH:MM або HH:MM:SS
        $patterns = ['H:i', 'H:i:s'];
        foreach ($patterns as $pattern) {
            $t = \DateTime::createFromFormat($pattern, $time);
            if ($t && $t->format($pattern) === $time) {
                return true;
            }
        }
        return false;
    }
}