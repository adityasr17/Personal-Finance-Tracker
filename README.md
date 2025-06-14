# Personal Finance Tracker

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

MIT License - see LICENSE file for details#   P e r s o n a l - F i n a n c e - T r a c k e r  
 