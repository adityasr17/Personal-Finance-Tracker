const express = require('express');
const app = express();
const db = require('./config/db');

require('dotenv').config();

app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/api/budgets', require('./routes/budgets'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
