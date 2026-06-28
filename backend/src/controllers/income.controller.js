const prisma = require('../config/prisma');

const getIncomes = async (req, res, next) => {
  try {
    const { category, startDate, endDate, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = { userId: req.user.id };
    if (category) where.category = category;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const [incomes, total] = await Promise.all([
      prisma.income.findMany({ where, orderBy: { date: 'desc' }, skip, take: parseInt(limit) }),
      prisma.income.count({ where }),
    ]);

    res.json({ incomes, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    next(error);
  }
};

const createIncome = async (req, res, next) => {
  try {
    const { title, amount, category, date, notes } = req.body;
    const income = await prisma.income.create({
      data: { title, amount: parseFloat(amount), category, date: new Date(date), notes, userId: req.user.id },
    });
    res.status(201).json({ income });
  } catch (error) {
    next(error);
  }
};

const updateIncome = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.income.findFirst({ where: { id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ error: 'Income not found' });
    const income = await prisma.income.update({
      where: { id },
      data: { ...req.body, amount: parseFloat(req.body.amount), date: new Date(req.body.date) },
    });
    res.json({ income });
  } catch (error) {
    next(error);
  }
};

const deleteIncome = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.income.findFirst({ where: { id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ error: 'Income not found' });
    await prisma.income.delete({ where: { id } });
    res.json({ message: 'Income deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getIncomes, createIncome, updateIncome, deleteIncome };
