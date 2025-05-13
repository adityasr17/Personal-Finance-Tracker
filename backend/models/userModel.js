const db = require('../config/db');

const getUserByEmail = (email, callback) => {
  db.query('SELECT * FROM user WHERE email = ?', [email], callback);
};

const createUser = (user, callback) => {
  db.query('INSERT INTO user SET ?', user, callback);
};

module.exports = { getUserByEmail, createUser };
