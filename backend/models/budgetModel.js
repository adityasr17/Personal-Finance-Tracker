const db = require('../config/db');

const getAllBudgets = (userId, callback) => {
  db.query('SELECT * FROM budget WHERE user_id = ? ORDER BY month DESC', [userId], callback);
};

const getBudgetById = (budgetId, userId, callback) => {
  db.query('SELECT * FROM budget WHERE budget_id = ? AND user_id = ?', [budgetId, userId], callback);
};

const createBudget = (budget, callback) => {
  db.query('INSERT INTO budget SET ?', budget, callback);
};

const updateBudget = (budgetId, userId, data, callback) => {
  db.query('UPDATE budget SET ? WHERE budget_id = ? AND user_id = ?', [data, budgetId, userId], callback);
};

const deleteBudget = (budgetId, userId, callback) => {
  db.query('DELETE FROM budget WHERE budget_id = ? AND user_id = ?', [budgetId, userId], callback);
};

module.exports = {
  getAllBudgets,
  getBudgetById,
  createBudget,
  updateBudget,
  deleteBudget
};
