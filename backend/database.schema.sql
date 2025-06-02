-- Створення бази даних ресторану
CREATE DATABASE IF NOT EXISTS restaurant_management_db;
USE restaurant_management_db;

-- Таблиця працівників
CREATE TABLE IF NOT EXISTS employees (
                                         id INT AUTO_INCREMENT PRIMARY KEY,
                                         first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    position ENUM('Офіціант', 'Кухар', 'Бармен', 'Менеджер', 'Адміністратор') NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100) UNIQUE,
    hire_date DATE NOT NULL,
    salary DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- Таблиця столиків
CREATE TABLE IF NOT EXISTS tables (
                                      id INT AUTO_INCREMENT PRIMARY KEY,
                                      table_number INT NOT NULL UNIQUE,
                                      capacity INT NOT NULL,
                                      location VARCHAR(50),
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- Таблиця меню
CREATE TABLE IF NOT EXISTS menu_items (
                                          id INT AUTO_INCREMENT PRIMARY KEY,
                                          name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    cooking_time INT DEFAULT 0 COMMENT 'Час приготування у хвилинах',
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- Таблиця замовлень
CREATE TABLE IF NOT EXISTS orders (
                                      id INT AUTO_INCREMENT PRIMARY KEY,
                                      table_id INT NOT NULL,
                                      employee_id INT NOT NULL,
                                      order_date DATE NOT NULL,
                                      order_time TIME NOT NULL,
                                      total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    status ENUM('Нове', 'Готується', 'Готове', 'Подано', 'Оплачено', 'Скасовано') NOT NULL DEFAULT 'Нове',
    payment_method ENUM('Готівка', 'Картка', 'Безконтактно') DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE RESTRICT,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE RESTRICT
    );

-- Таблиця деталей замовлення
CREATE TABLE IF NOT EXISTS order_details (
                                             id INT AUTO_INCREMENT PRIMARY KEY,
                                             order_id INT NOT NULL,
                                             menu_item_id INT NOT NULL,
                                             quantity INT NOT NULL DEFAULT 1,
                                             unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE RESTRICT
    );

-- Таблиця резервацій
CREATE TABLE IF NOT EXISTS reservations (
                                            id INT AUTO_INCREMENT PRIMARY KEY,
                                            customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20),
    reservation_date DATE NOT NULL,
    reservation_time TIME NOT NULL,
    table_id INT NOT NULL,
    number_of_guests INT NOT NULL,
    notes TEXT,
    status ENUM('Підтверджено', 'Прибули', 'Не з\'явились', 'Скасовано') NOT NULL DEFAULT 'Підтверджено',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE RESTRICT
);

-- Таблиця відгуків
CREATE TABLE IF NOT EXISTS feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(100),
    order_id INT DEFAULT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comments TEXT,
    feedback_date DATE NOT NULL,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
);

-- Індекси для швидкості
CREATE INDEX idx_orders_date ON orders(order_date);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_reservations_date ON reservations(reservation_date);
CREATE INDEX idx_feedback_rating ON feedback(rating);