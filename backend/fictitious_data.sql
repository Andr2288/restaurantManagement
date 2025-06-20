-- Очищення існуючих даних
SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM feedback;
DELETE FROM reservations;
DELETE FROM order_details;
DELETE FROM orders;
DELETE FROM menu_items;
DELETE FROM tables;
DELETE FROM employees;

SET FOREIGN_KEY_CHECKS = 1;

-- Скидання автоінкременту
ALTER TABLE feedback AUTO_INCREMENT = 1;
ALTER TABLE reservations AUTO_INCREMENT = 1;
ALTER TABLE order_details AUTO_INCREMENT = 1;
ALTER TABLE orders AUTO_INCREMENT = 1;
ALTER TABLE menu_items AUTO_INCREMENT = 1;
ALTER TABLE tables AUTO_INCREMENT = 1;
ALTER TABLE employees AUTO_INCREMENT = 1;

-- Додавання працівників
INSERT INTO employees (first_name, last_name, position, phone, email, hire_date, salary) VALUES
                                                                                             ('Марія', 'Іваненко', 'Менеджер', '+380501234567', 'maria@restaurant.com', '2024-01-15', 25000.00),
                                                                                             ('Олександр', 'Петренко', 'Кухар', '+380672345678', 'oleksandr@restaurant.com', '2024-02-01', 18000.00),
                                                                                             ('Анна', 'Коваленко', 'Офіціант', '+380634567890', 'anna@restaurant.com', '2024-02-15', 12000.00),
                                                                                             ('Дмитро', 'Шевченко', 'Бармен', '+380501112233', 'dmytro@restaurant.com', '2024-03-01', 14000.00),
                                                                                             ('Катерина', 'Мельник', 'Офіціант', '+380672223344', 'kateryna@restaurant.com', '2024-03-15', 12000.00);

-- Додавання столиків
INSERT INTO tables (table_number, capacity, location) VALUES
                                                          (1, 2, 'Біля вікна'),
                                                          (2, 2, 'Біля вікна'),
                                                          (3, 4, 'Центр залу'),
                                                          (4, 4, 'Центр залу'),
                                                          (5, 6, 'Великий зал'),
                                                          (6, 6, 'Великий зал'),
                                                          (7, 8, 'Приватна зона'),
                                                          (8, 2, 'Біля бару');

-- Додавання страв у меню
INSERT INTO menu_items (name, category, description, price, cooking_time) VALUES
-- Салати
('Цезар з куркою', 'Салати', 'Класичний салат з курячим філе, пармезаном та соусом цезар', 185.00, 10),
('Грецький салат', 'Салати', 'Традиційний салат з фетою, оливками та овочами', 145.00, 8),

-- Супи
('Борщ український', 'Супи', 'Традиційний борщ зі сметаною', 95.00, 25),
('Крем-суп з грибів', 'Супи', 'Ніжний крем-суп з лісових грибів', 110.00, 20),

-- Основні страви
('Стейк Рібай', 'Основні страви', 'Соковитий стейк з яловичини 250г', 485.00, 15),
('Сьомга на грилі', 'Основні страви', 'Філе сьомги з овочами на грилі 200г', 345.00, 20),
('Паста Карбонара', 'Основні страви', 'Класична італійська паста з беконом', 195.00, 15),

-- Гарніри
('Картопля фрі', 'Гарніри', 'Хрустка картопля фрі', 65.00, 10),
('Овочі гриль', 'Гарніри', 'Мікс овочів на грилі', 85.00, 15),

-- Десерти
('Тірамісу', 'Десерти', 'Класичний італійський десерт', 125.00, 5),
('Чізкейк', 'Десерти', 'Ніжний сирний торт з ягідним соусом', 115.00, 5),

-- Напої
('Еспресо', 'Напої', 'Класичний італійський еспресо', 35.00, 3),
('Капучино', 'Напої', 'Еспресо з молочною піною', 55.00, 5),
('Апельсиновий сік', 'Напої', 'Свіжевичавлений апельсиновий сік', 75.00, 3),

-- Алкоголь
('Вино червоне', 'Алкоголь', 'Каберне Совіньйон (келих)', 95.00, 2),
('Пиво світле', 'Алкоголь', 'Свіже розливне пиво 0.5л', 65.00, 2);

-- Додавання замовлень
INSERT INTO orders (table_id, employee_id, order_date, order_time, total_amount, status, payment_method) VALUES
                                                                                                             (1, 3, '2025-06-01', '12:30:00', 380.00, 'Оплачено', 'Картка'),
                                                                                                             (3, 3, '2025-06-01', '13:15:00', 590.00, 'Оплачено', 'Готівка'),
                                                                                                             (5, 5, '2025-06-01', '19:20:00', 820.00, 'Подано', 'Картка'),
                                                                                                             (2, 3, '2025-06-02', '12:00:00', 285.00, 'Готується', NULL);

-- Додавання деталей замовлень
INSERT INTO order_details (order_id, menu_item_id, quantity, unit_price, subtotal) VALUES
-- Замовлення 1
(1, 1, 1, 185.00, 185.00),
(1, 7, 1, 195.00, 195.00),

-- Замовлення 2
(2, 5, 1, 485.00, 485.00),
(2, 13, 1, 55.00, 55.00),
(2, 15, 1, 95.00, 95.00),

-- Замовлення 3
(3, 6, 2, 345.00, 690.00),
(3, 8, 2, 65.00, 130.00),

-- Замовлення 4 (поточне)
(4, 2, 1, 145.00, 145.00),
(4, 3, 1, 95.00, 95.00),
(4, 13, 1, 55.00, 55.00);

-- Додавання резервацій
INSERT INTO reservations (customer_name, customer_phone, reservation_date, reservation_time, table_id, number_of_guests, notes, status) VALUES
                                                                                                                                            ('Іван Петров', '+380501234567', '2025-06-03', '19:00:00', 7, 6, 'День народження, потрібен торт', 'Підтверджено'),
                                                                                                                                            ('Марія Коваль', '+380672345678', '2025-06-03', '20:30:00', 4, 2, 'Романтична вечеря', 'Підтверджено'),
                                                                                                                                            ('Олексій Шевченко', '+380633456789', '2025-06-04', '18:00:00', 5, 4, '', 'Підтверджено'),
                                                                                                                                            ('Тетяна Мельник', '+380504567890', '2025-06-05', '19:30:00', 6, 5, 'Святкування ювілею', 'Підтверджено');

-- Додавання відгуків
INSERT INTO feedback (customer_name, order_id, rating, comments, feedback_date, is_published) VALUES
    ('Андрій Коваленко', 1, 5, 'Чудова їжа і сервіс! Цезар був просто неймовірний. Обов\'язково повернемось!', '2025-06-01', TRUE),
('Олена Петренко', 2, 4, 'Стейк приготований ідеально. Трохи довго чекали, але воно того варте.', '2025-06-01', TRUE),
('Дмитро Іваненко', NULL, 3, 'Середньо. Очікував більше за такі ціни.', '2025-06-01', FALSE),
('Юлія Ткачук', 3, 5, 'Все було бездоганно! Сьомга просто тане в роті. Атмосфера чудова.', '2025-06-01', TRUE);