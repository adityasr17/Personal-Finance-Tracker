# Create the complete Node.js backend structure with MySQL integration
import os

# Create directory structure
backend_structure = {
    'server.js': '''const express = require('express');
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

startServer();''',

    'package.json': '''{
  "name": "personal-finance-tracker",
  "version": "1.0.0",
  "description": "A full-stack personal finance tracker with Node.js and MySQL",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "init-db": "node scripts/init-database.js"
  },
  "keywords": ["finance", "tracker", "nodejs", "mysql", "express"],
  "author": "Personal Finance Tracker",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2",
    "mysql2": "^3.6.5",
    "bcrypt": "^5.1.1",
    "express-session": "^1.17.3",
    "express-mysql-session": "^3.0.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  },
  "engines": {
    "node": ">=14.0.0"
  }
}''',

    '.env.example': '''# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=finance_tracker

# Session Configuration
SESSION_SECRET=your-super-secret-session-key-change-this

# Server Configuration
PORT=3000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000''',

    'README.md': '''# Personal Finance Tracker

A full-stack personal finance tracker built with Node.js, Express, and MySQL.

## Features

- **User Authentication**: Secure login/logout with session management
- **Transaction Management**: Add, edit, delete, and categorize financial transactions
- **Budget Planning**: Set monthly budgets for different expense categories
- **Visual Analytics**: Interactive pie charts showing spending distribution
- **Dashboard**: Real-time financial overview with balance calculations
- **Responsive Design**: Mobile-first design that works on all devices

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MySQL** - Database
- **mysql2** - MySQL driver with connection pooling
- **bcrypt** - Password hashing
- **express-session** - Session management
- **express-mysql-session** - MySQL session store

### Frontend
- **HTML5** - Markup
- **CSS3** - Styling with modern responsive design
- **JavaScript (ES6+)** - Client-side functionality
- **Chart.js** - Data visualization

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd personal-finance-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Database Setup**
   
   Create a MySQL database:
   ```sql
   CREATE DATABASE finance_tracker;
   ```

4. **Environment Configuration**
   
   Copy the environment template:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your database credentials:
   ```
   DB_HOST=localhost
   DB_USER=your_username
   DB_PASSWORD=your_password
   DB_NAME=finance_tracker
   SESSION_SECRET=your-super-secret-session-key
   ```

5. **Start the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

6. **Access the application**
   
   Open your browser and navigate to `http://localhost:3000`

## Database Schema

The application automatically creates the following tables:

### Users Table
```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Transactions Table
```sql
CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    transaction_type ENUM('income', 'expense') NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Budgets Table
```sql
CREATE TABLE budgets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    month CHAR(7) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_category_month (user_id, category, month),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Transactions
- `GET /api/transactions` - Get all user transactions
- `POST /api/transactions` - Add new transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Budgets
- `GET /api/budgets` - Get user budgets for current/specified month
- `POST /api/budgets` - Create or update budget

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

## Default Credentials

The application creates a default admin user:
- **Username**: admin
- **Password**: password123

## Security Features

- **Password Hashing**: Uses bcrypt with salt rounds
- **Session Management**: Secure session-based authentication
- **SQL Injection Prevention**: Parameterized queries
- **CORS Protection**: Configurable cross-origin resource sharing
- **Input Validation**: Server-side validation for all inputs

## Development

### File Structure
```
personal-finance-tracker/
├── server.js              # Main server file
├── package.json           # Dependencies and scripts
├── .env.example          # Environment variables template
├── .env                  # Environment variables (create this)
├── README.md             # This file
└── public/               # Static frontend files
    ├── index.html        # Main HTML file
    ├── style.css         # Styles
    └── app.js            # Frontend JavaScript
```

### Adding New Features

1. **Database Changes**: Modify the table creation queries in `server.js`
2. **API Endpoints**: Add new routes in the appropriate sections
3. **Frontend**: Update the HTML, CSS, and JavaScript files in the `public` directory

## Production Deployment

1. **Environment Variables**: Set `NODE_ENV=production`
2. **Database**: Use a production MySQL instance
3. **Security**: Use strong session secrets and HTTPS
4. **Process Management**: Use PM2 or similar for process management

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details
''',

    'scripts/init-database.js': '''const mysql = require('mysql2/promise');
require('dotenv').config();

async function initializeDatabase() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || ''
        });

        // Create database if it doesn't exist
        await connection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'finance_tracker'}`);
        console.log('Database created successfully');

        await connection.end();
    } catch (error) {
        console.error('Database initialization error:', error);
        process.exit(1);
    }
}

initializeDatabase();'''
}

# Write all files
for filename, content in backend_structure.items():
    # Create directories if they don't exist
    directory = os.path.dirname(filename)
    if directory:
        os.makedirs(directory, exist_ok=True)
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Created: {filename}")

# Create public directory structure for frontend files
os.makedirs('public', exist_ok=True)

print("\n✅ Complete Node.js backend structure created!")
print("\nNext steps:")
print("1. Run 'npm install' to install dependencies")
print("2. Setup MySQL database and configure .env file")
print("3. Run 'npm start' to start the server")
print("4. Copy the frontend files (HTML, CSS, JS) to the 'public' directory")