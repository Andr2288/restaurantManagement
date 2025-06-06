<?php
// src/Models/OrderDetail.php

namespace Restaurant\models;

class OrderDetail
{
    private $conn;
    private $table = 'order_details';

    // Властивості об'єкта
    public $id;
    public $order_id;
    public $menu_item_id;
    public $quantity;
    public $unit_price;
    public $subtotal;
    public $created_at;

    /**
     * Конструктор з підключенням до БД
     */
    public function __construct($db)
    {
        $this->conn = $db;
    }

    /**
     * Отримати всі деталі замовлення
     */
    public function getByOrderId($order_id)
    {
        $query = "SELECT 
                  od.*,
                  m.name as item_name,
                  m.category as item_category
                  FROM {$this->table} od
                  LEFT JOIN menu_items m ON od.menu_item_id = m.id
                  WHERE od.order_id = :order_id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':order_id', $order_id);
        $stmt->execute();

        return $stmt;
    }

    /**
     * Створити новий елемент замовлення
     */
    public function create()
    {
        $query = "INSERT INTO {$this->table} 
                (order_id, menu_item_id, quantity, unit_price, subtotal) 
                VALUES 
                (:order_id, :menu_item_id, :quantity, :unit_price, :subtotal)";

        $stmt = $this->conn->prepare($query);

        // Прив'язка параметрів
        $stmt->bindParam(':order_id', $this->order_id);
        $stmt->bindParam(':menu_item_id', $this->menu_item_id);
        $stmt->bindParam(':quantity', $this->quantity);
        $stmt->bindParam(':unit_price', $this->unit_price);
        $stmt->bindParam(':subtotal', $this->subtotal);

        // Виконання запиту
        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();

            // Оновлюємо загальну суму замовлення
            $this->updateOrderTotal($this->order_id);

            return true;
        }

        return false;
    }

    /**
     * Оновити елемент замовлення
     */
    public function update()
    {
        $query = "UPDATE {$this->table} SET
                quantity = :quantity,
                unit_price = :unit_price,
                subtotal = :subtotal
                WHERE id = :id";

        $stmt = $this->conn->prepare($query);

        // Прив'язка параметрів
        $stmt->bindParam(':quantity', $this->quantity);
        $stmt->bindParam(':unit_price', $this->unit_price);
        $stmt->bindParam(':subtotal', $this->subtotal);
        $stmt->bindParam(':id', $this->id);

        // Виконання запиту
        if ($stmt->execute()) {
            // Оновлюємо загальну суму замовлення
            $this->updateOrderTotal($this->order_id);

            return true;
        }

        return false;
    }

    /**
     * Видалити елемент замовлення
     */
    public function delete()
    {
        $query = "DELETE FROM {$this->table} WHERE id = :id";
        $stmt = $this->conn->prepare($query);

        // Прив'язка параметра
        $stmt->bindParam(':id', $this->id);

        // Виконання запиту
        if ($stmt->execute()) {
            // Оновлюємо загальну суму замовлення
            $this->updateOrderTotal($this->order_id);

            return true;
        }

        return false;
    }

    /**
     * Отримати ціну страви за ID
     */
    public function getMenuItemPrice($menu_item_id)
    {
        $query = "SELECT price FROM menu_items WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $menu_item_id);
        $stmt->execute();

        $row = $stmt->fetch();

        return $row ? $row['price'] : 0;
    }

    /**
     * Оновити загальну суму замовлення
     */
    private function updateOrderTotal($order_id)
    {
        $query = "UPDATE orders SET total_amount = (
                  SELECT SUM(subtotal) FROM {$this->table} WHERE order_id = :order_id
                ) WHERE id = :order_id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':order_id', $order_id);
        $stmt->execute();
    }

    /**
     * Додати багато деталей до замовлення
     */
    public function addMultiple($order_id, $items)
    {
        // Починаємо транзакцію
        $this->conn->beginTransaction();

        try {
            // Запит для додавання однієї деталі замовлення
            $query = "INSERT INTO {$this->table} 
                    (order_id, menu_item_id, quantity, unit_price, subtotal) 
                    VALUES 
                    (:order_id, :menu_item_id, :quantity, :unit_price, :subtotal)";

            $stmt = $this->conn->prepare($query);

            foreach ($items as $item) {
                // Отримуємо ціну страви, якщо вона не вказана
                if (!isset($item['unit_price'])) {
                    $item['unit_price'] = $this->getMenuItemPrice($item['menu_item_id']);
                }

                // Розраховуємо підсумок, якщо він не вказаний
                if (!isset($item['subtotal'])) {
                    $item['subtotal'] = $item['unit_price'] * $item['quantity'];
                }

                // Прив'язка параметрів
                $stmt->bindParam(':order_id', $order_id);
                $stmt->bindParam(':menu_item_id', $item['menu_item_id']);
                $stmt->bindParam(':quantity', $item['quantity']);
                $stmt->bindParam(':unit_price', $item['unit_price']);
                $stmt->bindParam(':subtotal', $item['subtotal']);

                // Виконання запиту
                $stmt->execute();
            }

            // Оновлюємо загальну суму замовлення
            $this->updateOrderTotal($order_id);

            // Підтверджуємо транзакцію
            $this->conn->commit();

            return true;
        } catch (\Exception $e) {
            // Відкат транзакції у разі помилки
            $this->conn->rollback();
            throw $e;
        }
    }
}