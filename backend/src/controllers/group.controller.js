const prisma = require('../config/prisma');

const createGroup = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const group = await prisma.group.create({
      data: {
        name,
        description,
        createdBy: req.user.id,
        members: {
          create: { userId: req.user.id, role: 'admin' },
        },
      },
      include: { members: { include: { user: { select: { id: true, name: true, email: true, avatar: true } } } } },
    });
    res.status(201).json({ group });
  } catch (error) {
    next(error);
  }
};

const getGroups = async (req, res, next) => {
  try {
    const groups = await prisma.group.findMany({
      where: { members: { some: { userId: req.user.id } } },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true, avatar: true } } } },
        _count: { select: { expenses: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ groups });
  } catch (error) {
    next(error);
  }
};

const getGroup = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isMember = await prisma.groupMember.findFirst({ where: { groupId: id, userId: req.user.id } });
    if (!isMember) return res.status(403).json({ error: 'Not a member of this group' });

    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true, avatar: true } } } },
        expenses: {
          include: {
            paidBy: { select: { id: true, name: true, avatar: true } },
            splits: { include: { payer: { select: { id: true, name: true } }, debtor: { select: { id: true, name: true } } } },
          },
          orderBy: { date: 'desc' },
        },
        settlements: { include: { fromUser: { select: { id: true, name: true } }, toUser: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!group) return res.status(404).json({ error: 'Group not found' });
    res.json({ group });
  } catch (error) {
    next(error);
  }
};

const addMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email } = req.body;

    const isAdmin = await prisma.groupMember.findFirst({ where: { groupId: id, userId: req.user.id, role: 'admin' } });
    if (!isAdmin) return res.status(403).json({ error: 'Only admins can add members' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const existingMember = await prisma.groupMember.findFirst({ where: { groupId: id, userId: user.id } });
    if (existingMember) return res.status(409).json({ error: 'User is already a member' });

    const member = await prisma.groupMember.create({
      data: { groupId: id, userId: user.id },
      include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
    });
    res.status(201).json({ member });
  } catch (error) {
    next(error);
  }
};

const removeMember = async (req, res, next) => {
  try {
    const { id, memberId } = req.params;
    const isAdmin = await prisma.groupMember.findFirst({ where: { groupId: id, userId: req.user.id, role: 'admin' } });
    if (!isAdmin && memberId !== req.user.id) return res.status(403).json({ error: 'Permission denied' });
    await prisma.groupMember.deleteMany({ where: { groupId: id, userId: memberId } });
    res.json({ message: 'Member removed' });
  } catch (error) {
    next(error);
  }
};

const addGroupExpense = async (req, res, next) => {
  try {
    const { id: groupId } = req.params;
    const { title, amount, category, date, notes, splitType, splits } = req.body;

    const isMember = await prisma.groupMember.findFirst({ where: { groupId, userId: req.user.id } });
    if (!isMember) return res.status(403).json({ error: 'Not a member of this group' });

    const totalAmount = parseFloat(amount);
    const members = await prisma.groupMember.findMany({ where: { groupId }, select: { userId: true } });
    const memberIds = members.map(m => m.userId);

    let splitData = [];
    if (splitType === 'equal') {
      const share = totalAmount / memberIds.length;
      splitData = memberIds
        .filter(uid => uid !== req.user.id)
        .map(uid => ({ payerId: req.user.id, debtorId: uid, amount: share }));
    } else if (splitType === 'custom' && splits) {
      splitData = splits
        .filter(s => s.userId !== req.user.id)
        .map(s => ({ payerId: req.user.id, debtorId: s.userId, amount: parseFloat(s.amount) }));
    } else if (splitType === 'percentage' && splits) {
      splitData = splits
        .filter(s => s.userId !== req.user.id)
        .map(s => ({ payerId: req.user.id, debtorId: s.userId, amount: (totalAmount * s.percentage) / 100, percentage: s.percentage }));
    }

    const expense = await prisma.groupExpense.create({
      data: {
        title, amount: totalAmount, category: category || 'General', date: new Date(date), notes, splitType,
        groupId, paidById: req.user.id,
        splits: { create: splitData },
      },
      include: {
        paidBy: { select: { id: true, name: true, avatar: true } },
        splits: { include: { debtor: { select: { id: true, name: true } } } },
      },
    });
    res.status(201).json({ expense });
  } catch (error) {
    next(error);
  }
};

const getGroupBalances = async (req, res, next) => {
  try {
    const { id: groupId } = req.params;
    const isMember = await prisma.groupMember.findFirst({ where: { groupId, userId: req.user.id } });
    if (!isMember) return res.status(403).json({ error: 'Not a member' });

    const [members, splits, settlements] = await Promise.all([
      prisma.groupMember.findMany({ where: { groupId }, include: { user: { select: { id: true, name: true, avatar: true } } } }),
      prisma.groupExpenseSplit.findMany({
        where: { expense: { groupId }, settled: false },
        include: { payer: { select: { id: true, name: true } }, debtor: { select: { id: true, name: true } } },
      }),
      prisma.settlement.findMany({ where: { groupId }, orderBy: { createdAt: 'desc' }, take: 10, include: { fromUser: { select: { id: true, name: true } }, toUser: { select: { id: true, name: true } } } }),
    ]);

    const balances = {};
    members.forEach(m => { balances[m.userId] = { user: m.user, owes: {}, owed: {} }; });

    splits.forEach(split => {
      if (!balances[split.debtorId]) return;
      if (!balances[split.debtorId].owes[split.payerId]) balances[split.debtorId].owes[split.payerId] = 0;
      if (!balances[split.payerId].owed[split.debtorId]) balances[split.payerId].owed[split.debtorId] = 0;
      balances[split.debtorId].owes[split.payerId] += split.amount;
      balances[split.payerId].owed[split.debtorId] += split.amount;
    });

    const simplifiedDebts = simplifyDebts(balances);
    res.json({ balances: Object.values(balances), simplifiedDebts, settlements });
  } catch (error) {
    next(error);
  }
};

function simplifyDebts(balances) {
  const netBalance = {};
  Object.entries(balances).forEach(([userId, data]) => {
    let net = 0;
    Object.values(data.owed).forEach(amount => net += amount);
    Object.values(data.owes).forEach(amount => net -= amount);
    netBalance[userId] = { user: data.user, net };
  });

  const creditors = Object.entries(netBalance).filter(([, d]) => d.net > 0).sort((a, b) => b[1].net - a[1].net);
  const debtors = Object.entries(netBalance).filter(([, d]) => d.net < 0).sort((a, b) => a[1].net - b[1].net);

  const transactions = [];
  let ci = 0, di = 0;
  const cred = creditors.map(([id, d]) => ({ id, user: d.user, amount: d.net }));
  const debt = debtors.map(([id, d]) => ({ id, user: d.user, amount: -d.net }));

  while (ci < cred.length && di < debt.length) {
    const amount = Math.min(cred[ci].amount, debt[di].amount);
    if (amount > 0.01) {
      transactions.push({ from: debt[di].user, to: cred[ci].user, amount: parseFloat(amount.toFixed(2)) });
    }
    cred[ci].amount -= amount;
    debt[di].amount -= amount;
    if (cred[ci].amount < 0.01) ci++;
    if (debt[di].amount < 0.01) di++;
  }
  return transactions;
}

const settleUp = async (req, res, next) => {
  try {
    const { id: groupId } = req.params;
    const { toUserId, amount, note } = req.body;

    const isMember = await prisma.groupMember.findFirst({ where: { groupId, userId: req.user.id } });
    if (!isMember) return res.status(403).json({ error: 'Not a member' });

    await prisma.$transaction(async (tx) => {
      await tx.settlement.create({
        data: { groupId, fromUserId: req.user.id, toUserId, amount: parseFloat(amount), note },
      });
      await tx.groupExpenseSplit.updateMany({
        where: { payerId: toUserId, debtorId: req.user.id, expense: { groupId }, settled: false },
        data: { settled: true, settledAt: new Date() },
      });
    });

    res.json({ message: 'Settlement recorded successfully' });
  } catch (error) {
    next(error);
  }
};

const deleteGroup = async (req, res, next) => {
  try {
    const { id } = req.params;
    const group = await prisma.group.findFirst({ where: { id, createdBy: req.user.id } });
    if (!group) return res.status(403).json({ error: 'Only group creator can delete it' });
    await prisma.group.delete({ where: { id } });
    res.json({ message: 'Group deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { createGroup, getGroups, getGroup, addMember, removeMember, addGroupExpense, getGroupBalances, settleUp, deleteGroup };
