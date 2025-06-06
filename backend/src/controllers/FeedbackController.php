<?php
// src/controllers/FeedbackController.php

namespace Restaurant\controllers;

use Restaurant\models\Feedback;

class FeedbackController extends BaseController
{
    private $feedback;

    public function __construct($db, $requestMethod, $resourceId = null)
    {
        parent::__construct($db, $requestMethod, $resourceId);
        $this->feedback = new Feedback($db);
    }

    protected function handleGet()
    {
        // Перевіряємо спеціальні ендпоінти
        $uri = $_SERVER['REQUEST_URI'];

        if (strpos($uri, '/published') !== false) {
            return $this->getPublishedFeedback();
        }

        if (strpos($uri, '/stats') !== false) {
            return $this->getFeedbackStats();
        }

        if ($this->resourceId) {
            return $this->getFeedback();
        } else {
            return $this->getAllFeedback();
        }
    }

    protected function handlePost()
    {
        return $this->createFeedback();
    }

    protected function handlePut()
    {
        if (!$this->resourceId) {
            return $this->errorResponse('ID відгуку не вказано');
        }

        // Перевіряємо, чи це запит на зміну статусу публікації
        $uri = $_SERVER['REQUEST_URI'];
        if (strpos($uri, '/toggle') !== false) {
            return $this->togglePublished();
        }

        return $this->updateFeedback();
    }

    protected function handleDelete()
    {
        if (!$this->resourceId) {
            return $this->errorResponse('ID відгуку не вказано');
        }
        return $this->deleteFeedback();
    }

    /**
     * Отримати всі відгуки
     */
    private function getAllFeedback()
    {
        try {
            $stmt = $this->feedback->getAll();
            $feedbacks = $this->resultToArray($stmt);

            return $this->successResponse($feedbacks);
        } catch (\Exception $e) {
            return $this->errorResponse('Помилка отримання відгуків: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Отримати опубліковані відгуки
     */
    private function getPublishedFeedback()
    {
        try {
            $stmt = $this->feedback->getPublished();
            $feedbacks = $this->resultToArray($stmt);

            return $this->successResponse($feedbacks);
        } catch (\Exception $e) {
            return $this->errorResponse('Помилка отримання опублікованих відгуків: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Отримати статистику відгуків
     */
    private function getFeedbackStats()
    {
        try {
            $stats = $this->feedback->getStats();

            if ($stats) {
                return $this->successResponse($stats);
            } else {
                return $this->errorResponse('Помилка отримання статистики', 500);
            }
        } catch (\Exception $e) {
            return $this->errorResponse('Помилка отримання статистики: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Отримати один відгук
     */
    private function getFeedback()
    {
        try {
            $this->feedback->id = $this->resourceId;

            if (!$this->feedback->getOne()) {
                return $this->errorResponse('Відгук не знайдено', 404);
            }

            $feedbackData = [
                'id' => $this->feedback->id,
                'customer_name' => $this->feedback->customer_name,
                'order_id' => $this->feedback->order_id,
                'rating' => $this->feedback->rating,
                'comments' => $this->feedback->comments,
                'feedback_date' => $this->feedback->feedback_date,
                'is_published' => $this->feedback->is_published,
                'created_at' => $this->feedback->created_at
            ];

            return $this->successResponse($feedbackData);
        } catch (\Exception $e) {
            return $this->errorResponse('Помилка отримання відгуку: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Створити відгук
     */
    private function createFeedback()
    {
        try {
            $data = $this->getRequestBody();

            // Валідація обов'язкових полів
            $required = ['rating'];
            $error = $this->validateRequired($data, $required);
            if ($error) {
                return $this->errorResponse($error);
            }

            // Валідація рейтингу
            if (!is_numeric($data['rating']) || $data['rating'] < 1 || $data['rating'] > 5) {
                return $this->errorResponse('Рейтинг має бути числом від 1 до 5');
            }

            // Валідація ID замовлення (якщо вказано)
            if (isset($data['order_id']) && $data['order_id'] !== null) {
                if (!is_numeric($data['order_id']) || $data['order_id'] <= 0) {
                    return $this->errorResponse('ID замовлення має бути позитивним числом');
                }
            }

            // Валідація дати відгуку
            if (isset($data['feedback_date'])) {
                if (!$this->isValidDate($data['feedback_date'])) {
                    return $this->errorResponse('Невірний формат дати відгуку. Використовуйте YYYY-MM-DD');
                }
            }

            // Заповнення даних
            $this->feedback->customer_name = $data['customer_name'] ?? 'Анонім';
            $this->feedback->order_id = isset($data['order_id']) ? $data['order_id'] : null;
            $this->feedback->rating = (int)$data['rating'];
            $this->feedback->comments = $data['comments'] ?? '';
            $this->feedback->feedback_date = $data['feedback_date'] ?? date('Y-m-d');
            $this->feedback->is_published = $data['is_published'] ?? false;

            if ($this->feedback->create()) {
                $feedbackData = [
                    'id' => $this->feedback->id,
                    'customer_name' => $this->feedback->customer_name,
                    'order_id' => $this->feedback->order_id,
                    'rating' => $this->feedback->rating,
                    'comments' => $this->feedback->comments,
                    'feedback_date' => $this->feedback->feedback_date,
                    'is_published' => $this->feedback->is_published
                ];

                return $this->createdResponse($feedbackData, 'Відгук створено');
            } else {
                return $this->errorResponse('Не вдалося створити відгук', 500);
            }
        } catch (\Exception $e) {
            return $this->errorResponse('Помилка створення відгуку: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Оновити відгук
     */
    private function updateFeedback()
    {
        try {
            // Перевіряємо, чи існує відгук
            $this->feedback->id = $this->resourceId;
            if (!$this->feedback->getOne()) {
                return $this->errorResponse('Відгук не знайдено', 404);
            }

            $data = $this->getRequestBody();

            // Валідація рейтингу
            if (isset($data['rating'])) {
                if (!is_numeric($data['rating']) || $data['rating'] < 1 || $data['rating'] > 5) {
                    return $this->errorResponse('Рейтинг має бути числом від 1 до 5');
                }
            }

            // Валідація ID замовлення (якщо вказано)
            if (isset($data['order_id']) && $data['order_id'] !== null) {
                if (!is_numeric($data['order_id']) || $data['order_id'] <= 0) {
                    return $this->errorResponse('ID замовлення має бути позитивним числом');
                }
            }

            // Валідація дати відгуку
            if (isset($data['feedback_date'])) {
                if (!$this->isValidDate($data['feedback_date'])) {
                    return $this->errorResponse('Невірний формат дати відгуку. Використовуйте YYYY-MM-DD');
                }
            }

            // Оновлення даних
            $this->feedback->customer_name = $data['customer_name'] ?? $this->feedback->customer_name;
            $this->feedback->order_id = isset($data['order_id']) ? $data['order_id'] : $this->feedback->order_id;
            $this->feedback->rating = isset($data['rating']) ? (int)$data['rating'] : $this->feedback->rating;
            $this->feedback->comments = $data['comments'] ?? $this->feedback->comments;
            $this->feedback->feedback_date = $data['feedback_date'] ?? $this->feedback->feedback_date;
            $this->feedback->is_published = isset($data['is_published']) ? $data['is_published'] : $this->feedback->is_published;

            if ($this->feedback->update()) {
                return $this->successResponse(null, 'Відгук оновлено');
            } else {
                return $this->errorResponse('Не вдалося оновити відгук', 500);
            }
        } catch (\Exception $e) {
            return $this->errorResponse('Помилка оновлення відгуку: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Змінити статус публікації відгуку
     */
    private function togglePublished()
    {
        try {
            $this->feedback->id = $this->resourceId;

            // Перевіряємо, чи існує відгук
            if (!$this->feedback->getOne()) {
                return $this->errorResponse('Відгук не знайдено', 404);
            }

            if ($this->feedback->togglePublished()) {
                $status = $this->feedback->is_published ? 'опубліковано' : 'приховано';
                return $this->successResponse(null, "Відгук {$status}");
            } else {
                return $this->errorResponse('Не вдалося змінити статус публікації', 500);
            }
        } catch (\Exception $e) {
            return $this->errorResponse('Помилка зміни статусу публікації: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Видалити відгук
     */
    private function deleteFeedback()
    {
        try {
            $this->feedback->id = $this->resourceId;

            // Перевіряємо, чи існує відгук
            if (!$this->feedback->getOne()) {
                return $this->errorResponse('Відгук не знайдено', 404);
            }

            if ($this->feedback->delete()) {
                return $this->successResponse(null, 'Відгук видалено');
            } else {
                return $this->errorResponse('Не вдалося видалити відгук', 500);
            }
        } catch (\Exception $e) {
            return $this->errorResponse('Помилка видалення відгуку: ' . $e->getMessage(), 500);
        }
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