<?php
// src/Models/MenuItem.php

namespace Restaurant\Models;

class MenuItem
{
    private $conn;
    private $table = 'menu_items';

    // Властивості об'єкта
    public $id;
    public $name;
    public $category;
    public $description;
    public $price;
    public $cooking_time;
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
     * Отримати всі страви меню
     */
    public function getAll()
    {
        $query = "SELECT * FROM {$this->table} ORDER BY category, name";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        return $stmt;
    }

    /**
     * Отримати страви за категорією
     */
    public function getByCategory($category)
    {
        $query = "SELECT * FROM {$this->table} WHERE category = :category ORDER BY name";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':category', $category);
        $stmt->execute();

        return $stmt;
    }

    /**
     * Отримати доступні страви
     */
    public function getAvailable()
    {
        $query = "SELECT * FROM {$this->table} WHERE is_available = 1 ORDER BY category, name";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        return $stmt;
    }

    /**
     * Отримати одну страву
     */
    public function getOne()
    {
        $query = "SELECT * FROM {$this->table} WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $this->id);
        $stmt->execute();

        $row = $stmt->fetch();

        if ($row) {
            $this->name = $row['name'];
            $this->category = $row['category'];
            $this->description = $row['description'];
            $this->price = $row['price'];
            $this->cooking_time = $row['cooking_time'];
            $this->is_available = $row['is_available'];
            $this->created_at = $row['created_at'];
            return true;
        }

        return false;
    }

    /**
     * Створити нову страву
     */
    public function create()
    {
        $query = "INSERT INTO {$this->table} 
                (name, category, description, price, cooking_time, is_available) 
                VALUES 
                (:name, :category, :description, :price, :cooking_time, :is_available)";

        $stmt = $this->conn->prepare($query);

        // Очистка даних
        $this->name = htmlspecialchars(strip_tags($this->name));
        $this->category = htmlspecialchars(strip_tags($this->category));
        $this->description = htmlspecialchars(strip_tags($this->description));

        // Прив'язка параметрів
        $stmt->bindParam(':name', $this->name);
        $stmt->bindParam(':category', $this->category);
        $stmt->bindParam(':description', $this->description);
        $stmt->bindParam(':price', $this->price);
        $stmt->bindParam(':cooking_time', $this->cooking_time);
        $stmt->bindParam(':is_available', $this->is_available);

        // Виконання запиту
        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }

        return false;
    }

    /**
     * Оновити страву
     */
    public function update()
    {
        $query = "UPDATE {$this->table} SET
                name = :name,
                category = :category,
                description = :description,
                price = :price,
                cooking_time = :cooking_time,
                is_available = :is_available
                WHERE id = :id";

        $stmt = $this->conn->prepare($query);

        // Очистка даних
        $this->name = htmlspecialchars(strip_tags($this->name));
        $this->category = htmlspecialchars(strip_tags($this->category));
        $this->description = htmlspecialchars(strip_tags($this->description));
        $this->id = htmlspecialchars(strip_tags($this->id));

        // Прив'язка параметрів
        $stmt->bindParam(':name', $this->name);
        $stmt->bindParam(':category', $this->category);
        $stmt->bindParam(':description', $this->description);
        $stmt->bindParam(':price', $this->price);
        $stmt->bindParam(':cooking_time', $this->cooking_time);
        $stmt->bindParam(':is_available', $this->is_available);
        $stmt->bindParam(':id', $this->id);

        // Виконання запиту
        if ($stmt->execute()) {
            return true;
        }

        return false;
    }

    /**
     * Видалити страву
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