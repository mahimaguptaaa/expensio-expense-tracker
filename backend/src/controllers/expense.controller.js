const prisma = require('../config/prisma');

const getExpenses = async (req, res, next) => {
  try {
    const { category, startDate, endDate, search, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { userId: req.user.id };
    if (category) where.category = category;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.expense.count({ where }),
    ]);

    res.json({ expenses, total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    next(error);
  }
};

const createExpense = async (req, res, next) => {
  try {
    const { title, amount, category, date, notes, receipt } = req.body;
    const expense = await prisma.expense.create({
      data: {
        title,
        amount: parseFloat(amount),
        category,
        date: new Date(date),
        notes,
        receipt,
        userId: req.user.id,
      },
    });
    res.status(201).json({ expense });
  } catch (error) {
    next(error);
  }
};

const updateExpense = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, amount, category, date, notes, receipt } = req.body;

    const existing = await prisma.expense.findFirst({ where: { id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ error: 'Expense not found' });

    const expense = await prisma.expense.update({
      where: { id },
      data: { title, amount: parseFloat(amount), category, date: new Date(date), notes, receipt },
    });
    res.json({ expense });
  } catch (error) {
    next(error);
  }
};

const deleteExpense = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.expense.findFirst({ where: { id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ error: 'Expense not found' });

    await prisma.expense.delete({ where: { id } });
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const getExpenseById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const expense = await prisma.expense.findFirst({ where: { id, userId: req.user.id } });
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    res.json({ expense });
  } catch (error) {
    next(error);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const categories = await prisma.expense.findMany({
      where: { userId: req.user.id },
      select: { category: true },
      distinct: ['category'],
    });
    const predefined = ['Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 'Healthcare', 'Utilities', 'Housing', 'Education', 'Travel', 'Personal Care', 'Subscriptions', 'Other'];
    const userCategories = categories.map(c => c.category);
    const allCategories = [...new Set([...predefined, ...userCategories])];
    res.json({ categories: allCategories });
  } catch (error) {
    next(error);
  }
};

module.exports = { getExpenses, createExpense, updateExpense, deleteExpense, getExpenseById, getCategories };
