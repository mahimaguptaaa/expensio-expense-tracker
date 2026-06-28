const express = require('express');
const { body } = require('express-validator');
const { createGroup, getGroups, getGroup, addMember, removeMember, addGroupExpense, getGroupBalances, settleUp, deleteGroup } = require('../controllers/group.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

const router = express.Router();
router.use(authenticate);

router.get('/', getGroups);
router.post('/', [body('name').trim().notEmpty().withMessage('Group name is required')], validate, createGroup);
router.get('/:id', getGroup);
router.delete('/:id', deleteGroup);
router.post('/:id/members', [body('email').isEmail().withMessage('Valid email required')], validate, addMember);
router.delete('/:id/members/:memberId', removeMember);
router.post('/:id/expenses', [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Valid amount is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
], validate, addGroupExpense);
router.get('/:id/balances', getGroupBalances);
router.post('/:id/settle', [
  body('toUserId').notEmpty().withMessage('Recipient required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Valid amount required'),
], validate, settleUp);

module.exports = router;
