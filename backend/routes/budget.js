const express = require('express');
const router = express.Router();
const controller = require('../controllers/budgetController');
const verifyToken = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

module.exports = router;
