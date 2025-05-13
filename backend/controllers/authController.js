const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getUserByEmail, createUser } = require('../models/userModel');

exports.register = (req, res) => {
  const { username, email, password, phone_number } = req.body;

  getUserByEmail(email, (err, results) => {
    if (results.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const newUser = {
      username,
      email,
      password: hashedPassword,
      phone_number,
      created_at: new Date()
    };

    createUser(newUser, (err, result) => {
      if (err) return res.status(500).json({ message: 'Database error', err });
      res.status(201).json({ message: 'User registered successfully' });
    });
  });
};

exports.login = (req, res) => {
  const { email, password } = req.body;

  getUserByEmail(email, (err, results) => {
    if (results.length === 0) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const user = results[0];
    const isMatch = bcrypt.compareSync(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.user_id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({ message: 'Login successful', token });
  });
};
