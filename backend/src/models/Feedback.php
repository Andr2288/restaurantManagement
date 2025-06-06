<?php
// src/Models/Feedback.php

namespace Restaurant\models;

class Feedback
{
    private $conn;
    private $table = 'feedback';

    // Властивості об'єкта
    public $id;
    public $customer_name;
    public $order_id;
    public $rating;
    public $comments;
    public $feedback_date;
    public $is_published;
    public $created_at;

    /**
     * Конструктор з підключенням до БД
     */
    public function __construct($db)
    {
        $this->conn = $db;
    }

    /**
     * Отримати всі відгуки
     */
    public function getAll()
    {
        $query = "SELECT f.*, o.order_date, o.order_time 
                  FROM {$this->table} f
                  LEFT JOIN orders o ON f.order_id = o.id
                  ORDER BY f.feedback_date DESC, f.id DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        return $stmt;
    }

    /**
     * Отримати опубліковані відгуки
     */
    public function getPublished()
    {
        $query = "SELECT f.*, o.order_date, o.order_time 
                  FROM {$this->table} f
                  LEFT JOIN orders o ON f.order_id = o.id
                  WHERE f.is_published = 1
                  ORDER BY f.feedback_date DESC, f.id DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        return $stmt;
    }

    /**
     * Отримати один відгук
     */
    public function getOne()
    {
        $query = "SELECT * FROM {$this->table} WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $this->id);
        $stmt->execute();

        $row = $stmt->fetch();

        if ($row) {
            $this->customer_name = $row['customer_name'];
            $this->order_id = $row['order_id'];
            $this->rating = $row['rating'];
            $this->comments = $row['comments'];
            $this->feedback_date = $row['feedback_date'];
            $this->is_published = $row['is_published'];
            $this->created_at = $row['created_at'];
            return true;
        }

        return false;
    }

    /**
     * Створити новий відгук
     */
    public function create()
    {
        $query = "INSERT INTO {$this->table} 
                (customer_name, order_id, rating, comments, feedback_date, is_published) 
                VALUES 
                (:customer_name, :order_id, :rating, :comments, :feedback_date, :is_published)";

        $stmt = $this->conn->prepare($query);

        // Очистка даних
        $this->customer_name = htmlspecialchars(strip_tags($this->customer_name));
        $this->comments = htmlspecialchars(strip_tags($this->comments));

        // Встановлюємо поточну дату, якщо не вказано
        if (!$this->feedback_date) {
            $this->feedback_date = date('Y-m-d');
        }

        // За замовчуванням відгук не опублікований
        if ($this->is_published === null) {
            $this->is_published = 0;
        }

        // Прив'язка параметрів
        $stmt->bindParam(':customer_name', $this->customer_name);
        $stmt->bindParam(':order_id', $this->order_id);
        $stmt->bindParam(':rating', $this->rating);
        $stmt->bindParam(':comments', $this->comments);
        $stmt->bindParam(':feedback_date', $this->feedback_date);
        $stmt->bindParam(':is_published', $this->is_published, \PDO::PARAM_BOOL);

        // Виконання запиту
        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }

        return false;
    }

    /**
     * Оновити відгук
     */
    public function update()
    {
        $query = "UPDATE {$this->table} SET
                customer_name = :customer_name,
                order_id = :order_id,
                rating = :rating,
                comments = :comments,
                feedback_date = :feedback_date,
                is_published = :is_published
                WHERE id = :id";

        $stmt = $this->conn->prepare($query);

        // Очистка даних
        $this->customer_name = htmlspecialchars(strip_tags($this->customer_name));
        $this->comments = htmlspecialchars(strip_tags($this->comments));
        $this->id = htmlspecialchars(strip_tags($this->id));

        // Прив'язка параметрів
        $stmt->bindParam(':customer_name', $this->customer_name);
        $stmt->bindParam(':order_id', $this->order_id);
        $stmt->bindParam(':rating', $this->rating);
        $stmt->bindParam(':comments', $this->comments);
        $stmt->bindParam(':feedback_date', $this->feedback_date);
        $stmt->bindParam(':is_published', $this->is_published, \PDO::PARAM_BOOL);
        $stmt->bindParam(':id', $this->id);

        // Виконання запиту
        if ($stmt->execute()) {
            return true;
        }

        return false;
    }

    /**
     * Видалити відгук
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

    /**
     * Змінити статус публікації
     */
    public function togglePublished()
    {
        $query = "UPDATE {$this->table} SET is_published = NOT is_published WHERE id = :id";
        $stmt = $this->conn->prepare($query);

        // Прив'язка параметра
        $stmt->bindParam(':id', $this->id);

        // Виконання запиту
        if ($stmt->execute()) {
            // Оновлюємо значення властивості
            $this->is_published = !$this->is_published;
            return true;
        }

        return false;
    }

    /**
     * Отримати статистику відгуків
     */
    public function getStats()
    {
        $query = "SELECT 
                  COUNT(*) as total_count,
                  ROUND(AVG(rating), 1) as avg_rating,
                  SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as rating_5,
                  SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as rating_4,
                  SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as rating_3,
                  SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as rating_2,
                  SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as rating_1
                  FROM {$this->table}";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        return $stmt->fetch();
    }
}