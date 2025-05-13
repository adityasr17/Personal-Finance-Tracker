const Transaction = require('../models/transactionModel');

exports.getAll = (req, res) => {
  Transaction.getAllTransactions(req.user.id, (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', err });
    res.json(results);
  });
};

exports.getById = (req, res) => {
  const { id } = req.params;
  Transaction.getTransactionById(id, req.user.id, (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', err });
    if (results.length === 0) return res.status(404).json({ message: 'Transaction not found' });
    res.json(results[0]);
  });
};

exports.create = (req, res) => {
  const { category, amount, type } = req.body;

  const newTransaction = {
    user_id: req.user.id,
    category,
    amount,
    type,
    timestamp: new Date()
  };

  Transaction.createTransaction(newTransaction, (err, result) => {
    if (err) return res.status(500).json({ message: 'Database error', err });
    res.status(201).json({ message: 'Transaction added', trans_id: result.insertId });
  });
};

exports.update = (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;

  Transaction.updateTransaction(id, req.user.id, updatedData, (err, result) => {
    if (err) return res.status(500).json({ message: 'Database error', err });
    res.json({ message: 'Transaction updated' });
  });
};

exports.delete = (req, res) => {
  const { id } = req.params;

  Transaction.deleteTransaction(id, req.user.id, (err, result) => {
    if (err) return res.status(500).json({ message: 'Database error', err });
    res.json({ message: 'Transaction deleted' });
  });
};
