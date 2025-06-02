<?php
// src/Models/Order.php

namespace Restaurant\Models;

class Order
{
    private $conn;
    private $table = 'orders';

    // Властивості об'єкта
    public $id;
    public $table_id;
    public $employee_id;
    public $order_date;
    public $order_time;
    public $total_amount;
    public $status;
    public $payment_method;
    public $created_at;

    /**
     * Конструктор з підключенням до БД
     */
    public function __construct($db)
    {
        $this->conn = $db;
    }

    /**
     * Отримати всі замовлення
     */
    public function getAll()
    {
        $query = "SELECT 
                  o.*, 
                  t.table_number,
                  CONCAT(e.first_name, ' ', e.last_name) as employee_name
                  FROM {$this->table} o
                  LEFT JOIN tables t ON o.table_id = t.id
                  LEFT JOIN employees e ON o.employee_id = e.id
                  ORDER BY o.order_date DESC, o.order_time DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        return $stmt;
    }

    /**
     * Отримати замовлення за датою
     */
    public function getByDate($date)
    {
        $query = "SELECT 
                  o.*, 
                  t.table_number,
                  CONCAT(e.first_name, ' ', e.last_name) as employee_name
                  FROM {$this->table} o
                  LEFT JOIN tables t ON o.table_id = t.id
                  LEFT JOIN employees e ON o.employee_id = e.id
                  WHERE o.order_date = :order_date
                  ORDER BY o.order_time DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':order_date', $date);
        $stmt->execute();

        return $stmt;
    }

    /**
     * Отримати активні замовлення
     */
    public function getActive()
    {
        $query = "SELECT 
                  o.*, 
                  t.table_number,
                  CONCAT(e.first_name, ' ', e.last_name) as employee_name
                  FROM {$this->table} o
                  LEFT JOIN tables t ON o.table_id = t.id
                  LEFT JOIN employees e ON o.employee_id = e.id
                  WHERE o.status IN ('Нове', 'Готується', 'Готове', 'Подано')
                  ORDER BY o.order_date DESC, o.order_time DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        return $stmt;
    }

    /**
     * Отримати одне замовлення з деталями
     */
    public function getOneWithDetails()
    {
        // Запит для отримання замовлення
        $query = "SELECT 
                  o.*, 
                  t.table_number,
                  CONCAT(e.first_name, ' ', e.last_name) as employee_name
                  FROM {$this->table} o
                  LEFT JOIN tables t ON o.table_id = t.id
                  LEFT JOIN employees e ON o.employee_id = e.id
                  WHERE o.id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $this->id);
        $stmt->execute();

        $order = $stmt->fetch();

        if (!$order) {
            return false;
        }

        // Заповнюємо дані замовлення
        $this->table_id = $order['table_id'];
        $this->employee_id = $order['employee_id'];
        $this->order_date = $order['order_date'];
        $this->order_time = $order['order_time'];
        $this->total_amount = $order['total_amount'];
        $this->status = $order['status'];
        $this->payment_method = $order['payment_method'];
        $this->created_at = $order['created_at'];

        // Отримуємо деталі замовлення
        $details_query = "SELECT 
                          od.*,
                          m.name as item_name,
                          m.category as item_category
                          FROM order_details od
                          LEFT JOIN menu_items m ON od.menu_item_id = m.id
                          WHERE od.order_id = :order_id";

        $details_stmt = $this->conn->prepare($details_query);
        $details_stmt->bindParam(':order_id', $this->id);
        $details_stmt->execute();

        // Додаємо деталі до результату
        $order['details'] = $details_stmt->fetchAll();

        return $order;
    }

    /**
     * Отримати одне замовлення
     */
    public function getOne()
    {
        $query = "SELECT * FROM {$this->table} WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $this->id);
        $stmt->execute();

        $row = $stmt->fetch();

        if ($row) {
            $this->table_id = $row['table_id'];
            $this->employee_id = $row['employee_id'];
            $this->order_date = $row['order_date'];
            $this->order_time = $row['order_time'];
            $this->total_amount = $row['total_amount'];
            $this->status = $row['status'];
            $this->payment_method = $row['payment_method'];
            $this->created_at = $row['created_at'];
            return true;
        }

        return false;
    }

    /**
     * Створити нове замовлення
     */
    public function create()
    {
        // Починаємо транзакцію
        $this->conn->beginTransaction();

        try {
            $query = "INSERT INTO {$this->table} 
                    (table_id, employee_id, order_date, order_time, total_amount, status) 
                    VALUES 
                    (:table_id, :employee_id, :order_date, :order_time, :total_amount, :status)";

            $stmt = $this->conn->prepare($query);

            // Встановлюємо поточну дату та час, якщо не вказано
            if (!$this->order_date) {
                $this->order_date = date('Y-m-d');
            }

            if (!$this->order_time) {
                $this->order_time = date('H:i:s');
            }

            // Прив'язка параметрів
            $stmt->bindParam(':table_id', $this->table_id);
            $stmt->bindParam(':employee_id', $this->employee_id);
            $stmt->bindParam(':order_date', $this->order_date);
            $stmt->bindParam(':order_time', $this->order_time);
            $stmt->bindParam(':total_amount', $this->total_amount);
            $stmt->bindParam(':status', $this->status);

            // Виконання запиту
            $stmt->execute();

            // Отримуємо ID створеного замовлення
            $this->id = $this->conn->lastInsertId();

            // Підтверджуємо транзакцію
            $this->conn->commit();

            return true;
        } catch (\Exception $e) {
            // Відкат транзакції у разі помилки
            $this->conn->rollback();
            throw $e;
        }
    }

    /**
     * Оновити замовлення
     */
    public function update()
    {
        $query = "UPDATE {$this->table} SET
                table_id = :table_id,
                employee_id = :employee_id,
                order_date = :order_date,
                order_time = :order_time,
                total_amount = :total_amount,
                status = :status,
                payment_method = :payment_method
                WHERE id = :id";

        $stmt = $this->conn->prepare($query);

        // Прив'язка параметрів
        $stmt->bindParam(':table_id', $this->table_id);
        $stmt->bindParam(':employee_id', $this->employee_id);
        $stmt->bindParam(':order_date', $this->order_date);
        $stmt->bindParam(':order_time', $this->order_time);
        $stmt->bindParam(':total_amount', $this->total_amount);
        $stmt->bindParam(':status', $this->status);
        $stmt->bindParam(':payment_method', $this->payment_method);
        $stmt->bindParam(':id', $this->id);

        // Виконання запиту
        if ($stmt->execute()) {
            return true;
        }

        return false;
    }

    /**
     * Видалити замовлення
     */
    public function delete()
    {
        // Починаємо транзакцію
        $this->conn->beginTransaction();

        try {
            // Спочатку видаляємо деталі замовлення
            $delete_details = "DELETE FROM order_details WHERE order_id = :order_id";
            $stmt_details = $this->conn->prepare($delete_details);
            $stmt_details->bindParam(':order_id', $this->id);
            $stmt_details->execute();

            // Потім видаляємо саме замовлення
            $delete_order = "DELETE FROM {$this->table} WHERE id = :id";
            $stmt_order = $this->conn->prepare($delete_order);
            $stmt_order->bindParam(':id', $this->id);
            $stmt_order->execute();

            // Підтверджуємо транзакцію
            $this->conn->commit();

            return true;
        } catch (\Exception $e) {
            // Відкат транзакції у разі помилки
            $this->conn->rollback();
            throw $e;
        }
    }

    /**
     * Оновити статус замовлення
     */
    public function updateStatus($status)
    {
        $query = "UPDATE {$this->table} SET status = :status WHERE id = :id";
        $stmt = $this->conn->prepare($query);

        // Прив'язка параметрів
        $stmt->bindParam(':status', $status);
        $stmt->bindParam(':id', $this->id);

        // Виконання запиту
        if ($stmt->execute()) {
            $this->status = $status;
            return true;
        }

        return false;
    }
}