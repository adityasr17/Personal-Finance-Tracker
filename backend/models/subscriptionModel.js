const db = require('../config/db');

const getAllSubscriptions = (userId, callback) => {
  db.query('SELECT * FROM subscription WHERE user_id = ?', [userId], callback);
};

const getSubscriptionById = (subId, userId, callback) => {
  db.query('SELECT * FROM subscription WHERE sub_id = ? AND user_id = ?', [subId, userId], callback);
};

const createSubscription = (subscription, callback) => {
  db.query('INSERT INTO subscription SET ?', subscription, callback);
};

const updateSubscription = (subId, userId, data, callback) => {
  db.query('UPDATE subscription SET ? WHERE sub_id = ? AND user_id = ?', [data, subId, userId], callback);
};

const deleteSubscription = (subId, userId, callback) => {
  db.query('DELETE FROM subscription WHERE sub_id = ? AND user_id = ?', [subId, userId], callback);
};

module.exports = {
  getAllSubscriptions,
  getSubscriptionById,
  createSubscription,
  updateSubscription,
  deleteSubscription
};
