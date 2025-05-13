const mysql = require('mysql2');
const dotenv = require('dotenv');
dotenv.config();

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

db.connect(err => {
    if (err) throw err;
    console.log('MySQL Connected...');
});

module.exports = db;

// This code creates a connection to a MySQL database using the mysql2 package.
// It uses environment variables to get the database connection details.
// The connection is established when the module is loaded, and an error is thrown if the connection fails.
// The connection is exported for use in other parts of the application.
// The dotenv package is used to load environment variables from a .env file.



