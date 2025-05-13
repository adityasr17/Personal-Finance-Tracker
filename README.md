# 💰 Personal Finance Tracker

A full-stack web application to help users track their income, expenses, subscriptions, and monthly budgets. Built with Node.js, Express, MySQL, and a static HTML/CSS/JS frontend.

---

## 📁 Project Structure
personal-finance-tracker/
├── frontend/
│ ├── index.html
│ ├── css/
│ └── js/
│
├── backend/
│ ├── controllers/
│ ├── routes/
│ ├── models/
│ ├── config/
│ ├── middleware/
│ ├── server.js
│ └── .env
│
├── .gitignore
├── README.md
├── package.json

## 🚀 Features

- ✅ User authentication (register/login)
- 📊 Add & view transactions (income & expenses)
- 📅 Manage recurring subscriptions (e.g., rent, Netflix)
- 💡 Set and track monthly budgets
- 📉 Track financial health over time

---

## 🛠️ Tech Stack

**Frontend**
- HTML, CSS, JavaScript (Vanilla)

**Backend**
- Node.js
- Express.js
- MySQL
- JWT for auth
- bcrypt for password hashing

---

## 🗄️ Database Schema

### 1. `user`
| Column         | Type         | Description         |
|----------------|--------------|---------------------|
| user_id        | INT (PK)     | Unique user ID      |
| username       | VARCHAR      | User’s name         |
| password       | VARCHAR      | Hashed password     |
| email          | VARCHAR      | User’s email        |
| phone_number   | VARCHAR      | User’s phone number |
| created_at     | TIMESTAMP    | Account creation    |

### 2. `transaction`
| Column     | Type          | Description                        |
|------------|---------------|------------------------------------|
| trans_id   | INT (PK)      | Unique transaction ID              |
| user_id    | INT (FK)      | Belongs to user                    |
| category   | VARCHAR       | Category of transaction            |
| timestamp  | DATETIME      | When the transaction happened      |
| amount     | DECIMAL       | Amount                             |
| type       | ENUM          | 'positive' or 'negative'           |

### 3. `subscription`
| Column         | Type       | Description                      |
|----------------|------------|----------------------------------|
| sub_id         | INT (PK)   | Unique subscription ID           |
| user_id        | INT (FK)   | Belongs to user                  |
| name           | VARCHAR    | Name of subscription (e.g., Rent)|
| amount         | DECIMAL    | Amount paid                      |
| frequency      | ENUM       | daily/weekly/monthly/yearly      |
| start_timestamp| DATETIME   | When it started                  |

### 4. `budget`
| Column     | Type        | Description                   |
|------------|-------------|-------------------------------|
| budget_id  | INT (PK)    | Unique budget ID              |
| user_id    | INT (FK)    | Belongs to user               |
| month      | VARCHAR     | Format: MM-YYYY               |
| amount     | DECIMAL     | Budget amount for the month   |
