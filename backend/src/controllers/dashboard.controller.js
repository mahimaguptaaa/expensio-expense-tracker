const prisma = require('../config/prisma');

const getDashboard = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const now = new Date();
    const targetMonth = month ? parseInt(month) : now.getMonth() + 1;
    const targetYear = year ? parseInt(year) : now.getFullYear();

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 1);

    const [totalExpenses, totalIncome, expensesByCategory, monthlyTrend, recentExpenses, budgets] = await Promise.all([
      prisma.expense.aggregate({
        where: { userId: req.user.id, date: { gte: startDate, lt: endDate } },
        _sum: { amount: true },
      }),
      prisma.income.aggregate({
        where: { userId: req.user.id, date: { gte: startDate, lt: endDate } },
        _sum: { amount: true },
      }),
      prisma.expense.groupBy({
        by: ['category'],
        where: { userId: req.user.id, date: { gte: startDate, lt: endDate } },
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
      }),
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', date) as month,
          SUM(amount) as total
        FROM "Expense"
        WHERE "userId" = ${req.user.id}
          AND date >= ${new Date(targetYear - 1, targetMonth - 1, 1)}
          AND date < ${endDate}
        GROUP BY DATE_TRUNC('month', date)
        ORDER BY month ASC
        LIMIT 12
      `,
      prisma.expense.findMany({
        where: { userId: req.user.id },
        orderBy: { date: 'desc' },
        take: 5,
      }),
      prisma.budget.findMany({
        where: { userId: req.user.id, month: targetMonth, year: targetYear },
      }),
    ]);

    const totalSpent = totalExpenses._sum.amount || 0;
    const totalEarned = totalIncome._sum.amount || 0;
    const savings = totalEarned - totalSpent;

    res.json({
      summary: {
        totalExpenses: totalSpent,
        totalIncome: totalEarned,
        savings,
        savingsRate: totalEarned > 0 ? ((savings / totalEarned) * 100).toFixed(1) : 0,
      },
      expensesByCategory: expensesByCategory.map(e => ({
        category: e.category,
        total: e._sum.amount || 0,
      })),
      monthlyTrend: monthlyTrend.map(m => ({
        month: m.month,
        total: parseFloat(m.total) || 0,
      })),
      recentExpenses,
      budgets,
      month: targetMonth,
      year: targetYear,
    });
  } catch (error) {
    next(error);
  }
};

const getMonthlyReport = async (req, res, next) => {
  try {
    const { month, year } = req.params;
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 1);

    const [expenses, incomes, byCategory] = await Promise.all([
      prisma.expense.findMany({
        where: { userId: req.user.id, date: { gte: startDate, lt: endDate } },
        orderBy: { date: 'desc' },
      }),
      prisma.income.findMany({
        where: { userId: req.user.id, date: { gte: startDate, lt: endDate } },
        orderBy: { date: 'desc' },
      }),
      prisma.expense.groupBy({
        by: ['category'],
        where: { userId: req.user.id, date: { gte: startDate, lt: endDate } },
        _sum: { amount: true },
        _count: true,
        orderBy: { _sum: { amount: 'desc' } },
      }),
    ]);

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);

    res.json({
      expenses,
      incomes,
      byCategory: byCategory.map(c => ({
        category: c.category,
        total: c._sum.amount || 0,
        count: c._count,
        percentage: totalExpenses > 0 ? ((c._sum.amount || 0) / totalExpenses * 100).toFixed(1) : 0,
      })),
      summary: { totalExpenses, totalIncome, savings: totalIncome - totalExpenses },
      month: parseInt(month),
      year: parseInt(year),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboard, getMonthlyReport };
