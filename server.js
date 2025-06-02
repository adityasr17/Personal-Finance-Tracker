const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'finance_tracker',
    connectionLimit: 10,
    acquireTimeout: 60000,
    timeout: 60000
};

// Create MySQL connection pool
const pool = mysql.createPool(dbConfig);

// Session store
const sessionStore = new MySQLStore({
    ...dbConfig,
    clearExpired: true,
    checkExpirationInterval: 900000,
    expiration: 86400000,
    createDatabaseTable: true,
    schema: {
        tableName: 'sessions',
        columnNames: {
            session_id: 'session_id',
            expires: 'expires',
            data: 'data'
        }
    }
});

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
    key: 'finance_tracker_session',
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 86400000, // 24 hours
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
    }
}));

// Authentication middleware
const authenticateUser = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    } else {
        return res.status(401).json({ error: 'Authentication required' });
    }
};

// Initialize database tables
async function initializeDatabase() {
    try {
        // Create users table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                email VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create transactions table
        await pool.execute(`
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

        // Create budgets table
        await pool.execute(`
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

        // Create default admin user if not exists
        const hashedPassword = await bcrypt.hash('password123', 10);
        await pool.execute(`
            INSERT IGNORE INTO users (username, password, email) 
            VALUES (?, ?, ?)
        `, ['admin', hashedPassword, 'admin@example.com']);

        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Database initialization error:', error);
    }
}

// Routes

// Authentication routes
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const [users] = await pool.execute(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = users[0];
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        req.session.userId = user.id;
        req.session.username = user.username;

        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Could not log out' });
        }
        res.json({ success: true });
    });
});

// Transaction routes
app.get('/api/transactions', authenticateUser, async (req, res) => {
    try {
        const [transactions] = await pool.execute(
            'SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC, created_at DESC',
            [req.session.userId]
        );

        res.json(transactions);
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/transactions', authenticateUser, async (req, res) => {
    try {
        const { amount, category, description, transaction_type, date } = req.body;

        if (!amount || !category || !transaction_type || !date) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const [result] = await pool.execute(`
            INSERT INTO transactions (user_id, amount, category, description, transaction_type, date)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [req.session.userId, amount, category, description || '', transaction_type, date]);

        const [newTransaction] = await pool.execute(
            'SELECT * FROM transactions WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json(newTransaction[0]);
    } catch (error) {
        console.error('Add transaction error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/transactions/:id', authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, category, description, transaction_type, date } = req.body;

        const [result] = await pool.execute(`
            UPDATE transactions 
            SET amount = ?, category = ?, description = ?, transaction_type = ?, date = ?
            WHERE id = ? AND user_id = ?
        `, [amount, category, description || '', transaction_type, date, id, req.session.userId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        const [updatedTransaction] = await pool.execute(
            'SELECT * FROM transactions WHERE id = ?',
            [id]
        );

        res.json(updatedTransaction[0]);
    } catch (error) {
        console.error('Update transaction error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.delete('/api/transactions/:id', authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await pool.execute(
            'DELETE FROM transactions WHERE id = ? AND user_id = ?',
            [id, req.session.userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Delete transaction error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Budget routes
app.get('/api/budgets', authenticateUser, async (req, res) => {
    try {
        const { month } = req.query;
        const currentMonth = month || new Date().toISOString().slice(0, 7);

        const [budgets] = await pool.execute(
            'SELECT * FROM budgets WHERE user_id = ? AND month = ?',
            [req.session.userId, currentMonth]
        );

        res.json(budgets);
    } catch (error) {
        console.error('Get budgets error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/budgets', authenticateUser, async (req, res) => {
    try {
        const { category, amount, month } = req.body;
        const budgetMonth = month || new Date().toISOString().slice(0, 7);

        if (!category || !amount) {
            return res.status(400).json({ error: 'Category and amount are required' });
        }

        await pool.execute(`
            INSERT INTO budgets (user_id, category, amount, month)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE amount = VALUES(amount)
        `, [req.session.userId, category, amount, budgetMonth]);

        const [budgets] = await pool.execute(
            'SELECT * FROM budgets WHERE user_id = ? AND month = ?',
            [req.session.userId, budgetMonth]
        );

        res.json(budgets);
    } catch (error) {
        console.error('Save budget error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Dashboard statistics
app.get('/api/dashboard/stats', authenticateUser, async (req, res) => {
    try {
        const currentMonth = new Date().toISOString().slice(0, 7);

        // Get monthly income and expenses
        const [monthlyStats] = await pool.execute(`
            SELECT 
                transaction_type,
                SUM(amount) as total
            FROM transactions 
            WHERE user_id = ? AND DATE_FORMAT(date, '%Y-%m') = ?
            GROUP BY transaction_type
        `, [req.session.userId, currentMonth]);

        // Get category breakdown for expenses
        const [categoryStats] = await pool.execute(`
            SELECT 
                category,
                SUM(amount) as total
            FROM transactions 
            WHERE user_id = ? AND transaction_type = 'expense' AND DATE_FORMAT(date, '%Y-%m') = ?
            GROUP BY category
        `, [req.session.userId, currentMonth]);

        // Get current balance
        const [balanceResult] = await pool.execute(`
            SELECT 
                COALESCE(SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE 0 END), 0) -
                COALESCE(SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END), 0) as balance
            FROM transactions 
            WHERE user_id = ?
        `, [req.session.userId]);

        const income = monthlyStats.find(stat => stat.transaction_type === 'income')?.total || 0;
        const expenses = monthlyStats.find(stat => stat.transaction_type === 'expense')?.total || 0;
        const balance = balanceResult[0]?.balance || 0;

        res.json({
            income: parseFloat(income),
            expenses: parseFloat(expenses),
            balance: parseFloat(balance),
            categoryBreakdown: categoryStats.map(stat => ({
                category: stat.category,
                amount: parseFloat(stat.total)
            }))
        });
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Serve frontend files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
async function startServer() {
    try {
        await initializeDatabase();
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Frontend available at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();