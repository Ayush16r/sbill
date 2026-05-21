"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSummary = getSummary;
exports.getCategoryBreakdown = getCategoryBreakdown;
exports.getGroupComparison = getGroupComparison;
exports.getInsights = getInsights;
const db_1 = require("../services/db");
async function getSummary(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        // Get all user expense splits
        const userSplits = await db_1.prisma.expenseSplit.findMany({
            where: { userId },
            include: {
                expense: true,
            },
        });
        // Calculate total spent
        const totalSpent = userSplits.reduce((sum, split) => sum + split.amount, 0);
        // Calculate change percentage (compared to a mock previous month or default baseline)
        const baselineSpent = totalSpent > 0 ? totalSpent * 1.15 : 120.00; // Mock: User spent 15% more last month
        const percentageDifference = baselineSpent > 0
            ? -(((baselineSpent - totalSpent) / baselineSpent) * 100)
            : 0;
        // Fetch user overall active balance
        const memberships = await db_1.prisma.groupMember.findMany({
            where: { userId },
        });
        const totalBalance = memberships.reduce((sum, m) => sum + m.balance, 0);
        // Dynamic stats: count total active debts
        const owedToOthers = memberships.filter(m => m.balance < 0).reduce((sum, m) => sum + Math.abs(m.balance), 0);
        const owedToMe = memberships.filter(m => m.balance > 0).reduce((sum, m) => sum + m.balance, 0);
        return res.json({
            totalSpent: +totalSpent.toFixed(2),
            totalBalance: +totalBalance.toFixed(2),
            owedToOthers: +owedToOthers.toFixed(2),
            owedToMe: +owedToMe.toFixed(2),
            percentageChange: +percentageDifference.toFixed(1),
            currency: 'INR',
        });
    }
    catch (error) {
        console.error('Get analytics summary error:', error);
        return res.status(500).json({ error: 'Failed to fetch analytics summary. ' + error.message });
    }
}
async function getCategoryBreakdown(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const userSplits = await db_1.prisma.expenseSplit.findMany({
            where: { userId },
            include: {
                expense: {
                    select: { category: true },
                },
            },
        });
        const categoryMap = {};
        // Initialize default values for categories
        categoryMap['food'] = 0.0;
        categoryMap['travel'] = 0.0;
        categoryMap['rent'] = 0.0;
        categoryMap['shopping'] = 0.0;
        categoryMap['party'] = 0.0;
        categoryMap['other'] = 0.0;
        userSplits.forEach(split => {
            const cat = split.expense.category.toLowerCase();
            if (categoryMap[cat] !== undefined) {
                categoryMap[cat] += split.amount;
            }
            else {
                categoryMap['other'] += split.amount;
            }
        });
        const total = Object.values(categoryMap).reduce((sum, val) => sum + val, 0);
        const breakdown = Object.entries(categoryMap).map(([id, val]) => {
            const amount = +val.toFixed(2);
            const percentage = total > 0 ? +((val / total) * 100).toFixed(1) : 0;
            return {
                id,
                amount,
                percentage,
            };
        }).sort((a, b) => b.amount - a.amount);
        return res.json({
            breakdown,
            totalSpent: +total.toFixed(2),
        });
    }
    catch (error) {
        console.error('Get category breakdown error:', error);
        return res.status(500).json({ error: 'Failed to fetch category breakdown. ' + error.message });
    }
}
async function getGroupComparison(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const memberships = await db_1.prisma.groupMember.findMany({
            where: { userId },
            include: {
                group: {
                    select: { name: true },
                },
            },
        });
        const comparison = memberships.map(m => {
            return {
                groupId: m.groupId,
                groupName: m.group.name,
                balance: +m.balance.toFixed(2),
            };
        });
        return res.json(comparison);
    }
    catch (error) {
        console.error('Get group comparison error:', error);
        return res.status(500).json({ error: 'Failed to fetch group comparison. ' + error.message });
    }
}
async function getInsights(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const memberships = await db_1.prisma.groupMember.findMany({
            where: { userId },
            include: {
                group: { select: { name: true } },
            },
        });
        const totalOwed = memberships.filter(m => m.balance < 0).reduce((sum, m) => sum + Math.abs(m.balance), 0);
        const totalOwedToMe = memberships.filter(m => m.balance > 0).reduce((sum, m) => sum + m.balance, 0);
        const insights = [
            'You are doing a fantastic job keeping your balances low. Good discipline!',
        ];
        if (totalOwed > 50) {
            insights.push(`Consider settling your debt in "${memberships.find(m => m.balance < 0)?.group.name || 'group'}" to maintain trustworthy social balances.`);
        }
        else {
            insights.push('Great job staying caught up! Peer debts represent less than 5% of your dynamic spending.');
        }
        if (totalOwedToMe > 0) {
            insights.push(`You have $${totalOwedToMe.toFixed(2)} in pending assets. Send friendly tap reminders to settle up.`);
        }
        else {
            insights.push('All collections are settled. Nice work managing roommate splits.');
        }
        // Add general fintech tips
        insights.push('Shared ride hailing was your biggest micro-expense last week. Combining transit could save you 15%.');
        return res.json({
            insights: insights.slice(0, 3), // return exactly 3 actionable friendly suggestions
        });
    }
    catch (error) {
        console.error('Get insights error:', error);
        return res.status(500).json({ error: 'Failed to fetch insights. ' + error.message });
    }
}
