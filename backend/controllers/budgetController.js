const Budget = require('../models/budgetModel');

exports.getAll = (req, res) => {
  Budget.getAllBudgets(req.user.id, (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', err });
    res.json(results);
  });
};

exports.getById = (req, res) => {
  const { id } = req.params;

  Budget.getBudgetById(id, req.user.id, (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', err });
    if (results.length === 0) return res.status(404).json({ message: 'Budget not found' });
    res.json(results[0]);
  });
};

exports.create = (req, res) => {
  const { month, amount } = req.body;

  const newBudget = {
    user_id: req.user.id,
    month,
    amount
  };

  Budget.createBudget(newBudget, (err, result) => {
    if (err) return res.status(500).json({ message: 'Database error', err });
    res.status(201).json({ message: 'Budget created', budget_id: result.insertId });
  });
};

exports.update = (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;

  Budget.updateBudget(id, req.user.id, updatedData, (err, result) => {
    if (err) return res.status(500).json({ message: 'Database error', err });
    res.json({ message: 'Budget updated' });
  });
};

exports.delete = (req, res) => {
  const { id } = req.params;

  Budget.deleteBudget(id, req.user.id, (err, result) => {
    if (err) return res.status(500).json({ message: 'Database error', err });
    res.json({ message: 'Budget deleted' });
  });
};
