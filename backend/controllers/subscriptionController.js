const Subscription = require('../models/subscriptionModel');

exports.getAll = (req, res) => {
  Subscription.getAllSubscriptions(req.user.id, (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', err });
    res.json(results);
  });
};

exports.getById = (req, res) => {
  const { id } = req.params;

  Subscription.getSubscriptionById(id, req.user.id, (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', err });
    if (results.length === 0) return res.status(404).json({ message: 'Subscription not found' });
    res.json(results[0]);
  });
};

exports.create = (req, res) => {
  const { name, amount, frequency } = req.body;

  const newSubscription = {
    user_id: req.user.id,
    name,
    amount,
    frequency,
    start_timestamp: new Date()
  };

  Subscription.createSubscription(newSubscription, (err, result) => {
    if (err) return res.status(500).json({ message: 'Database error', err });
    res.status(201).json({ message: 'Subscription created', sub_id: result.insertId });
  });
};

exports.update = (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;

  Subscription.updateSubscription(id, req.user.id, updatedData, (err, result) => {
    if (err) return res.status(500).json({ message: 'Database error', err });
    res.json({ message: 'Subscription updated' });
  });
};

exports.delete = (req, res) => {
  const { id } = req.params;

  Subscription.deleteSubscription(id, req.user.id, (err, result) => {
    if (err) return res.status(500).json({ message: 'Database error', err });
    res.json({ message: 'Subscription deleted' });
  });
};
