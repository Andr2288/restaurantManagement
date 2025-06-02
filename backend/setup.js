// setup.js
// Скрипт для створення бази даних ресторану

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Налаштування підключення
const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
    charset: 'utf8mb4'
};

async function setupDatabase() {
    let connection;

    try {
        console.log('🏪 Починаємо налаштування бази даних ресторану...');

        // Підключення до MySQL
        connection = await mysql.createConnection(config);
        console.log('✅ Підключено до MySQL');

        // Створення схеми
        console.log('🏗️ Створення схеми бази даних...');
        const schemaScript = fs.readFileSync('./database.schema.sql', 'utf8');
        await connection.query(schemaScript);
        console.log('✅ Схема створена');

        // Додавання тестових даних
        console.log('📋 Додавання тестових даних...');
        const dataScript = fs.readFileSync('./fictitious_data.sql', 'utf8');
        await connection.query(dataScript);
        console.log('✅ Дані додані');

        // Перевірка таблиць
        const [tables] = await connection.query('SHOW TABLES FROM restaurant_management_db');
        console.log('\n📊 Створені таблиці:');
        tables.forEach(table => {
            console.log(`   - ${Object.values(table)[0]}`);
        });

        console.log('\n🎉 База даних готова до роботи!');

    } catch (error) {
        console.error('❌ Помилка:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

setupDatabase();