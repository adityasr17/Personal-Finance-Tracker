const mysql = require('mysql2/promise');
require('dotenv').config();

async function initializeDatabase() {
    try {
        // First connect without specifying database to create it
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || ''
        });

        // Create database if it doesn't exist
        const dbName = process.env.DB_NAME || 'finance_tracker';
        await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
        console.log(`✅ Database '${dbName}' created successfully`);

        // Use the database
        await connection.execute(`USE ${dbName}`);

        // Create users table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                email VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Users table created');

        // Create transactions table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS transactions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                category VARCHAR(50) NOT NULL,
                description VARCHAR(255),
                transaction_type ENUM('income', 'expense') NOT NULL,
                date DATE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ Transactions table created');

        // Create budgets table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS budgets (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                category VARCHAR(50) NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                month CHAR(7) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_user_category_month (user_id, category, month),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ Budgets table created');

        // Create sessions table for express-mysql-session
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS sessions (
                session_id VARCHAR(128) COLLATE utf8mb4_bin NOT NULL,
                expires INT(11) UNSIGNED NOT NULL,
                data MEDIUMTEXT COLLATE utf8mb4_bin,
                PRIMARY KEY (session_id)
            )
        `);
        console.log('✅ Sessions table created');

        await connection.end();
        console.log('🎉 Database initialization completed successfully!');
    } catch (error) {
        console.error('❌ Database initialization error:', error);
        process.exit(1);
    }
}

initializeDatabase();