<?php
// src/Models/Reservation.php

namespace Restaurant\Models;

class Reservation
{
    private $conn;
    private $table = 'reservations';

    // Властивості об'єкта
    public $id;
    public $customer_name;
    public $customer_phone;
    public $reservation_date;
    public $reservation_time;
    public $table_id;
    public $number_of_guests;
    public $notes;
    public $status;
    public $created_at;

    /**
     * Конструктор з підключенням до БД
     */
    public function __construct($db)
    {
        $this->conn = $db;
    }

    /**
     * Отримати всі резервації
     */
    public function getAll()
    {
        $query = "SELECT 
                  r.*,
                  t.table_number,
                  t.capacity
                  FROM {$this->table} r
                  LEFT JOIN tables t ON r.table_id = t.id
                  ORDER BY r.reservation_date, r.reservation_time";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        return $stmt;
    }

    /**
     * Отримати резервації на певну дату
     */
    public function getByDate($date)
    {
        $query = "SELECT 
                  r.*,
                  t.table_number,
                  t.capacity
                  FROM {$this->table} r
                  LEFT JOIN tables t ON r.table_id = t.id
                  WHERE r.reservation_date = :reservation_date
                  ORDER BY r.reservation_time";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':reservation_date', $date);
        $stmt->execute();

        return $stmt;
    }

    /**
     * Отримати майбутні резервації
     */
    public function getUpcoming()
    {
        $today = date('Y-m-d');

        $query = "SELECT 
                  r.*,
                  t.table_number,
                  t.capacity
                  FROM {$this->table} r
                  LEFT JOIN tables t ON r.table_id = t.id
                  WHERE r.reservation_date >= :today AND r.status = 'Підтверджено'
                  ORDER BY r.reservation_date, r.reservation_time";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':today', $today);
        $stmt->execute();

        return $stmt;
    }

    /**
     * Отримати одну резервацію
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
            $this->customer_phone = $row['customer_phone'];
            $this->reservation_date = $row['reservation_date'];
            $this->reservation_time = $row['reservation_time'];
            $this->table_id = $row['table_id'];
            $this->number_of_guests = $row['number_of_guests'];
            $this->notes = $row['notes'];
            $this->status = $row['status'];
            $this->created_at = $row['created_at'];
            return true;
        }

        return false;
    }

    /**
     * Створити нову резервацію
     */
    public function create()
    {
        $query = "INSERT INTO {$this->table} 
                (customer_name, customer_phone, reservation_date, reservation_time, table_id, number_of_guests, notes, status) 
                VALUES 
                (:customer_name, :customer_phone, :reservation_date, :reservation_time, :table_id, :number_of_guests, :notes, :status)";

        $stmt = $this->conn->prepare($query);

        // Очистка даних
        $this->customer_name = htmlspecialchars(strip_tags($this->customer_name));
        $this->customer_phone = htmlspecialchars(strip_tags($this->customer_phone));
        $this->notes = htmlspecialchars(strip_tags($this->notes));

        // Статус за замовчуванням
        if (!$this->status) {
            $this->status = 'Підтверджено';
        }

        // Прив'язка параметрів
        $stmt->bindParam(':customer_name', $this->customer_name);
        $stmt->bindParam(':customer_phone', $this->customer_phone);
        $stmt->bindParam(':reservation_date', $this->reservation_date);
        $stmt->bindParam(':reservation_time', $this->reservation_time);
        $stmt->bindParam(':table_id', $this->table_id);
        $stmt->bindParam(':number_of_guests', $this->number_of_guests);
        $stmt->bindParam(':notes', $this->notes);
        $stmt->bindParam(':status', $this->status);

        // Виконання запиту
        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }

        return false;
    }

    /**
     * Оновити резервацію
     */
    public function update()
    {
        $query = "UPDATE {$this->table} SET
                customer_name = :customer_name,
                customer_phone = :customer_phone,
                reservation_date = :reservation_date,
                reservation_time = :reservation_time,
                table_id = :table_id,
                number_of_guests = :number_of_guests,
                notes = :notes,
                status = :status
                WHERE id = :id";

        $stmt = $this->conn->prepare($query);

        // Очистка даних
        $this->customer_name = htmlspecialchars(strip_tags($this->customer_name));
        $this->customer_phone = htmlspecialchars(strip_tags($this->customer_phone));
        $this->notes = htmlspecialchars(strip_tags($this->notes));
        $this->id = htmlspecialchars(strip_tags($this->id));

        // Прив'язка параметрів
        $stmt->bindParam(':customer_name', $this->customer_name);
        $stmt->bindParam(':customer_phone', $this->customer_phone);
        $stmt->bindParam(':reservation_date', $this->reservation_date);
        $stmt->bindParam(':reservation_time', $this->reservation_time);
        $stmt->bindParam(':table_id', $this->table_id);
        $stmt->bindParam(':number_of_guests', $this->number_of_guests);
        $stmt->bindParam(':notes', $this->notes);
        $stmt->bindParam(':status', $this->status);
        $stmt->bindParam(':id', $this->id);

        // Виконання запиту
        if ($stmt->execute()) {
            return true;
        }

        return false;
    }

    /**
     * Видалити резервацію
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
     * Перевірити доступність столика на вказаний час
     */
    public function checkTableAvailability($table_id, $date, $time, $exclude_id = null)
    {
        // Час до і після резервації (у хвилинах)
        $bufferTime = 120;

        // Конвертуємо час у хвилини
        $timeInMinutes = $this->timeToMinutes($time);
        $startTimeInMinutes = $timeInMinutes - $bufferTime;
        $endTimeInMinutes = $timeInMinutes + $bufferTime;

        // Запит для перевірки перетину з існуючими резерваціями
        $query = "SELECT COUNT(*) AS reservation_count FROM {$this->table} 
                 WHERE table_id = :table_id 
                 AND reservation_date = :date
                 AND status IN ('Підтверджено', 'Прибули')
                 AND (
                     (TIME_TO_SEC(reservation_time) / 60 BETWEEN :start_time AND :end_time) OR
                     (:time_in_minutes BETWEEN (TIME_TO_SEC(reservation_time) / 60 - $bufferTime) AND (TIME_TO_SEC(reservation_time) / 60 + $bufferTime))
                 )";

        // Якщо це оновлення існуючої резервації
        if ($exclude_id) {
            $query .= " AND id != :exclude_id";
        }

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':table_id', $table_id);
        $stmt->bindParam(':date', $date);
        $stmt->bindParam(':start_time', $startTimeInMinutes);
        $stmt->bindParam(':end_time', $endTimeInMinutes);
        $stmt->bindParam(':time_in_minutes', $timeInMinutes);

        if ($exclude_id) {
            $stmt->bindParam(':exclude_id', $exclude_id);
        }

        $stmt->execute();

        $result = $stmt->fetch();

        // Столик доступний, якщо немає перетинів з іншими резерваціями
        return $result['reservation_count'] == 0;
    }

    /**
     * Конвертувати час у хвилини від початку дня
     */
    private function timeToMinutes($time)
    {
        list($hours, $minutes, $seconds) = explode(':', $time);
        return $hours * 60 + $minutes;
    }
}