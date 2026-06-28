const express = require('express');
const { body } = require('express-validator');
const { getIncomes, createIncome, updateIncome, deleteIncome } = require('../controllers/income.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

const router = express.Router();
router.use(authenticate);

router.get('/', getIncomes);

router.post('/', [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Valid amount is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
], validate, createIncome);

router.put('/:id', [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Valid amount is required'),
], validate, updateIncome);

router.delete('/:id', deleteIncome);

module.exports = router;
