const db = require('../config/db');

const getAllTransactions = (userId, callback) => {
  db.query('SELECT * FROM transaction WHERE user_id = ? ORDER BY timestamp DESC', [userId], callback);
};

const getTransactionById = (transId, userId, callback) => {
  db.query('SELECT * FROM transaction WHERE trans_id = ? AND user_id = ?', [transId, userId], callback);
};

const createTransaction = (transaction, callback) => {
  db.query('INSERT INTO transaction SET ?', transaction, callback);
};

const updateTransaction = (transId, userId, transaction, callback) => {
  db.query('UPDATE transaction SET ? WHERE trans_id = ? AND user_id = ?', [transaction, transId, userId], callback);
};

const deleteTransaction = (transId, userId, callback) => {
  db.query('DELETE FROM transaction WHERE trans_id = ? AND user_id = ?', [transId, userId], callback);
};

module.exports = {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction
};
