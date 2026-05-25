import { Response } from 'express';
import { prisma } from '../services/db';
import { AuthRequest } from '../middleware/auth.middleware';

export async function createAccount(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { name, type, balance, currency, bankName, accountLast4, icon, isDefault } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Account name is required.' });
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.account.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const account = await prisma.account.create({
      data: {
        userId,
        name,
        type: type || 'BANK',
        balance: balance ? parseFloat(balance) : 0,
        currency: currency || 'INR',
        bankName: bankName || null,
        accountLast4: accountLast4 || null,
        icon: icon || null,
        isDefault: isDefault || false,
      },
    });

    return res.status(201).json(account);
  } catch (error: any) {
    console.error('Create account error:', error);
    return res.status(500).json({ error: 'Failed to create account. ' + error.message });
  }
}

export async function getAccounts(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const accounts = await prisma.account.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return res.json(accounts);
  } catch (error: any) {
    console.error('Get accounts error:', error);
    return res.status(500).json({ error: 'Failed to fetch accounts. ' + error.message });
  }
}

export async function updateAccount(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const existing = await prisma.account.findFirst({ where: { id, userId } });
    if (!existing) {
      return res.status(404).json({ error: 'Account not found.' });
    }

    const { name, type, balance, bankName, accountLast4, icon, isDefault } = req.body;

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.account.updateMany({
        where: { userId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.account.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(balance !== undefined && { balance: parseFloat(balance) }),
        ...(bankName !== undefined && { bankName }),
        ...(accountLast4 !== undefined && { accountLast4 }),
        ...(icon !== undefined && { icon }),
        ...(isDefault !== undefined && { isDefault }),
      },
    });

    return res.json(updated);
  } catch (error: any) {
    console.error('Update account error:', error);
    return res.status(500).json({ error: 'Failed to update account. ' + error.message });
  }
}

export async function deleteAccount(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const existing = await prisma.account.findFirst({ where: { id, userId } });
    if (!existing) {
      return res.status(404).json({ error: 'Account not found.' });
    }

    // Check if account has linked transactions
    const txCount = await prisma.personalTransaction.count({
      where: { OR: [{ accountId: id }, { toAccountId: id }] },
    });
    if (txCount > 0) {
      return res.status(409).json({
        error: `Cannot delete account with ${txCount} linked transaction(s). Reassign or delete them first.`,
      });
    }

    await prisma.account.delete({ where: { id } });
    return res.json({ message: 'Account deleted successfully.' });
  } catch (error: any) {
    console.error('Delete account error:', error);
    return res.status(500).json({ error: 'Failed to delete account. ' + error.message });
  }
}
