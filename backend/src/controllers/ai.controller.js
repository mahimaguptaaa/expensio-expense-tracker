// backend/src/controllers/ai.controller.js
const Groq = require('groq-sdk');
const prisma = require('../config/prisma');

const getGroq = () => {
  if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY not configured');
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
};

const MODEL = 'llama-3.3-70b-versatile'; // or 'mixtral-8x7b-32768', 'gemma2-9b-it'

const getUserFinancialContext = async (userId) => {
  const now = new Date();
  const [expenses, incomes, budgets, user] = await Promise.all([
    prisma.expense.findMany({
      where: { userId, date: { gte: new Date(now.getFullYear(), now.getMonth() - 2, 1) } },
      orderBy: { date: 'desc' },
    }),
    prisma.income.findMany({
      where: { userId, date: { gte: new Date(now.getFullYear(), now.getMonth() - 2, 1) } },
    }),
    prisma.budget.findMany({
      where: { userId, month: now.getMonth() + 1, year: now.getFullYear() },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { currency: true } }),
  ]);

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);
  const byCategory = {};
  expenses.forEach(e => { byCategory[e.category] = (byCategory[e.category] || 0) + e.amount; });
  const currency = user?.currency || 'USD';

  return {
    currency,
    context: `User Financial Summary (Last 3 months):
- Currency: ${currency} (ALWAYS use ${currency} symbol in your response, never use $ unless currency is USD)
- Total Expenses: ${totalExpenses.toFixed(2)} ${currency}
- Total Income: ${totalIncome.toFixed(2)} ${currency}
- Savings: ${(totalIncome - totalExpenses).toFixed(2)} ${currency}
- Transactions: ${expenses.length}
- By category: ${JSON.stringify(byCategory)}
- Budgets: ${JSON.stringify(budgets.map(b => ({ category: b.category, budget: b.amount })))}`,
  };
};

const chat = async (req, res, next) => {
  try {
    const { message, history = [] } = req.body;
    const groq = getGroq();
    const { currency, context: financialContext } = await getUserFinancialContext(req.user.id);

    const messages = [
      {
        role: 'system',
        content: `You are Expensio AI, a smart personal finance assistant. Be helpful, friendly, and concise (2-4 paragraphs max).
Here is the user's financial data:\n${financialContext}
IMPORTANT: The user's currency is ${currency}. Always use ${currency} when mentioning any monetary values. Never use a different currency symbol.`,
      },
      ...history.slice(-10).map(h => ({ role: h.role === 'assistant' ? 'assistant' : 'user', content: h.content })),
      { role: 'user', content: message },
    ];

    const completion = await groq.chat.completions.create({ model: MODEL, messages, max_tokens: 1024 });
    const response = completion.choices[0].message.content;

    await prisma.$transaction([
      prisma.chatMessage.create({ data: { userId: req.user.id, role: 'user', content: message } }),
      prisma.chatMessage.create({ data: { userId: req.user.id, role: 'assistant', content: response } }),
    ]);

    res.json({ response });
  } catch (error) {
    if (error.message === 'GROQ_API_KEY not configured') {
      return res.status(503).json({ error: 'AI service not configured. Add GROQ_API_KEY to your .env' });
    }
    next(error);
  }
};

const getChatHistory = async (req, res, next) => {
  try {
    const messages = await prisma.chatMessage.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });
    res.json({ messages });
  } catch (error) { next(error); }
};

const clearChatHistory = async (req, res, next) => {
  try {
    await prisma.chatMessage.deleteMany({ where: { userId: req.user.id } });
    res.json({ message: 'Chat history cleared' });
  } catch (error) { next(error); }
};

const getGroupInsights = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const isMember = await prisma.groupMember.findFirst({ where: { groupId, userId: req.user.id } });
    if (!isMember) return res.status(403).json({ error: 'Not a member' });

    const [group, expenses] = await Promise.all([
      prisma.group.findUnique({ where: { id: groupId }, include: { members: { include: { user: { select: { id: true, name: true } } } } } }),
      prisma.groupExpense.findMany({ where: { groupId }, include: { paidBy: { select: { id: true, name: true } } }, orderBy: { date: 'desc' } }),
    ]);

    if (!expenses.length) return res.json({ insights: 'No expenses yet. Add some to get AI insights!' });

    const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
    const byPayer = {};
    expenses.forEach(e => { byPayer[e.paidBy.name] = (byPayer[e.paidBy.name] || 0) + e.amount; });

    const groq = getGroq();
    const completion = await groq.chat.completions.create({
      model: MODEL,
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: `Analyze this group expense data and give 3-5 bullet point insights:
Group: ${group.name}, Members: ${group.members.map(m => m.user.name).join(', ')}
Total spent: $${totalSpent.toFixed(2)}, By payer: ${JSON.stringify(byPayer)}
Recent: ${JSON.stringify(expenses.slice(0, 8).map(e => ({ title: e.title, amount: e.amount, paidBy: e.paidBy.name })))}
Be concise and specific.`,
      }],
    });

    res.json({ insights: completion.choices[0].message.content });
  } catch (error) {
    if (error.message === 'GROQ_API_KEY not configured') return res.status(503).json({ error: 'AI service not configured.' });
    next(error);
  }
};

const scanReceipt = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image provided' });

    const Tesseract = require('tesseract.js');
    const { data: { text } } = await Tesseract.recognize(req.file.path, 'eng');

    const groq = getGroq();
    const completion = await groq.chat.completions.create({
      model: MODEL,
      max_tokens: 256,
      messages: [{
        role: 'user',
        content: `Extract expense info from this receipt and return ONLY valid JSON with fields: {"title":"merchant name","amount":number,"date":"YYYY-MM-DD","category":"category"}. Use null for missing fields. Receipt text: ${text}`,
      }],
    });

    let responseText = completion.choices[0].message.content.trim().replace(/```json\n?|\n?```/g, '').trim();
    let extracted;
    try { extracted = JSON.parse(responseText); }
    catch { extracted = { title: 'Receipt', amount: null, date: new Date().toISOString().split('T')[0], category: 'Other' }; }

    const fs = require('fs');
    if (req.file.path) fs.unlink(req.file.path, () => {});

    res.json({ extracted, rawText: text });
  } catch (error) { next(error); }
};

module.exports = { chat, getChatHistory, clearChatHistory, getGroupInsights, scanReceipt };
