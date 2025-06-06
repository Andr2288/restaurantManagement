<?php
// src/Models/Table.php

namespace Restaurant\models;

class Table
{
    private $conn;
    private $table = 'tables';

    // Властивості об'єкта
    public $id;
    public $table_number;
    public $capacity;
    public $location;
    public $is_available;
    public $created_at;

    /**
     * Конструктор з підключенням до БД
     */
    public function __construct($db)
    {
        $this->conn = $db;
    }

    /**
     * Отримати всі столики
     */
    public function getAll()
    {
        $query = "SELECT * FROM {$this->table} ORDER BY table_number";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        return $stmt;
    }

    /**
     * Отримати доступні столики
     */
    public function getAvailable()
    {
        $query = "SELECT * FROM {$this->table} WHERE is_available = 1 ORDER BY table_number";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        return $stmt;
    }

    /**
     * Отримати один столик
     */
    public function getOne()
    {
        $query = "SELECT * FROM {$this->table} WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $this->id);
        $stmt->execute();

        $row = $stmt->fetch();

        if ($row) {
            $this->table_number = $row['table_number'];
            $this->capacity = $row['capacity'];
            $this->location = $row['location'];
            $this->is_available = $row['is_available'];
            $this->created_at = $row['created_at'];
            return true;
        }

        return false;
    }

    /**
     * Створити новий столик
     */
    public function create()
    {
        $query = "INSERT INTO {$this->table} 
                (table_number, capacity, location, is_available) 
                VALUES 
                (:table_number, :capacity, :location, :is_available)";

        $stmt = $this->conn->prepare($query);

        // Очистка даних
        $this->table_number = htmlspecialchars(strip_tags($this->table_number));
        $this->capacity = htmlspecialchars(strip_tags($this->capacity));
        $this->location = htmlspecialchars(strip_tags($this->location));

        // Прив'язка параметрів
        $stmt->bindParam(':table_number', $this->table_number);
        $stmt->bindParam(':capacity', $this->capacity);
        $stmt->bindParam(':location', $this->location);
        $stmt->bindParam(':is_available', $this->is_available);

        // Виконання запиту
        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }

        return false;
    }

    /**
     * Оновити дані столика
     */
    public function update()
    {
        $query = "UPDATE {$this->table} SET
                table_number = :table_number,
                capacity = :capacity,
                location = :location,
                is_available = :is_available
                WHERE id = :id";

        $stmt = $this->conn->prepare($query);

        // Очистка даних
        $this->table_number = htmlspecialchars(strip_tags($this->table_number));
        $this->capacity = htmlspecialchars(strip_tags($this->capacity));
        $this->location = htmlspecialchars(strip_tags($this->location));
        $this->id = htmlspecialchars(strip_tags($this->id));

        // Прив'язка параметрів
        $stmt->bindParam(':table_number', $this->table_number);
        $stmt->bindParam(':capacity', $this->capacity);
        $stmt->bindParam(':location', $this->location);
        $stmt->bindParam(':is_available', $this->is_available);
        $stmt->bindParam(':id', $this->id);

        // Виконання запиту
        if ($stmt->execute()) {
            return true;
        }

        return false;
    }

    /**
     * Видалити столик
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