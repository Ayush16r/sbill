import { Response } from 'express';
import { prisma } from '../services/db';
import { AuthRequest } from '../middleware/auth.middleware';

export async function sendPayment(req: AuthRequest, res: Response) {
  try {
    const { receiverId, amount, currency, note, groupId, method } = req.body;
    const senderId = req.user?.id;

    if (!senderId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!receiverId || !amount) {
      return res.status(400).json({ error: 'Receiver ID and amount are required.' });
    }

    // Execute payment and adjust group balances inside a transaction
    const payment = await prisma.$transaction(async (tx) => {
      // 1. Create the Payment record
      const pay = await tx.payment.create({
        data: {
          senderId,
          receiverId,
          amount,
          currency: currency || 'INR',
          note: note || null,
          groupId: groupId || null,
          method: method || 'CARD',
          status: 'COMPLETED',
          completedAt: new Date(),
          transactionId: `TX_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        },
      });

      // 2. Adjust cached GroupMember balances if payment is linked to a group
      if (groupId) {
        // Sender reduces their debt (gets +amount)
        await tx.groupMember.update({
          where: {
            userId_groupId: {
              userId: senderId,
              groupId,
            },
          },
          data: {
            balance: {
              increment: amount,
            },
          },
        });

        // Receiver reduces their claim (gets -amount)
        await tx.groupMember.update({
          where: {
            userId_groupId: {
              userId: receiverId,
              groupId,
            },
          },
          data: {
            balance: {
              decrement: amount,
            },
          },
        });
      }

      return pay;
    });

    return res.status(201).json(payment);
  } catch (error: any) {
    console.error('Send payment error:', error);
    return res.status(500).json({ error: 'Failed to record payment. ' + error.message });
  }
}

export async function getPaymentHistory(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const payments = await prisma.payment.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true },
        },
        receiver: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    return res.json(payments);
  } catch (error: any) {
    console.error('Get payments error:', error);
    return res.status(500).json({ error: 'Failed to fetch payment history. ' + error.message });
  }
}

export async function getPaymentMethods(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const methods = await prisma.paymentMethod.findMany({
      where: { userId },
      orderBy: { isDefault: 'desc' },
    });

    return res.json(methods);
  } catch (error: any) {
    console.error('Get payment methods error:', error);
    return res.status(500).json({ error: 'Failed to fetch payment methods. ' + error.message });
  }
}

export async function addPaymentMethod(req: AuthRequest, res: Response) {
  try {
    const { type, displayName, last4 } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!type || !displayName) {
      return res.status(400).json({ error: 'Payment type and display name are required.' });
    }

    // Check if user already has saved payment methods to set default status
    const existingMethodsCount = await prisma.paymentMethod.count({
      where: { userId },
    });

    const method = await prisma.paymentMethod.create({
      data: {
        userId,
        type,
        displayName,
        last4: last4 || null,
        isDefault: existingMethodsCount === 0, // default if first payment method
      },
    });

    return res.status(201).json(method);
  } catch (error: any) {
    console.error('Add payment method error:', error);
    return res.status(500).json({ error: 'Failed to save payment method. ' + error.message });
  }
}

export async function removePaymentMethod(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const method = await prisma.paymentMethod.findUnique({
      where: { id },
    });

    if (!method || method.userId !== userId) {
      return res.status(403).json({ error: 'Payment method not found or unauthorized.' });
    }

    await prisma.paymentMethod.delete({
      where: { id },
    });

    return res.json({ message: 'Payment method successfully removed.' });
  } catch (error: any) {
    console.error('Remove payment method error:', error);
    return res.status(500).json({ error: 'Failed to remove payment method. ' + error.message });
  }
}
