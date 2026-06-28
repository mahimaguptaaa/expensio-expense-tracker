const express = require('express');
const { body } = require('express-validator');
const { getBudgets, createBudget, updateBudget, deleteBudget } = require('../controllers/budget.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

const router = express.Router();
router.use(authenticate);

router.get('/', getBudgets);

router.post('/', [
  body('category').notEmpty().withMessage('Category is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Valid amount is required'),
  body('month').isInt({ min: 1, max: 12 }).withMessage('Valid month required'),
  body('year').isInt({ min: 2020 }).withMessage('Valid year required'),
], validate, createBudget);

router.put('/:id', [
  body('amount').isFloat({ min: 0.01 }).withMessage('Valid amount is required'),
], validate, updateBudget);

router.delete('/:id', deleteBudget);

module.exports = router;
