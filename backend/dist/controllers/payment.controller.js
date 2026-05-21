"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPayment = sendPayment;
exports.getPaymentHistory = getPaymentHistory;
exports.getPaymentMethods = getPaymentMethods;
exports.addPaymentMethod = addPaymentMethod;
exports.removePaymentMethod = removePaymentMethod;
const db_1 = require("../services/db");
async function sendPayment(req, res) {
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
        const payment = await db_1.prisma.$transaction(async (tx) => {
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
    }
    catch (error) {
        console.error('Send payment error:', error);
        return res.status(500).json({ error: 'Failed to record payment. ' + error.message });
    }
}
async function getPaymentHistory(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const payments = await db_1.prisma.payment.findMany({
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
    }
    catch (error) {
        console.error('Get payments error:', error);
        return res.status(500).json({ error: 'Failed to fetch payment history. ' + error.message });
    }
}
async function getPaymentMethods(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const methods = await db_1.prisma.paymentMethod.findMany({
            where: { userId },
            orderBy: { isDefault: 'desc' },
        });
        return res.json(methods);
    }
    catch (error) {
        console.error('Get payment methods error:', error);
        return res.status(500).json({ error: 'Failed to fetch payment methods. ' + error.message });
    }
}
async function addPaymentMethod(req, res) {
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
        const existingMethodsCount = await db_1.prisma.paymentMethod.count({
            where: { userId },
        });
        const method = await db_1.prisma.paymentMethod.create({
            data: {
                userId,
                type,
                displayName,
                last4: last4 || null,
                isDefault: existingMethodsCount === 0, // default if first payment method
            },
        });
        return res.status(201).json(method);
    }
    catch (error) {
        console.error('Add payment method error:', error);
        return res.status(500).json({ error: 'Failed to save payment method. ' + error.message });
    }
}
async function removePaymentMethod(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const method = await db_1.prisma.paymentMethod.findUnique({
            where: { id },
        });
        if (!method || method.userId !== userId) {
            return res.status(403).json({ error: 'Payment method not found or unauthorized.' });
        }
        await db_1.prisma.paymentMethod.delete({
            where: { id },
        });
        return res.json({ message: 'Payment method successfully removed.' });
    }
    catch (error) {
        console.error('Remove payment method error:', error);
        return res.status(500).json({ error: 'Failed to remove payment method. ' + error.message });
    }
}
