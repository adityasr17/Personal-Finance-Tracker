# 🚀 Personal Finance Tracker Setup Guide

## Quick Start Guide

This guide will help you set up the complete personal finance tracker with Node.js backend and MySQL database.

## Prerequisites

Before you begin, make sure you have the following installed:

- **Node.js** (version 14 or higher)
- **MySQL** (version 5.7 or higher)
- **npm** (comes with Node.js)

## Step-by-Step Installation

### 1. Create Project Directory

```bash
mkdir personal-finance-tracker
cd personal-finance-tracker
```

### 2. Set Up Backend Files

Copy the following files into your project directory:
- `server.js` (main backend server)
- `package.json` (dependencies)
- `.env.example` (environment template)
- `init-database.js` (database setup script)
- `README.md` (documentation)

### 3. Install Dependencies

```bash
npm install
```

This will install all required packages:
- express (web framework)
- mysql2 (MySQL driver)
- bcrypt (password hashing)
- express-session (session management)
- express-mysql-session (MySQL session store)
- cors (cross-origin resource sharing)
- dotenv (environment variables)

### 4. Database Setup

#### Option A: Manual Database Creation
1. Open MySQL command line or MySQL Workbench
2. Create the database:
   ```sql
   CREATE DATABASE finance_tracker;
   ```

#### Option B: Automatic Setup (Recommended)
1. Configure your environment first (see step 5)
2. Run the initialization script:
   ```bash
   node init-database.js
   ```

### 5. Environment Configuration

1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file with your database credentials:
   ```env
   DB_HOST=localhost
   DB_USER=your_mysql_username
   DB_PASSWORD=your_mysql_password
   DB_NAME=finance_tracker
   SESSION_SECRET=your-super-secret-session-key-change-this-to-random-string
   PORT=3000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   ```

### 6. Frontend Setup

Create a `public` directory and add the frontend files:

```bash
mkdir public
```

Copy the following files into the `public` directory:
- `index.html` (main application interface)
- `style.css` (styles)
- `app.js` (frontend JavaScript)

### 7. Start the Application

```bash
# Development mode (with auto-restart)
npm run dev

# OR Production mode
npm start
```

### 8. Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

## Default Login Credentials

- **Username**: admin
- **Password**: password123

## Project Structure

After setup, your directory should look like this:

```
personal-finance-tracker/
├── server.js              # Main backend server
├── package.json           # Dependencies and scripts
├── .env                   # Environment variables (create this)
├── .env.example          # Environment template
├── init-database.js      # Database initialization script
├── README.md             # Documentation
├── SETUP.md              # This setup guide
├── node_modules/         # Dependencies (created by npm install)
└── public/               # Frontend files
    ├── index.html        # Main application interface
    ├── style.css         # Styles
    └── app.js            # Frontend JavaScript
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```
**Solution**: 
- Make sure MySQL is running
- Check your database credentials in `.env`
- Verify MySQL is listening on port 3306

#### 2. Authentication Failed
```
Error: Access denied for user 'root'@'localhost'
```
**Solution**:
- Check your MySQL username and password
- Make sure the user has permission to create databases

#### 3. Port Already in Use
```
Error: listen EADDRINUSE :::3000
```
**Solution**:
- Change the PORT in your `.env` file
- Or stop the process using port 3000

#### 4. Module Not Found
```
Error: Cannot find module 'mysql2'
```
**Solution**:
- Run `npm install` to install dependencies
- Make sure you're in the correct directory

### Database Reset

If you need to reset the database:

```sql
DROP DATABASE finance_tracker;
CREATE DATABASE finance_tracker;
```

Then run the initialization script again:
```bash
node init-database.js
```

## Features Overview

Once installed, you'll have access to:

✅ **User Authentication** - Secure login/logout
✅ **Transaction Management** - Add, edit, delete transactions  
✅ **Budget Planning** - Set monthly spending limits
✅ **Visual Analytics** - Pie charts for spending categories
✅ **Dashboard** - Financial overview and statistics
✅ **Responsive Design** - Works on desktop and mobile

## Next Steps

1. **Customize Categories**: Edit the categories in `app.js` to match your spending habits
2. **Add Users**: Create additional user accounts through the database
3. **Backup Data**: Set up regular database backups
4. **Security**: Change default passwords and session secrets
5. **Deployment**: Consider deploying to a cloud provider for remote access

## Support

If you encounter any issues:

1. Check the console for error messages
2. Verify all files are in the correct locations
3. Ensure MySQL is running and accessible
4. Check the network tab in browser developer tools for API errors

## Development

To add new features:

1. **Backend**: Modify `server.js` to add new API endpoints
2. **Frontend**: Update files in the `public` directory
3. **Database**: Add new tables or columns as needed

Happy tracking! 💰📊