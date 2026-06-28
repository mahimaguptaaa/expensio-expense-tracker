const express = require('express');
const { body } = require('express-validator');
const { getExpenses, createExpense, updateExpense, deleteExpense, getExpenseById, getCategories } = require('../controllers/expense.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

const router = express.Router();
router.use(authenticate);

router.get('/', getExpenses);
router.get('/categories', getCategories);
router.get('/:id', getExpenseById);

router.post('/', [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Valid amount is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
], validate, createExpense);

router.put('/:id', [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Valid amount is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
], validate, updateExpense);

router.delete('/:id', deleteExpense);

module.exports = router;
