<?php
// src/controllers/EmployeeController.php

namespace Restaurant\controllers;

use Restaurant\models\Employee;

class EmployeeController extends BaseController
{
    private $employee;

    public function __construct($db, $requestMethod, $resourceId = null)
    {
        parent::__construct($db, $requestMethod, $resourceId);
        $this->employee = new Employee($db);
    }

    protected function handleGet()
    {
        if ($this->resourceId) {
            // Отримати одного співробітника
            return $this->getEmployee();
        } else {
            // Отримати всіх співробітників
            return $this->getAllEmployees();
        }
    }

    protected function handlePost()
    {
        return $this->createEmployee();
    }

    protected function handlePut()
    {
        if (!$this->resourceId) {
            return $this->errorResponse('ID співробітника не вказано');
        }
        return $this->updateEmployee();
    }

    protected function handleDelete()
    {
        if (!$this->resourceId) {
            return $this->errorResponse('ID співробітника не вказано');
        }
        return $this->deleteEmployee();
    }

    /**
     * Отримати всіх співробітників
     */
    private function getAllEmployees()
    {
        try {
            $stmt = $this->employee->getAll();
            $employees = $this->resultToArray($stmt);

            return $this->successResponse($employees);
        } catch (\Exception $e) {
            return $this->errorResponse('Помилка отримання співробітників: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Отримати одного співробітника
     */
    private function getEmployee()
    {
        try {
            $this->employee->id = $this->resourceId;

            if (!$this->employee->getOne()) {
                return $this->errorResponse('Співробітника не знайдено', 404);
            }

            $employeeData = [
                'id' => $this->employee->id,
                'first_name' => $this->employee->first_name,
                'last_name' => $this->employee->last_name,
                'position' => $this->employee->position,
                'phone' => $this->employee->phone,
                'email' => $this->employee->email,
                'hire_date' => $this->employee->hire_date,
                'salary' => $this->employee->salary,
                'is_active' => $this->employee->is_active,
                'created_at' => $this->employee->created_at
            ];

            return $this->successResponse($employeeData);
        } catch (\Exception $e) {
            return $this->errorResponse('Помилка отримання співробітника: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Створити співробітника
     */
    private function createEmployee()
    {
        try {
            $data = $this->getRequestBody();

            // Валідація обов'язкових полів
            $required = ['first_name', 'last_name', 'position', 'hire_date'];
            $error = $this->validateRequired($data, $required);
            if ($error) {
                return $this->errorResponse($error);
            }

            // Валідація позиції
            $allowedPositions = ['Офіціант', 'Кухар', 'Бармен', 'Менеджер', 'Адміністратор'];
            if (!in_array($data['position'], $allowedPositions)) {
                return $this->errorResponse('Невірна позиція. Доступні: ' . implode(', ', $allowedPositions));
            }

            // Валідація email (якщо вказано)
            if (isset($data['email']) && !empty($data['email'])) {
                if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                    return $this->errorResponse('Невірний формат email');
                }
            }

            // Заповнення даних
            $this->employee->first_name = $data['first_name'];
            $this->employee->last_name = $data['last_name'];
            $this->employee->position = $data['position'];
            $this->employee->phone = $data['phone'] ?? null;
            $this->employee->email = $data['email'] ?? null;
            $this->employee->hire_date = $data['hire_date'];
            $this->employee->salary = $data['salary'] ?? 0;
            $this->employee->is_active = $data['is_active'] ?? true;

            if ($this->employee->create()) {
                $employeeData = [
                    'id' => $this->employee->id,
                    'first_name' => $this->employee->first_name,
                    'last_name' => $this->employee->last_name,
                    'position' => $this->employee->position,
                    'phone' => $this->employee->phone,
                    'email' => $this->employee->email,
                    'hire_date' => $this->employee->hire_date,
                    'salary' => $this->employee->salary,
                    'is_active' => $this->employee->is_active
                ];

                return $this->createdResponse($employeeData, 'Співробітника створено');
            } else {
                return $this->errorResponse('Не вдалося створити співробітника', 500);
            }
        } catch (\Exception $e) {
            return $this->errorResponse('Помилка створення співробітника: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Оновити співробітника
     */
    private function updateEmployee()
    {
        try {
            // Перевіряємо, чи існує співробітник
            $this->employee->id = $this->resourceId;
            if (!$this->employee->getOne()) {
                return $this->errorResponse('Співробітника не знайдено', 404);
            }

            $data = $this->getRequestBody();

            // Валідація позиції (якщо вказано)
            if (isset($data['position'])) {
                $allowedPositions = ['Офіціант', 'Кухар', 'Бармен', 'Менеджер', 'Адміністратор'];
                if (!in_array($data['position'], $allowedPositions)) {
                    return $this->errorResponse('Невірна позиція. Доступні: ' . implode(', ', $allowedPositions));
                }
            }

            // Валідація email (якщо вказано)
            if (isset($data['email']) && !empty($data['email'])) {
                if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                    return $this->errorResponse('Невірний формат email');
                }
            }

            // Оновлення даних
            $this->employee->first_name = $data['first_name'] ?? $this->employee->first_name;
            $this->employee->last_name = $data['last_name'] ?? $this->employee->last_name;
            $this->employee->position = $data['position'] ?? $this->employee->position;
            $this->employee->phone = $data['phone'] ?? $this->employee->phone;
            $this->employee->email = $data['email'] ?? $this->employee->email;
            $this->employee->hire_date = $data['hire_date'] ?? $this->employee->hire_date;
            $this->employee->salary = $data['salary'] ?? $this->employee->salary;
            $this->employee->is_active = isset($data['is_active']) ? $data['is_active'] : $this->employee->is_active;

            if ($this->employee->update()) {
                return $this->successResponse(null, 'Співробітника оновлено');
            } else {
                return $this->errorResponse('Не вдалося оновити співробітника', 500);
            }
        } catch (\Exception $e) {
            return $this->errorResponse('Помилка оновлення співробітника: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Видалити співробітника
     */
    private function deleteEmployee()
    {
        try {
            $this->employee->id = $this->resourceId;

            // Перевіряємо, чи існує співробітник
            if (!$this->employee->getOne()) {
                return $this->errorResponse('Співробітника не знайдено', 404);
            }

            if ($this->employee->delete()) {
                return $this->successResponse(null, 'Співробітника видалено');
            } else {
                return $this->errorResponse('Не вдалося видалити співробітника', 500);
            }
        } catch (\Exception $e) {
            return $this->errorResponse('Помилка видалення співробітника: ' . $e->getMessage(), 500);
        }
    }
}