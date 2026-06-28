const prisma = require('../config/prisma');

const getBudgets = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const now = new Date();
    const targetMonth = month ? parseInt(month) : now.getMonth() + 1;
    const targetYear = year ? parseInt(year) : now.getFullYear();

    const budgets = await prisma.budget.findMany({
      where: { userId: req.user.id, month: targetMonth, year: targetYear },
    });

    const expensesByCategory = await prisma.expense.groupBy({
      by: ['category'],
      where: {
        userId: req.user.id,
        date: {
          gte: new Date(targetYear, targetMonth - 1, 1),
          lt: new Date(targetYear, targetMonth, 1),
        },
      },
      _sum: { amount: true },
    });

    const expenseMap = {};
    expensesByCategory.forEach(e => { expenseMap[e.category] = e._sum.amount || 0; });

    const budgetsWithSpending = budgets.map(b => ({
      ...b,
      spent: expenseMap[b.category] || 0,
      remaining: b.amount - (expenseMap[b.category] || 0),
      percentage: ((expenseMap[b.category] || 0) / b.amount) * 100,
    }));

    res.json({ budgets: budgetsWithSpending, month: targetMonth, year: targetYear });
  } catch (error) {
    next(error);
  }
};

const createBudget = async (req, res, next) => {
  try {
    const { category, amount, month, year } = req.body;
    const budget = await prisma.budget.upsert({
      where: { userId_category_month_year: { userId: req.user.id, category, month: parseInt(month), year: parseInt(year) } },
      update: { amount: parseFloat(amount) },
      create: { category, amount: parseFloat(amount), month: parseInt(month), year: parseInt(year), userId: req.user.id },
    });
    res.status(201).json({ budget });
  } catch (error) {
    next(error);
  }
};

const updateBudget = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.budget.findFirst({ where: { id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ error: 'Budget not found' });
    const budget = await prisma.budget.update({
      where: { id },
      data: { amount: parseFloat(req.body.amount) },
    });
    res.json({ budget });
  } catch (error) {
    next(error);
  }
};

const deleteBudget = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.budget.findFirst({ where: { id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ error: 'Budget not found' });
    await prisma.budget.delete({ where: { id } });
    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getBudgets, createBudget, updateBudget, deleteBudget };
