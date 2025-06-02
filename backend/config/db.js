// config/db.js

require('dotenv').config();
const mysql = require("mysql2/promise");

// Пул підключень до бази даних
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'restaurant_management_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4'
});

// Тест підключення
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Підключення до БД успішне');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Помилка підключення:', error.message);
        return false;
    }
}

// Закриття пулу при завершенні програми
process.on('SIGTERM', async () => {
    await pool.end();
    process.exit(0);
});

module.exports = {
    pool,
    testConnection
};