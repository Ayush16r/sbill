import { Response } from 'express';
import { prisma } from '../services/db';
import { AuthRequest } from '../middleware/auth.middleware';

export async function createBudget(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { category, name, amount, currency, period, startDate, endDate } = req.body;

    if (!category || !name || !amount) {
      return res.status(400).json({ error: 'category, name, and amount are required.' });
    }
    if (amount <= 0) {
      return res.status(400).json({ error: 'Budget amount must be greater than 0.' });
    }

    // Check if active budget for this category already exists
    const existing = await prisma.budget.findFirst({
      where: { userId, category, isActive: true },
    });
    if (existing) {
      return res.status(409).json({ error: `An active budget for "${category}" already exists.` });
    }

    const budget = await prisma.budget.create({
      data: {
        userId,
        category,
        name,
        amount: parseFloat(amount),
        currency: currency || 'INR',
        period: period || 'MONTHLY',
        startDate: startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        endDate: endDate ? new Date(endDate) : null,
        isActive: true,
      },
    });

    return res.status(201).json(budget);
  } catch (error: any) {
    console.error('Create budget error:', error);
    return res.status(500).json({ error: 'Failed to create budget. ' + error.message });
  }
}

export async function getBudgets(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const budgets = await prisma.budget.findMany({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate spent amount for each budget from personal transactions
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const budgetsWithSpent = await Promise.all(
      budgets.map(async (budget) => {
        const spent = await prisma.personalTransaction.aggregate({
          where: {
            userId,
            type: 'EXPENSE',
            category: budget.category,
            date: { gte: monthStart, lte: monthEnd },
          },
          _sum: { amount: true },
        });

        const spentAmount = spent._sum.amount || 0;
        const percentage = budget.amount > 0 ? +((spentAmount / budget.amount) * 100).toFixed(1) : 0;

        return {
          ...budget,
          spentAmount: +spentAmount.toFixed(2),
          percentage,
          remaining: +(budget.amount - spentAmount).toFixed(2),
          status: percentage >= 100 ? 'exceeded' : percentage >= 75 ? 'warning' : 'safe',
        };
      })
    );

    return res.json(budgetsWithSpent);
  } catch (error: any) {
    console.error('Get budgets error:', error);
    return res.status(500).json({ error: 'Failed to fetch budgets. ' + error.message });
  }
}

export async function getBudgetById(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const budget = await prisma.budget.findFirst({ where: { id, userId } });
    if (!budget) {
      return res.status(404).json({ error: 'Budget not found.' });
    }

    // Get related transactions
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const transactions = await prisma.personalTransaction.findMany({
      where: {
        userId,
        type: 'EXPENSE',
        category: budget.category,
        date: { gte: monthStart, lte: monthEnd },
      },
      orderBy: { date: 'desc' },
      include: {
        account: { select: { id: true, name: true, bankName: true, type: true } },
      },
    });

    const spentAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
    const percentage = budget.amount > 0 ? +((spentAmount / budget.amount) * 100).toFixed(1) : 0;

    return res.json({
      ...budget,
      spentAmount: +spentAmount.toFixed(2),
      percentage,
      remaining: +(budget.amount - spentAmount).toFixed(2),
      status: percentage >= 100 ? 'exceeded' : percentage >= 75 ? 'warning' : 'safe',
      transactions,
    });
  } catch (error: any) {
    console.error('Get budget by id error:', error);
    return res.status(500).json({ error: 'Failed to fetch budget. ' + error.message });
  }
}

export async function updateBudget(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const existing = await prisma.budget.findFirst({ where: { id, userId } });
    if (!existing) {
      return res.status(404).json({ error: 'Budget not found.' });
    }

    const { name, amount, period, endDate, isActive } = req.body;

    const updated = await prisma.budget.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(period !== undefined && { period }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return res.json(updated);
  } catch (error: any) {
    console.error('Update budget error:', error);
    return res.status(500).json({ error: 'Failed to update budget. ' + error.message });
  }
}

export async function deleteBudget(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const existing = await prisma.budget.findFirst({ where: { id, userId } });
    if (!existing) {
      return res.status(404).json({ error: 'Budget not found.' });
    }

    await prisma.budget.delete({ where: { id } });
    return res.json({ message: 'Budget deleted successfully.' });
  } catch (error: any) {
    console.error('Delete budget error:', error);
    return res.status(500).json({ error: 'Failed to delete budget. ' + error.message });
  }
}
