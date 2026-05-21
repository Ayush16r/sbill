"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.simplifyDebts = simplifyDebts;
/**
 * Minimizes peer-to-peer transactions required to settle a list of net balances.
 *
 * balances: A key-value map of userId to net balance:
 * - Positive (> 0): User is owed money (creditor).
 * - Negative (< 0): User owes money (debtor).
 *
 * Returns an array of transactions containing { from, to, amount } representing the simplified transfers.
 */
function simplifyDebts(balances) {
    // Extract creditors (balance > 0) and debtors (balance < 0)
    const creditors = Object.entries(balances)
        .filter(([, val]) => val > 0.01)
        .map(([id, val]) => ({ userId: id, amount: val }))
        .sort((a, b) => b.amount - a.amount); // descending order
    const debtors = Object.entries(balances)
        .filter(([, val]) => val < -0.01)
        .map(([id, val]) => ({ userId: id, amount: -val })) // store debt as positive for math simplicity
        .sort((a, b) => b.amount - a.amount); // descending order of debt size
    const transactions = [];
    let cIdx = 0;
    let dIdx = 0;
    while (cIdx < creditors.length && dIdx < debtors.length) {
        const creditor = creditors[cIdx];
        const debtor = debtors[dIdx];
        // Determine the transfer amount (the minimum of what debtor owes and what creditor is owed)
        const amountToTransfer = Math.min(creditor.amount, debtor.amount);
        if (amountToTransfer > 0.009) {
            transactions.push({
                from: debtor.userId,
                to: creditor.userId,
                amount: +amountToTransfer.toFixed(2),
            });
        }
        // Deduct transaction amount
        creditor.amount -= amountToTransfer;
        debtor.amount -= amountToTransfer;
        // Advance indexes if balance is fully satisfied
        if (creditor.amount < 0.01) {
            cIdx++;
        }
        if (debtor.amount < 0.01) {
            dIdx++;
        }
    }
    return transactions;
}
