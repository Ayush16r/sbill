"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createExpense = createExpense;
exports.getExpenses = getExpenses;
exports.getExpenseDetails = getExpenseDetails;
exports.deleteExpense = deleteExpense;
const db_1 = require("../services/db");
const splitEngine_1 = require("../utils/splitEngine");
async function createExpense(req, res) {
    try {
        const { title, amount, category, groupId, splitType, participants, customValues, date, notes, receiptUrl, currency } = req.body;
        const paidById = req.user?.id;
        if (!paidById) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        if (!title || !amount || !category || !splitType || !participants || participants.length === 0) {
            return res.status(400).json({ error: 'Missing required expense fields.' });
        }
        // Calculate splits using mathematical engine
        const calculatedSplits = (0, splitEngine_1.calculateSplits)(amount, participants, splitType, customValues);
        // Create expense and update balances inside a Prisma transaction
        const expense = await db_1.prisma.$transaction(async (tx) => {
            // 1. Create the base Expense
            const exp = await tx.expense.create({
                data: {
                    title,
                    amount,
                    category,
                    paidById,
                    groupId: groupId || null,
                    splitType,
                    date: date ? new Date(date) : new Date(),
                    notes: notes || null,
                    receiptUrl: receiptUrl || null,
                    currency: currency || 'INR',
                    splits: {
                        create: calculatedSplits.map(s => ({
                            userId: s.userId,
                            amount: s.amount,
                            percentage: s.percentage,
                            shares: s.shares || null,
                            isPaid: s.userId === paidById, // Payer has already paid their part
                            paidAt: s.userId === paidById ? new Date() : null,
                        })),
                    },
                },
                include: {
                    splits: true,
                    paidBy: {
                        select: { id: true, name: true, avatar: true },
                    },
                },
            });
            // 2. If it belongs to a group, update cached balances and group total expense
            if (groupId) {
                // Increment total group expenses
                await tx.group.update({
                    where: { id: groupId },
                    data: { totalExpense: { increment: amount } },
                });
                // Update each participant's cached balance in the group
                for (const split of calculatedSplits) {
                    const isPayer = split.userId === paidById;
                    const netBalanceChange = isPayer ? (amount - split.amount) : -split.amount;
                    await tx.groupMember.update({
                        where: {
                            userId_groupId: {
                                userId: split.userId,
                                groupId,
                            },
                        },
                        data: {
                            balance: {
                                increment: netBalanceChange,
                            },
                        },
                    });
                }
            }
            return exp;
        });
        return res.status(201).json(expense);
    }
    catch (error) {
        console.error('Create expense error:', error);
        return res.status(500).json({ error: 'Failed to create expense. ' + error.message });
    }
}
async function getExpenses(req, res) {
    try {
        const userId = req.user?.id;
        const { groupId } = req.query;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const whereClause = {};
        if (groupId) {
            whereClause.groupId = groupId;
        }
        else {
            // Find all expenses in groups where user is a member
            const memberGroups = await db_1.prisma.groupMember.findMany({
                where: { userId },
                select: { groupId: true },
            });
            const groupIds = memberGroups.map(mg => mg.groupId);
            whereClause.OR = [
                { groupId: { in: groupIds } },
                { paidById: userId },
                { splits: { some: { userId } } },
            ];
        }
        const expenses = await db_1.prisma.expense.findMany({
            where: whereClause,
            orderBy: { date: 'desc' },
            include: {
                paidBy: {
                    select: { id: true, name: true, avatar: true },
                },
                splits: {
                    include: {
                        user: {
                            select: { id: true, name: true, avatar: true },
                        },
                    },
                },
            },
        });
        return res.json(expenses);
    }
    catch (error) {
        console.error('Get expenses error:', error);
        return res.status(500).json({ error: 'Failed to fetch expenses. ' + error.message });
    }
}
async function getExpenseDetails(req, res) {
    try {
        const { id } = req.params;
        const expense = await db_1.prisma.expense.findUnique({
            where: { id },
            include: {
                paidBy: {
                    select: { id: true, name: true, avatar: true },
                },
                splits: {
                    include: {
                        user: {
                            select: { id: true, name: true, avatar: true },
                        },
                    },
                },
            },
        });
        if (!expense) {
            return res.status(404).json({ error: 'Expense not found' });
        }
        return res.json(expense);
    }
    catch (error) {
        console.error('Get expense details error:', error);
        return res.status(500).json({ error: 'Failed to fetch details. ' + error.message });
    }
}
async function deleteExpense(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const expense = await db_1.prisma.expense.findUnique({
            where: { id },
            include: { splits: true },
        });
        if (!expense) {
            return res.status(404).json({ error: 'Expense not found' });
        }
        // Verify user is the payer or admin of the group (for this simple app, creator is authorized)
        if (expense.paidById !== userId) {
            return res.status(403).json({ error: 'You are not authorized to delete this expense.' });
        }
        // Delete and reverse balances inside transaction
        await db_1.prisma.$transaction(async (tx) => {
            if (expense.groupId) {
                // Decrement group total expenses
                await tx.group.update({
                    where: { id: expense.groupId },
                    data: { totalExpense: { decrement: expense.amount } },
                });
                // Reverse member cached balances
                for (const split of expense.splits) {
                    const isPayer = split.userId === expense.paidById;
                    const netBalanceChange = isPayer
                        ? -(expense.amount - split.amount)
                        : split.amount;
                    await tx.groupMember.update({
                        where: {
                            userId_groupId: {
                                userId: split.userId,
                                groupId: expense.groupId,
                            },
                        },
                        data: {
                            balance: {
                                increment: netBalanceChange,
                            },
                        },
                    });
                }
            }
            // Delete splits and expense
            await tx.expenseSplit.deleteMany({
                where: { expenseId: id },
            });
            await tx.expense.delete({
                where: { id },
            });
        });
        return res.json({ message: 'Expense successfully deleted.' });
    }
    catch (error) {
        console.error('Delete expense error:', error);
        return res.status(500).json({ error: 'Failed to delete expense. ' + error.message });
    }
}
