<?php
// src/Models/Employee.php

namespace Restaurant\models;

class Employee
{
    private $conn;
    private $table = 'employees';

    // Властивості об'єкта
    public $id;
    public $first_name;
    public $last_name;
    public $position;
    public $phone;
    public $email;
    public $hire_date;
    public $salary;
    public $is_active;
    public $created_at;

    /**
     * Конструктор з підключенням до БД
     */
    public function __construct($db)
    {
        $this->conn = $db;
    }

    /**
     * Отримати всіх працівників
     */
    public function getAll()
    {
        $query = "SELECT * FROM {$this->table} ORDER BY last_name, first_name";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        return $stmt;
    }

    /**
     * Отримати одного працівника
     */
    public function getOne()
    {
        $query = "SELECT * FROM {$this->table} WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $this->id);
        $stmt->execute();

        $row = $stmt->fetch();

        if ($row) {
            $this->first_name = $row['first_name'];
            $this->last_name = $row['last_name'];
            $this->position = $row['position'];
            $this->phone = $row['phone'];
            $this->email = $row['email'];
            $this->hire_date = $row['hire_date'];
            $this->salary = $row['salary'];
            $this->is_active = $row['is_active'];
            $this->created_at = $row['created_at'];
            return true;
        }

        return false;
    }

    /**
     * Створити нового працівника
     */
    public function create()
    {
        $query = "INSERT INTO {$this->table} 
                (first_name, last_name, position, phone, email, hire_date, salary, is_active) 
                VALUES 
                (:first_name, :last_name, :position, :phone, :email, :hire_date, :salary, :is_active)";

        $stmt = $this->conn->prepare($query);

        // Очистка даних
        $this->first_name = htmlspecialchars(strip_tags($this->first_name));
        $this->last_name = htmlspecialchars(strip_tags($this->last_name));
        $this->position = htmlspecialchars(strip_tags($this->position));
        $this->phone = htmlspecialchars(strip_tags($this->phone));
        $this->email = htmlspecialchars(strip_tags($this->email));
        $this->hire_date = htmlspecialchars(strip_tags($this->hire_date));

        // Прив'язка параметрів
        $stmt->bindParam(':first_name', $this->first_name);
        $stmt->bindParam(':last_name', $this->last_name);
        $stmt->bindParam(':position', $this->position);
        $stmt->bindParam(':phone', $this->phone);
        $stmt->bindParam(':email', $this->email);
        $stmt->bindParam(':hire_date', $this->hire_date);
        $stmt->bindParam(':salary', $this->salary);
        $stmt->bindParam(':is_active', $this->is_active);

        // Виконання запиту
        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }

        return false;
    }

    /**
     * Оновити дані працівника
     */
    public function update()
    {
        $query = "UPDATE {$this->table} SET
                first_name = :first_name,
                last_name = :last_name,
                position = :position,
                phone = :phone,
                email = :email,
                hire_date = :hire_date,
                salary = :salary,
                is_active = :is_active
                WHERE id = :id";

        $stmt = $this->conn->prepare($query);

        // Очистка даних
        $this->first_name = htmlspecialchars(strip_tags($this->first_name));
        $this->last_name = htmlspecialchars(strip_tags($this->last_name));
        $this->position = htmlspecialchars(strip_tags($this->position));
        $this->phone = htmlspecialchars(strip_tags($this->phone));
        $this->email = htmlspecialchars(strip_tags($this->email));
        $this->hire_date = htmlspecialchars(strip_tags($this->hire_date));
        $this->id = htmlspecialchars(strip_tags($this->id));

        // Прив'язка параметрів
        $stmt->bindParam(':first_name', $this->first_name);
        $stmt->bindParam(':last_name', $this->last_name);
        $stmt->bindParam(':position', $this->position);
        $stmt->bindParam(':phone', $this->phone);
        $stmt->bindParam(':email', $this->email);
        $stmt->bindParam(':hire_date', $this->hire_date);
        $stmt->bindParam(':salary', $this->salary);
        $stmt->bindParam(':is_active', $this->is_active);
        $stmt->bindParam(':id', $this->id);

        // Виконання запиту
        if ($stmt->execute()) {
            return true;
        }

        return false;
    }

    /**
     * Видалити працівника
     */
    public function delete()
    {
        $query = "DELETE FROM {$this->table} WHERE id = :id";
        $stmt = $this->conn->prepare($query);

        // Очистка даних
        $this->id = htmlspecialchars(strip_tags($this->id));

        // Прив'язка параметра
        $stmt->bindParam(':id', $this->id);

        // Виконання запиту
        if ($stmt->execute()) {
            return true;
        }

        return false;
    }
}