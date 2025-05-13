const express = require('express');
const router = express.Router();
const controller = require('../controllers/transactionController');
const verifyToken = require('../middleware/authMiddleware');

router.use(verifyToken); // Protect all transaction routes

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

module.exports = router;
