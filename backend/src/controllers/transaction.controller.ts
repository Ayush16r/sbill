import { Response } from 'express';
import { prisma } from '../services/db';
import { AuthRequest } from '../middleware/auth.middleware';

export async function createTransaction(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { type, amount, currency, category, title, note, date, accountId, toAccountId, receiptUrl, groupId, expenseId, isRecurring, recurringPeriod } = req.body;

    if (!type || !amount || !title) {
      return res.status(400).json({ error: 'type, amount, and title are required.' });
    }
    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0.' });
    }
    if (!['INCOME', 'EXPENSE', 'TRANSFER'].includes(type)) {
      return res.status(400).json({ error: 'type must be INCOME, EXPENSE, or TRANSFER.' });
    }
    if (type === 'TRANSFER' && (!accountId || !toAccountId)) {
      return res.status(400).json({ error: 'accountId and toAccountId are required for transfers.' });
    }

    const transaction = await prisma.personalTransaction.create({
      data: {
        userId,
        type,
        amount: parseFloat(amount),
        currency: currency || 'INR',
        category: category || null,
        title,
        note: note || null,
        date: date ? new Date(date) : new Date(),
        accountId: accountId || null,
        toAccountId: toAccountId || null,
        receiptUrl: receiptUrl || null,
        groupId: groupId || null,
        expenseId: expenseId || null,
        isRecurring: isRecurring || false,
        recurringPeriod: recurringPeriod || null,
      },
    });

    // Update account balances
    if (accountId) {
      const delta = type === 'INCOME' ? parseFloat(amount) : -parseFloat(amount);
      await prisma.account.update({
        where: { id: accountId },
        data: { balance: { increment: delta } },
      });
    }
    if (type === 'TRANSFER' && toAccountId) {
      await prisma.account.update({
        where: { id: toAccountId },
        data: { balance: { increment: parseFloat(amount) } },
      });
    }

    return res.status(201).json(transaction);
  } catch (error: any) {
    console.error('Create transaction error:', error);
    return res.status(500).json({ error: 'Failed to create transaction. ' + error.message });
  }
}

export async function getTransactions(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { type, month, year, category, accountId, limit, offset } = req.query;

    const where: any = { userId };

    if (type && ['INCOME', 'EXPENSE', 'TRANSFER'].includes(type as string)) {
      where.type = type as string;
    }
    if (category) {
      where.category = category as string;
    }
    if (accountId) {
      where.OR = [
        { accountId: accountId as string },
        { toAccountId: accountId as string },
      ];
    }

    // Month/year filter
    if (month && year) {
      const m = parseInt(month as string) - 1; // JS months 0-indexed
      const y = parseInt(year as string);
      const startDate = new Date(y, m, 1);
      const endDate = new Date(y, m + 1, 0, 23, 59, 59, 999);
      where.date = { gte: startDate, lte: endDate };
    } else if (year) {
      const y = parseInt(year as string);
      where.date = { gte: new Date(y, 0, 1), lte: new Date(y, 11, 31, 23, 59, 59, 999) };
    }

    const transactions = await prisma.personalTransaction.findMany({
      where,
      orderBy: { date: 'desc' },
      take: limit ? parseInt(limit as string) : 50,
      skip: offset ? parseInt(offset as string) : 0,
      include: {
        account: { select: { id: true, name: true, bankName: true, type: true, icon: true } },
        toAccount: { select: { id: true, name: true, bankName: true, type: true, icon: true } },
      },
    });

    return res.json(transactions);
  } catch (error: any) {
    console.error('Get transactions error:', error);
    return res.status(500).json({ error: 'Failed to fetch transactions. ' + error.message });
  }
}

export async function getTransactionById(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const transaction = await prisma.personalTransaction.findFirst({
      where: { id, userId },
      include: {
        account: { select: { id: true, name: true, bankName: true, type: true, icon: true } },
        toAccount: { select: { id: true, name: true, bankName: true, type: true, icon: true } },
      },
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found.' });
    }
    return res.json(transaction);
  } catch (error: any) {
    console.error('Get transaction by id error:', error);
    return res.status(500).json({ error: 'Failed to fetch transaction. ' + error.message });
  }
}

export async function updateTransaction(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const existing = await prisma.personalTransaction.findFirst({ where: { id, userId } });
    if (!existing) {
      return res.status(404).json({ error: 'Transaction not found.' });
    }

    const { amount, category, title, note, date, accountId, receiptUrl } = req.body;

    // Reverse old account balance if amount changed
    if (amount && parseFloat(amount) !== existing.amount && existing.accountId) {
      const oldDelta = existing.type === 'INCOME' ? -existing.amount : existing.amount;
      await prisma.account.update({
        where: { id: existing.accountId },
        data: { balance: { increment: oldDelta } },
      });
      const newDelta = existing.type === 'INCOME' ? parseFloat(amount) : -parseFloat(amount);
      await prisma.account.update({
        where: { id: existing.accountId },
        data: { balance: { increment: newDelta } },
      });
    }

    const updated = await prisma.personalTransaction.update({
      where: { id },
      data: {
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(category !== undefined && { category }),
        ...(title !== undefined && { title }),
        ...(note !== undefined && { note }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(accountId !== undefined && { accountId }),
        ...(receiptUrl !== undefined && { receiptUrl }),
      },
    });

    return res.json(updated);
  } catch (error: any) {
    console.error('Update transaction error:', error);
    return res.status(500).json({ error: 'Failed to update transaction. ' + error.message });
  }
}

export async function deleteTransaction(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const existing = await prisma.personalTransaction.findFirst({ where: { id, userId } });
    if (!existing) {
      return res.status(404).json({ error: 'Transaction not found.' });
    }

    // Reverse account balance
    if (existing.accountId) {
      const reverseDelta = existing.type === 'INCOME' ? -existing.amount : existing.amount;
      await prisma.account.update({
        where: { id: existing.accountId },
        data: { balance: { increment: reverseDelta } },
      });
    }
    if (existing.type === 'TRANSFER' && existing.toAccountId) {
      await prisma.account.update({
        where: { id: existing.toAccountId },
        data: { balance: { increment: -existing.amount } },
      });
    }

    await prisma.personalTransaction.delete({ where: { id } });
    return res.json({ message: 'Transaction deleted successfully.' });
  } catch (error: any) {
    console.error('Delete transaction error:', error);
    return res.status(500).json({ error: 'Failed to delete transaction. ' + error.message });
  }
}

export async function getTransactionSummary(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { month, year } = req.query;
    const now = new Date();
    const m = month ? parseInt(month as string) - 1 : now.getMonth();
    const y = year ? parseInt(year as string) : now.getFullYear();

    const startDate = new Date(y, m, 1);
    const endDate = new Date(y, m + 1, 0, 23, 59, 59, 999);

    const transactions = await prisma.personalTransaction.findMany({
      where: {
        userId,
        date: { gte: startDate, lte: endDate },
      },
    });

    const income = transactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = income - expenses;

    // Category breakdown for expenses
    const categoryMap: Record<string, number> = {};
    transactions
      .filter(t => t.type === 'EXPENSE')
      .forEach(t => {
        const cat = t.category || 'other';
        categoryMap[cat] = (categoryMap[cat] || 0) + t.amount;
      });

    const categoryBreakdown = Object.entries(categoryMap)
      .map(([category, amount]) => ({
        category,
        amount: +amount.toFixed(2),
        percentage: expenses > 0 ? +((amount / expenses) * 100).toFixed(1) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    return res.json({
      month: m + 1,
      year: y,
      income: +income.toFixed(2),
      expenses: +expenses.toFixed(2),
      balance: +balance.toFixed(2),
      transactionCount: transactions.length,
      categoryBreakdown,
    });
  } catch (error: any) {
    console.error('Get transaction summary error:', error);
    return res.status(500).json({ error: 'Failed to fetch summary. ' + error.message });
  }
}
